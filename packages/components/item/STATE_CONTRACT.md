# Item Component — State Contract

## Purpose

Documents the complete state boundary of the `Item` class: what flows in from outside, what the class owns internally, and what it exposes via `toDisplayObject()`. This contract must be stable before any implementation begins. Changes here cascade to tests, the machine, and the Alpine template.

---

## 1. External state (flows in, Item does not own)

### Definition — from `resolveItemDefinition()` normalized by `fromDefinition()`

Passed once at construction. Item does not mutate it (except `setProfileValue` / `setDefaultQuantity` which are debug-only).

```js
definition: {
  // Identity
  id:              string,        // ID_Item
  name:            string,        // Nombre
  description:     string | null, // Default_Glosa

  // Category display
  category:        string,        // categoria.Nombre
  categoriaIcono:  string | null, // categoria.Icono_UI

  // Pricing profile (normalized coefficient names)
  pricingProfile: {
    baseFijo:    number,   // Costo_Base_Fijo
    porPersona:  number,   // Costo_Unitario_Pax
    porMinuto:   number,   // Costo_Unitario_Tiempo
    porUnidad:   number,   // Costo_Unitario_Item
  },

  // Quantity defaults (from category, item override wins for unidadesPorPax)
  defaultQuantities: {
    requierePax:    boolean, // Def_Requiere_Pax    → drives quantity logic
    requiereCant:   boolean, // Def_Requiere_Cant
    requiereTiempo: boolean, // Def_Requiere_Tiempo
    requiereHora:   boolean, // Def_Requiere_Hora   → drives schedule logic
    duracionMin:    number,  // Def_Duracion_Min
    unidadesPorPax: number,  // resolved: item override ?? categoria default
  },

  // Rules (pre-filtered by resolveItemDefinition: RESTRICCION_UI, ITEM scope, this item or global)
  rules: ResolvedRule[],
}
```

### External context — from container (Basket / Category / playground)

Propagated by the parent whenever event-level parameters change. Item merges patches, does not replace.

```js
externalContext: {
  paxGlobal:   number,  // event headcount
  dia:         number,  // day number (1..N)
  hora:        string,  // 'HH:MM' — start time
}
```

> `duracionMin` is NOT in externalContext — it comes from the item's own `defaultQuantities` or a user override.

---

## 2. Internal state (Item owns and manages)

```js
mode:          'catalog' | 'basket'

overrides: {
  pax?:         number,  // user-set pax (overrides paxGlobal)
  cantidad?:    number,  // user-set quantity
  duracionMin?: number,  // user-set duration
  hora?:        string,  // user-set start time
  dia?:         number,  // user-set day
  comentarios?: string,  // free-text comment
}

userSetFields: Set<'pax' | 'cantidad' | 'duracionMin'>
// tracks which quantity fields were explicitly set by the user
// used to show "manual" badges and prevent context propagation from overriding them
```

---

## 3. Output shape — `toDisplayObject()`

Everything the machine context and Alpine template read. Computed fresh on every `calculate()` call.

```js
{
  // ── State mirrors ───────────────────────────────────────────────
  mode:            'catalog' | 'basket',
  definition:      object,   // internal normalized definition (as above)
  externalContext: object,
  overrides:       object,

  // ── Catalog card projection ─────────────────────────────────────
  catalogCard: {
    ID_Item:                  string,
    Nombre:                   string,
    Precio_Calculado_Default: string,   // formatted formula string
    Precio_Por_Cantidad:      string,   // human-readable rate
    InitPolicyHuman:          string,   // policy hint text
    detalle:                  string,   // description + formula
    categoria:                string,   // category name
  },

  // ── Basket line projection ──────────────────────────────────────
  basketLine: {
    id:              string,
    itemId:          string,
    nombre:          string,
    descripcion:     string | null,
    categoria:       string,
    categoriaIcono:  string | null,
    hora:            string,
    horaMin:         number,   // minutes from midnight
    horaFinMin:      number,   // horaMin + duracionMin
    dia:             number,
    comentarios:     string,
    pax:             number,
    cantidad:        number,
    duracionMin:     number,
    precio:          number,   // unit price display
    baseFijo:        number,
    rateLabel:       string,   // e.g. 'por persona'
    rateValue:       number,
    rateSubtotal:    number,
    pricingKind:     string,
    basketLegend:    string,   // human summary line
    isOverridden:    boolean,
    showPaxControl:  boolean,
    showUnitsControl: boolean,
    showTimeControl: boolean,
    total:           number,
  },

  // ── Computed pricing ────────────────────────────────────────────
  profile:          object,   // normalized profile (baseFijo, porPersona, …)
  quantities: {
    pax:         number,
    cantidad:    number,
    duracionMin: number,
  },
  schedule: {
    dia:     number,
    hora:    string,
    horaMin: number,
  },
  total:            number,   // CLP integer
  pricingKind:      'PAX' | 'TIME' | 'UNITS' | 'FIXED',
  initializationMode: string,
  pricingHuman:     string,
  basketLegend:     string,

  // ── UI visibility flags (NEW — from DB definition) ──────────────
  // Derived from categoria dimension flags via fromDefinition() normalization
  showPax:      boolean,   // Def_Requiere_Pax
  showCantidad: boolean,   // Def_Requiere_Cant
  showDuracion: boolean,   // Def_Requiere_Tiempo
  showHora:     boolean,   // Def_Requiere_Hora

  // ── Override tracking ───────────────────────────────────────────
  userSetFields:    string[],   // array snapshot of the Set
  isUserSetPax:     boolean,
  isUserSetCantidad: boolean,
  isUserSetDuracion: boolean,
  isOverridden:     boolean,    // any quantity is user-set

  // ── Rule evaluation ─────────────────────────────────────────────
  appliedRules: {
    id:             string,
    type:           string,
    priority:       number,
    message:        string,
    humanCondition: string,
    humanPayload:   string,
  }[],
  ruleErrors:   same[],   // subset of appliedRules where type === 'ERROR'
  ruleWarnings: same[],   // subset where type === 'WARNING'
  available:    boolean,  // false if any ERROR rule is active
}
```

---

## 4. Mutation API (public methods)

| Method | Mutates | Triggers |
|--------|---------|---------|
| `setMode(mode)` | `#mode` | `calculate()` |
| `receiveContext(patch)` | `#externalContext` (merge) | `calculate()` |
| `setOverride(key, value)` | `#overrides`, `#userSetFields` | `calculate()` |
| `clearOverride(key)` | `#overrides`, `#userSetFields` | `calculate()` |
| `resetOverrides()` | `#overrides`, `#userSetFields` | `calculate()` |
| `setProfileValue(key, value)` | `#definition.pricingProfile` | `calculate()` — debug/playground only |
| `setDefaultQuantity(key, value)` | `#definition.defaultQuantities` | `calculate()` — debug/playground only |
| `clearDefaultQuantity(key)` | `#definition.defaultQuantities` | `calculate()` — debug/playground only |

---

## 5. Factories

| Factory | Use case |
|---------|---------|
| `Item.fromDefinition(resolvedDbDef)` | Create from DB-resolved definition (I-2 forward) |
| `Item.fromSeed(seed)` | Restore persisted state (backward compat — existing tests) |

`fromDefinition()` normalizes DB field names to the internal camelCase shape. `fromSeed()` receives already-normalized data. The domain functions never see DB field names.

---

## 6. What Item does NOT own

- Database access — Item is pure, no I/O
- Catalog browsing state — owned by the machine or playground
- Which items are in the basket — owned by Category / Basket
- Quotation-level context (total pax, multi-day) — comes via `receiveContext()`, not stored
