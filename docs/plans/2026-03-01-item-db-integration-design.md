# Item DB Integration — Design Report
*Date: 2026-03-01 | Status: Draft — pending review*

---

## 1. The Three-Phase Data Flow

### Phase 0: Database Load (outside Item)

```
CSV / InMemoryStore
  → loadSeedFromCsvUrl() / createDatabase()
  → 4 reference tables in memory:
      ITEM_CATALOGO, CATEGORIAS, PERFILES_PRECIO, REGLAS_NEGOCIO
  → 5 transactional tables in memory:
      COTIZACIONES, LINEA_DETALLE, AJUSTES_COTIZACION,
      CACHE_COTIZACION, HISTORIAL_COTIZACION
  → 1 structural table:
      COMPOSICION_KIT
```

The database machine (`packages/database/src/machine/databaseMachine.js`) already handles
all 11 tables. The mount function `mountDatabasePlayground.js` calls `loadSeedFromCsvUrl()`
and creates the actor.

**`resolveItemDefinition(itemId, db)`** — pure 4-way join. ✅ Implemented at `packages/database/src/resolveItemDefinition.js`. Touches only the 4 reference tables. Contract: `plan/III-1-resolver/field_contracts.md`.

---

### Phase 1: Catalog State

**Entry:** `Item.fromDefinition(resolvedDef)` normalizes `ResolvedItemDefinition` to
internal camelCase and calls `initialize({ mode: 'catalog', externalContext: {} })`.

**Data present in `definition` after normalization:**

| Internal field | Source DB field | Table |
|---|---|---|
| `definition.id` | `ID_Item` | ITEM_CATALOGO |
| `definition.name` | `Nombre` | ITEM_CATALOGO |
| `definition.description` | `Default_Glosa` | ITEM_CATALOGO |
| `definition.category` | `categoria.Nombre` | CATEGORIAS |
| `definition.categoriaIcono` | `categoria.Icono_UI` | CATEGORIAS |
| `definition.pricingProfile.baseFijo` | `perfil.Costo_Base_Fijo` | PERFILES_PRECIO |
| `definition.pricingProfile.porPersona` | `perfil.Costo_Unitario_Pax` | PERFILES_PRECIO |
| `definition.pricingProfile.porMinuto` | `perfil.Costo_Unitario_Tiempo` | PERFILES_PRECIO |
| `definition.pricingProfile.porUnidad` | `perfil.Costo_Unitario_Item` | PERFILES_PRECIO |
| `definition.defaultQuantities.duracionMin` | `categoria.Def_Duracion_Min` | CATEGORIAS |
| `definition.defaultQuantities.unidadesPorUsuario` | `item.Def_Unidades_Por_Pax_Override ?? categoria.Def_Unidades_Por_Pax` | ITEM_CATALOGO / CATEGORIAS |
| `definition.defaultQuantities.requierePax` | `categoria.Def_Requiere_Pax` | CATEGORIAS |
| `definition.defaultQuantities.requiereCant` | `categoria.Def_Requiere_Cant` | CATEGORIAS |
| `definition.defaultQuantities.requiereTiempo` | `categoria.Def_Requiere_Tiempo` | CATEGORIAS |
| `definition.defaultQuantities.requiereHora` | `categoria.Def_Requiere_Hora` | CATEGORIAS |
| `definition.rules` | `reglas[]` filtered: RESTRICCION_UI + ITEM scope | REGLAS_NEGOCIO |

**`externalContext` starts empty** — `{ paxGlobal: 0, dia: 1, hora: '09:00' }`.
No container has pushed data yet.

**What `calculate()` produces in catalog mode:**

`paxGlobal = 0` so `total = baseFijo` or `0`. The catalog card displays the **formula
string** (from `formatCatalogTerms()`), not a numeric total:
- `"CLP 4.600 × pax"` for PAX items
- `"CLP 120.000 base fija"` for FIXED items

Rules evaluate against `{ pax: 0, ... }` — a rule "pax ≥ 20" fires even in catalog,
surfacing the constraint before the user adds the item.

---

### Phase 2: Basket State

> **Implementation note:** The basket pricing logic is fully working in the current `ItemStandalone` playground (`packages/components/item/ui/ItemStandalone.html` + `createItemStandaloneComponent.js`). The `calculate()` flow, override controls, `basketLine` projection, and rule display are all live. The DB integration does **not** redesign this — it only changes the entry point from `fromSeed()` to `fromDefinition()`. Everything else stays as-is.

**Entry:** `ADD_TO_BASKET` event → `item.setMode('basket')` → `calculate()`.

Then the container (Category or Basket) pushes context via `SET_CONTEXT`:
```
{ paxGlobal: 100, dia: 1, hora: '09:00' }
```
Source: `COTIZACIONES.Pax_Global`, `COTIZACIONES.Fecha_Evento`.

