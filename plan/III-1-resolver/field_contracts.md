# III-1 Resolver — Field Contracts

## Purpose

This document is the **single source of truth** for the shape returned by `resolveItemDefinition(itemId, db)`. Every downstream component (Item, Category, and beyond) depends on this contract. Do not change it without updating all consumers.

---

## Input

```js
resolveItemDefinition(itemId: string, db: {
  items:      ITEM_CATALOGO[],
  categorias: CATEGORIAS[],
  perfiles:   PERFILES_PRECIO[],
  reglas:     REGLAS_NEGOCIO[]
}): ResolvedItemDefinition
```

Throws a descriptive error if `itemId` is not found.

---

## Output shape: `ResolvedItemDefinition`

```js
{
  // ── From ITEM_CATALOGO ──────────────────────────────────────────
  ID_Item:                    string,        // PK — e.g. 'ITEM_CENA'
  Nombre:                     string,        // e.g. 'Cena de Gala'
  Default_Glosa:              string | null, // description / default comment
  ID_Categoria:               string,        // FK (informational — categoria is joined below)
  ID_Perfil_Precio_Override:  string | null, // FK (informational — perfil is resolved below)
  Def_Unidades_Por_Pax_Override: number | null, // null = inherit from categoria
  Activo:                     boolean,

  // ── From CATEGORIAS (full row, joined on ID_Categoria) ──────────
  categoria: {
    ID_Categoria:             string,
    Nombre:                   string,        // e.g. 'Gastronomía'
    ID_Perfil_Precio_Default: string,        // FK used for profile resolution
    Def_Requiere_Pax:         boolean,       // pricing uses pax (P)
    Def_Requiere_Cant:        boolean,       // pricing uses quantity (Q)
    Def_Requiere_Tiempo:      boolean,       // pricing uses time (T)
    Def_Requiere_Hora:        boolean,       // UI: show time-of-day selector
    Def_Duracion_Min:         number,        // default duration in minutes
    Def_Unidades_Por_Pax:     number,        // default units per pax (can be fractional)
    Icono_UI:                 string | null, // icon name for UI badge
    Activo:                   boolean,
  },

  // ── From PERFILES_PRECIO (resolved profile) ─────────────────────
  // Resolution order: item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default
  perfil: {
    ID_Perfil_Precio:         string,
    Nombre:                   string,        // e.g. 'Por Persona'
    Costo_Base_Fijo:          number,        // flat base fee (CLP)
    Costo_Unitario_Pax:       number,        // cost per person (CLP)
    Costo_Unitario_Tiempo:    number,        // cost per minute (CLP)
    Costo_Unitario_Item:      number,        // cost per unit/quantity (CLP)
    Activo:                   boolean,
  },

  // ── From REGLAS_NEGOCIO (filtered subset) ───────────────────────
  // Filter: Activo=true AND Scope='ITEM' AND Etapa='RESTRICCION_UI'
  //         AND (ID_Componente IS NULL OR ID_Componente = itemId)
  // Sorted: by Prioridad ASC
  reglas: [
    {
      ID_Regla:        string,
      Nombre:          string,
      Etapa:           'RESTRICCION_UI',
      Scope:           'ITEM',
      ID_Componente:   string | null,   // null = global; value = only this item
      Tipo_Accion:     'ERROR' | 'WARNING',  // only these two affect UI availability
      Hook:            string | null,
      Condicion_JSON:  object | null,   // JSON-Logic expression
      Payload_JSON:    object | null,   // { message: string, ... }
      Prioridad:       number,
      Acumulable:      boolean,
      Activo:          true,            // always true (filtered out otherwise)
    }
  ]
}
```

> `Updated_At` is intentionally stripped from all nested objects — it is metadata, not needed by components.

---

## Profile resolution rule

```
resolvedPerfilId = item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default
```

Item override wins. If the item has no override (`null`), the category's default profile is used. If neither resolves, the function throws.

---

## Units-per-pax resolution rule

```
resolvedUnidadesPorPax = item.Def_Unidades_Por_Pax_Override ?? categoria.Def_Unidades_Por_Pax
```

Same override pattern. Used by the Item domain for quantity calculation.

---

## Rules filter

Only rules that pass **all four conditions** are included:

| Condition | Meaning |
|-----------|---------|
| `Activo = true` | Rule is in use |
| `Scope = 'ITEM'` | Applies to item-level components |
| `Etapa = 'RESTRICCION_UI'` | Evaluated at render time, not during pricing pipeline |
| `ID_Componente IS NULL OR ID_Componente = itemId` | Global rule or specific to this item |

Rules are sorted by `Prioridad ASC` before being returned.

**Note on production CSV data:** The rules in `data/init/REGLAS_NEGOCIO.csv` all have `ID_Componente: null`. Item-level targeting is encoded inside `Condicion_JSON` (e.g. `{ "===": [{ "var": "linea.ID_Item" }, "ITEM_XYZ"] }`). This means the FK pre-filter passes all 63 rules for every item, and the `RulesCoordinator` does the actual item-level filtering at evaluation time via JSON-Logic. This is correct behavior — the pre-filter is an optimization that is not used by the current data set.

---

## Concrete example

`resolveItemDefinition('ITEM_CENA', db)` returns:

```js
{
  ID_Item:                    'ITEM_CENA',
  Nombre:                     'Cena de Gala',
  Default_Glosa:              'Menú de tres tiempos',
  ID_Categoria:               'CAT_GASTRO',
  ID_Perfil_Precio_Override:  null,
  Def_Unidades_Por_Pax_Override: null,
  Activo:                     true,

  categoria: {
    ID_Categoria:             'CAT_GASTRO',
    Nombre:                   'Gastronomía',
    ID_Perfil_Precio_Default: 'PERF_PAX',
    Def_Requiere_Pax:         true,
    Def_Requiere_Cant:        false,
    Def_Requiere_Tiempo:      false,
    Def_Requiere_Hora:        false,
    Def_Duracion_Min:         0,
    Def_Unidades_Por_Pax:     1,
    Icono_UI:                 'utensils',
    Activo:                   true,
  },

  perfil: {
    ID_Perfil_Precio:         'PERF_PAX',
    Nombre:                   'Por Persona',
    Costo_Base_Fijo:          0,
    Costo_Unitario_Pax:       50000,
    Costo_Unitario_Tiempo:    0,
    Costo_Unitario_Item:      0,
    Activo:                   true,
  },

  reglas: [
    {
      ID_Regla:       'REGLA_MIN_PAX',
      Nombre:         'Mínimo 20 personas',
      Etapa:          'RESTRICCION_UI',
      Scope:          'ITEM',
      ID_Componente:  'ITEM_CENA',
      Tipo_Accion:    'ERROR',
      Hook:           null,
      Condicion_JSON: { '<': [{ 'var': 'item.pax' }, 20] },
      Payload_JSON:   { message: 'Se requieren al menos 20 personas' },
      Prioridad:      1,
      Acumulable:     false,
      Activo:         true,
    }
  ]
}
```

---

## What this contract does NOT include

- Transactional data (COTIZACIONES, LINEA_DETALLE) — resolved at quotation level, not item level
- COMPOSICION_KIT children — resolved by a separate `resolveKitDefinition()` (future)
- Computed pricing totals — calculated at runtime by the Item domain, never stored here
- `Updated_At` timestamps — stripped; not needed downstream
