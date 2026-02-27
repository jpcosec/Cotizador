# I-2 Item — Minimal JS Pseudo Code

## Item.fromDefinition() — the normalization entry point

```js
// Receives: output of resolveItemDefinition()
// Returns: a new Item instance with normalized internal definition

static fromDefinition(dbDef) {
  const normalized = {
    id:          dbDef.ID_Item,
    name:        dbDef.Nombre,
    category:    dbDef.categoria?.Nombre,
    description: dbDef.Default_Glosa,

    // Pricing profile — map DB coefficient names to internal names
    pricing: {
      baseFijo:   dbDef.perfil?.Costo_Base_Fijo      ?? 0,
      porPersona: dbDef.perfil?.Costo_Unitario_Pax   ?? 0,
      porMinuto:  dbDef.perfil?.Costo_Unitario_Tiempo ?? 0,
      porUnidad:  dbDef.perfil?.Costo_Unitario_Item   ?? 0,
    },

    // Default quantity behavior — from category (item override wins for unidadesPorPax)
    defaults: {
      requierePax:    dbDef.categoria?.Def_Requiere_Pax    ?? false,
      requiereCant:   dbDef.categoria?.Def_Requiere_Cant   ?? false,
      requiereTiempo: dbDef.categoria?.Def_Requiere_Tiempo ?? false,
      requiereHora:   dbDef.categoria?.Def_Requiere_Hora   ?? false,
      duracionMin:    dbDef.categoria?.Def_Duracion_Min    ?? 0,
      unidadesPorPax: dbDef.Def_Unidades_Por_Pax_Override  // item override wins
                   ?? dbDef.categoria?.Def_Unidades_Por_Pax
                   ?? 0,
    },

    // Rules — kept in DB shape, RulesCoordinator reads them as-is
    rules: dbDef.reglas ?? [],
  }

  return new Item(normalized)
}
```

---

## toDisplayObject() additions — UI visibility flags

```js
toDisplayObject() {
  return {
    // ... existing fields unchanged ...

    // NEW: derived from category dimension flags
    showPax:      this.#definition.defaults?.requierePax    ?? false,
    showCantidad: this.#definition.defaults?.requiereCant   ?? false,
    showDuracion: this.#definition.defaults?.requiereTiempo ?? false,
    showHora:     this.#definition.defaults?.requiereHora   ?? false,
  }
}
```

---

## External state (what the playground provides)

```js
// Provided by the playground's External State Panel
// (In a real app, this comes from the Basket/Category container)
externalContext = {
  paxGlobal:   100,      // integer — event headcount
  dia:         1,         // integer — day number
  hora:        '09:00',  // 'HH:MM'
  duracionMin: 120,       // integer — event duration
}

// Provided by DB (resolved at playground load, not manually edited)
definition = resolveItemDefinition(selectedItemId, db)
```

---

## Internal state (what Item owns)

```js
// Item manages these itself — not passed in from outside
mode:          'catalog' | 'basket'
quantities:    { pax: N, cantidad: N, duracionMin: N }   // resolved values
userSetFields: Set<'pax' | 'cantidad' | 'duracionMin'>   // override tracking
overrides:     { comentarios: '' }
```

---

## Playground mount function — loading from seed

```js
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js'
import { SEED_ITEM_CATALOGO, SEED_CATEGORIAS, SEED_PERFILES_PRECIO, SEED_REGLAS_NEGOCIO }
  from '../../../database/src/seed.js'

const db = {
  items: SEED_ITEM_CATALOGO,
  categorias: SEED_CATEGORIAS,
  perfiles: SEED_PERFILES_PRECIO,
  reglas: SEED_REGLAS_NEGOCIO,
}

// When user selects a different item from the dropdown:
function loadItem(itemId) {
  const definition = resolveItemDefinition(itemId, db)
  const item = Item.fromDefinition(definition)
  // ... mount to Alpine actor as before ...
}
```