**What changes in `calculate()` with real context:**
- `resolveBasketQuantity()` uses `paxGlobal=100`
- `PricingKind.PAX` + `InitializationMode.CONTEXT_PAX` → `quantity = 100`
- `total = baseFijo + 100 × rate`

**Persistence target: `LINEA_DETALLE`**
When a basket item is saved, its state maps to a `LINEA_DETALLE` row:

| LINEA_DETALLE column | Item state source |
|---|---|
| `ID_Linea` | `basketLine.lineId` (assigned by quotation layer, `null` until saved) |
| `ID_Cotizacion` | comes from quotation context (not owned by item) |
| `ID_Item` | `definition.id` |
| `Estado_Linea` | managed by basket/quotation layer (`'ACTIVA'`) |
| `Dia_Numero` | `overrides.dia` ?? `externalContext.dia` |
| `Hora_Inicio` | `overrides.hora` ?? `externalContext.hora` |
| `Override_Pax` | `overrides.pax` (null if not user-set) |
| `Override_Cantidad` | `overrides.cantidad` (null if not user-set) |
| `Override_Duracion_Min` | `overrides.duracionMin` (null if not user-set) |
| `Comentarios` | `overrides.comentarios` |

`Item.toSeed()` / `Item.fromSeed()` are the serialization bridge for this mapping.
The Item class itself does not read/write LINEA_DETALLE directly.

---

## 2. Code Sources — What Comes From Where

### Existing code — no changes needed

| File | Status | Why |
|---|---|---|
| `domain/pricing.js` | ✅ Untouched | `normalizeProfile()` already handles both `baseFijo` AND `Costo_Base_Fijo` |
| `domain/quantity.js` | ✅ Untouched | Pure functions, only receive normalized internal shape |
| `domain/formatting.js` | ✅ Untouched | |
| `domain/schedule.js` | ✅ Untouched | |
| `domain/rulesEngine/coordinator.js` | ✅ Untouched | Already uses DB field names natively |
| `machine/itemMachine.js` | ✅ Untouched | Closure pattern works with any entry factory |
| `Item.fromSeed()` | ✅ Untouched | Backward compat for all 462 existing tests |
| `Item.initialize()` / `calculate()` | ✅ Untouched | |
| All mutations, getters, projections | ✅ Untouched | |

### Changes to existing code

#### `Item.fromDefinition()` (lines 77–84)

Currently a transparent passthrough. Becomes the DB normalization entry point:

```js
static fromDefinition(resolvedDef, options = {}) {
  const item = new Item();
  const definition = {
    id:             resolvedDef.ID_Item,
    name:           resolvedDef.Nombre,
    description:    resolvedDef.Default_Glosa,
    category:       resolvedDef.categoria?.Nombre,
    categoriaIcono: resolvedDef.categoria?.Icono_UI ?? null,
    pricingProfile: {
      baseFijo:   resolvedDef.perfil?.Costo_Base_Fijo       ?? 0,
      porPersona: resolvedDef.perfil?.Costo_Unitario_Pax    ?? 0,
      porMinuto:  resolvedDef.perfil?.Costo_Unitario_Tiempo ?? 0,
      porUnidad:  resolvedDef.perfil?.Costo_Unitario_Item   ?? 0,
    },
    defaultQuantities: {
      duracionMin:        resolvedDef.categoria?.Def_Duracion_Min ?? 0,
      unidadesPorUsuario: resolvedDef.Def_Unidades_Por_Pax_Override
                       ?? resolvedDef.categoria?.Def_Unidades_Por_Pax ?? 0,
      requierePax:    resolvedDef.categoria?.Def_Requiere_Pax    ?? false,
      requiereCant:   resolvedDef.categoria?.Def_Requiere_Cant   ?? false,
      requiereTiempo: resolvedDef.categoria?.Def_Requiere_Tiempo ?? false,
      requiereHora:   resolvedDef.categoria?.Def_Requiere_Hora   ?? false,
    },
    rules: resolvedDef.reglas ?? [],
  };
  return item.initialize({
    mode: 'catalog',
    definition,
    externalContext: options.externalContext || {},
    overrides: options.overrides || {}
  });
}
```

#### `Item.toDisplayObject()` — 4 new visibility flags

```js
showPax:      this.#definition.defaultQuantities?.requierePax    ?? false,
showCantidad: this.#definition.defaultQuantities?.requiereCant   ?? false,
showDuracion: this.#definition.defaultQuantities?.requiereTiempo ?? false,
showHora:     this.#definition.defaultQuantities?.requiereHora   ?? false,
```

Note: distinct from existing `showPaxControl` / `showUnitsControl` / `showTimeControl`
(those are pricing-kind-driven). Category flags and pricing kind should normally agree
but can diverge (e.g., capacity tracking without per-pax pricing).

### New code to create

#### `packages/database/src/resolveItemDefinition.js`

Pure 4-way join. Contract: `plan/III-1-resolver/field_contracts.md`.

