# I-1 Database — Minimal JS Pseudo Code

## seed.js — shape of each table row

```js
// PERFILES_PRECIO — pricing formula coefficients
{
  ID_Perfil_Precio: 'PERF_PAX',           // PK
  Nombre: 'Por Persona',
  Costo_Base_Fijo: 0,                      // flat base
  Costo_Unitario_Pax: 50000,              // per pax
  Costo_Unitario_Tiempo: 0,               // per minute
  Costo_Unitario_Item: 0,                 // per unit
  Activo: true,
  Updated_At: '2026-01-01T00:00:00Z'
}

// CATEGORIAS — item type with dimension flags + defaults
{
  ID_Categoria: 'CAT_GASTRO',             // PK
  Nombre: 'Gastronomía',
  ID_Perfil_Precio_Default: 'PERF_PAX',  // FK → PERFILES_PRECIO (inherited by items)
  Def_Requiere_Pax: true,                 // pricing uses pax?
  Def_Requiere_Cant: false,               // pricing uses quantity?
  Def_Requiere_Tiempo: false,             // pricing uses time?
  Def_Requiere_Hora: false,               // show hora selector in UI?
  Def_Duracion_Min: 0,                    // default duration in minutes
  Def_Unidades_Por_Pax: 1,               // default units per pax (0 = not applicable)
  Icono_UI: 'utensils',
  Activo: true,
  Updated_At: '2026-01-01T00:00:00Z'
}

// ITEM_CATALOGO — sellable item
{
  ID_Item: 'ITEM_CENA',                        // PK
  Nombre: 'Cena de Gala',
  ID_Categoria: 'CAT_GASTRO',                  // FK → CATEGORIAS
  ID_Perfil_Precio_Override: null,             // FK → PERFILES_PRECIO (null = inherit)
  Def_Unidades_Por_Pax_Override: null,         // null = inherit from category
  Default_Glosa: 'Menú de tres tiempos',
  Activo: true,
  Updated_At: '2026-01-01T00:00:00Z'
}

// REGLAS_NEGOCIO — business rule
{
  ID_Regla: 'REGLA_MIN_PAX',
  Nombre: 'Mínimo 20 personas',
  Etapa: 'RESTRICCION_UI',
  Scope: 'ITEM',
  Tipo_Accion: 'ERROR',
  Hook: null,
  Condicion_JSON: { '<': [{ var: 'pax' }, 20] },   // JSON-Logic expression
  Payload_JSON: { message: 'Se requieren al menos 20 personas' },
  Prioridad: 1,
  Acumulable: false,
  Activo: true,
  Updated_At: '2026-01-01T00:00:00Z'
}
```

---

## resolveItemDefinition.js — the adapter

```js
// Pure function — no side effects, no async
export function resolveItemDefinition(itemId, { items, categorias, perfiles, reglas }) {

  // 1. Find the item row
  const item = items.find(i => i.ID_Item === itemId)
  if (!item) throw new Error(`Item not found: ${itemId}`)

  // 2. Join its category
  const categoria = categorias.find(c => c.ID_Categoria === item.ID_Categoria)
  if (!categoria) throw new Error(`Category not found: ${item.ID_Categoria}`)

  // 3. Resolve pricing profile — item override wins, falls back to category default
  const perfilId = item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default
  const perfil = perfiles.find(p => p.ID_Perfil_Precio === perfilId)
  if (!perfil) throw new Error(`Profile not found: ${perfilId}`)

  // 4. Filter rules relevant to this item
  // For now: all active RESTRICCION_UI rules scoped to ITEM
  // (Later, when rules have ID_Item FK, filter by item too)
  const itemReglas = reglas.filter(r =>
    r.Activo &&
    r.Scope === 'ITEM' &&
    r.Etapa === 'RESTRICCION_UI'
  )

  // 5. Return joined definition — all downstream components use this shape
  return { ...item, categoria, perfil, reglas: itemReglas }
}
```

---

## Resulting resolved shape (what downstream receives)

```js
{
  // From ITEM_CATALOGO
  ID_Item: 'ITEM_CENA',
  Nombre: 'Cena de Gala',
  Default_Glosa: 'Menú de tres tiempos',
  Activo: true,

  // From CATEGORIAS (joined)
  categoria: {
    ID_Categoria: 'CAT_GASTRO',
    Nombre: 'Gastronomía',
    Def_Requiere_Pax: true,
    Def_Requiere_Cant: false,
    Def_Requiere_Tiempo: false,
    Def_Requiere_Hora: false,
    Def_Duracion_Min: 0,
    Def_Unidades_Por_Pax: 1,
    Icono_UI: 'utensils'
  },

  // From PERFILES_PRECIO (resolved — override or category default)
  perfil: {
    ID_Perfil_Precio: 'PERF_PAX',
    Nombre: 'Por Persona',
    Costo_Base_Fijo: 0,
    Costo_Unitario_Pax: 50000,
    Costo_Unitario_Tiempo: 0,
    Costo_Unitario_Item: 0
  },

  // From REGLAS_NEGOCIO (filtered)
  reglas: [
    {
      ID_Regla: 'REGLA_MIN_PAX',
      Tipo_Accion: 'ERROR',
      Condicion_JSON: { '<': [{ var: 'pax' }, 20] },
      Payload_JSON: { message: 'Se requieren al menos 20 personas' }
    }
  ]
}
```