```js
export function resolveItemDefinition(itemId, { items, categorias, perfiles, reglas }) {
  const item = items.find(r => r.ID_Item === itemId);
  if (!item) throw new Error(`Item not found: ${itemId}`);

  const categoria = categorias.find(c => c.ID_Categoria === item.ID_Categoria);
  if (!categoria) throw new Error(`Category not found: ${item.ID_Categoria}`);

  const perfilId = item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default;
  const perfil = perfiles.find(p => p.ID_Perfil_Precio === perfilId);
  if (!perfil) throw new Error(`Profile not found: ${perfilId}`);

  const itemReglas = (reglas || [])
    .filter(r =>
      r.Activo === true &&
      r.Scope === 'ITEM' &&
      r.Etapa === 'RESTRICCION_UI' &&
      (r.ID_Componente == null || r.ID_Componente === itemId)
    )
    .sort((a, b) => (a.Prioridad || 0) - (b.Prioridad || 0));

  return { ...item, categoria, perfil, reglas: itemReglas };
}
```

Export from `packages/database/index.js`.

### Changes to the playground mount

| Remove | Keep | Add |
|---|---|---|
| `createDefaultSeed()` | Entire `itemStandaloneComponent` Alpine structure | Async DB load via `loadSeedFromCsvUrl` |
| `mergeSeed()` | Override controls | `resolveItemDefinition()` call |
| `SET_PROFILE_VALUE` / `SET_DEFAULT_QUANTITY` event wiring | Rules display | Item selector dropdown state |
| Manual profile sliders in HTML | External context panel | `loadItem(itemId)` replacing actor |

---

## 3. The Quantity Logic Bridge

`detectInitializationMode()` in `quantity.js` reads specific internal keys:

| Internal key | DB source | Effect |
|---|---|---|
| `defaults.duracionMin > 0` | `Def_Duracion_Min` | `FIXED_AMOUNT` for TIME items |
| `defaults.unidadesPorUsuario > 0` | `Def_Unidades_Por_Pax` | `CONTEXT_PAX` for UNITS items |
| `defaults.cantidad > 0` | (no direct DB source) | `FIXED_AMOUNT` for UNITS items |

The most non-obvious bridge: `Def_Unidades_Por_Pax` (a category field) ends up
driving `InitializationMode` inside a pricing function that knows nothing about DB names.

---

## 4. Resolved Design Decisions

1. **Catalog display:** The catalog card shows only the **humanized formula string** and any **active rules**. No numeric total is computed in catalog mode. A PAX item shows `"CLP 4.600 × pax"`, a FIXED item shows `"CLP 120.000 base fija"`. Pricing only becomes concrete once the item moves to basket and receives real context.

2. **`showPax` / `showPaxControl` alignment:** `Def_Requiere_Pax = false` implies `Costo_Unitario_Pax = 0` — a non-pax item never has a per-person cost. These two always agree; any divergence is a data entry error in the DB, not a design ambiguity. Use `Def_Requiere_Pax` (from the category definition) as the authoritative UI visibility flag.

3. **`COMPOSICION_KIT`:** Out of scope for the Item step. Kit composition is a separate future step (`resolveKitDefinition()`). `resolveItemDefinition()` does not touch this table.

4. **`AJUSTES_COTIZACION` / price overrides:** The system only allows overriding **quantities** (pax, cantidad, duracionMin). Direct price overrides are not part of the Item model. `AJUSTES_COTIZACION` is a quotation-level concern and is out of scope here.

---

## 5. Implementation Sequence

```
1. ✅ Create resolveItemDefinition.js
   packages/database/src/resolveItemDefinition.js
   Exported from packages/database/index.js
   19 tests passing

2. Update Item.fromDefinition()              ← normalization entry point
   Map ResolvedItemDefinition SCREAMING_CASE → internal camelCase
   Add showPax/showCantidad/showDuracion/showHora to toDisplayObject()

3. Write DB-grounded Item tests
   New describe block in Item.test.js using resolveItemDefinition() + real SEED_DATA

4. npm test  ← all existing tests must still pass

5. Update Item playground mount + HTML
   Remove createDefaultSeed()/mergeSeed(), add loadSeedFromCsvUrl() + item selector dropdown
   Remove manual profile sliders (DB definition is now the only source)
```

---

## 6. Tables NOT touched by Item (but relevant to the full system)

| Table | Relevance to Item |
|---|---|
| `COTIZACIONES` | Source of `externalContext.paxGlobal` — pushed by quotation layer |
| `LINEA_DETALLE` | Persistence target for basket item state — mapped via `toSeed()` |
| `AJUSTES_COTIZACION` | Price-level overrides — future, not in Item today |
| `COMPOSICION_KIT` | Kit composition — future `resolveKitDefinition()` |
| `CACHE_COTIZACION` | Computed snapshot — quotation-level concern |
| `HISTORIAL_COTIZACION` | Audit log — infrastructure concern |
| `CLIENTES` | No relation to Item |
