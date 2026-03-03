# I-2 Item — Machine Blueprint

## Role of the machine

The Item machine already exists (`machine/itemMachine.js`) and its core design is correct. This blueprint documents the **two orthogonal state dimensions** the Item owns, the precise interface boundary with the outer world, and what changes when DB definitions come in.

The machine uses the **closure pattern**: an `Item` instance lives inside the factory function and is mutated by action handlers. Machine context is always a fresh snapshot from `item.toDisplayObject()`. This pattern is kept.

---

## Two orthogonal state dimensions

Item owns two independent dimensions simultaneously:

| Dimension | Values | How it changes |
|---|---|---|
| `mode` | `catalog` \| `basket` | XState state transition (`ADD_TO_BASKET`) |
| `availability` | errors / warnings / available | Recomputed by `calculate()` on every context or override change |

`mode` is the XState state. `availability` is not a separate state — it lives in `context` and is derived by `calculate()` on every mutation. No new transitions are needed for rules.

---

## Interface boundary (the only things that cross it)

### INTO the Item (external inputs)

| Channel | Mechanism | Notes |
|---|---|---|
| External context | `SET_CONTEXT { patch }` | `paxGlobal, dia, hora, duracionMin` — flows down from parent |
| User overrides | `SET_OVERRIDE / CLEAR_OVERRIDE / RESET_OVERRIDES` | Only valid in basket mode |
| Mode trigger | `ADD_TO_BASKET` | Item decides its own mode; parent does not set mode directly |

### OUT OF the Item (aggregations up)

| Field | Type | Meaning |
|---|---|---|
| `total` | number | Computed price for this item |
| `ruleErrors` | string[] | Blocking errors from rules evaluation |
| `ruleWarnings` | string[] | Non-blocking warnings |
| `available` | boolean | False if any ERROR rule fires |
| `appliedRules` | Rule[] | Full evaluated rule list (for diagnostics) |

Parent components (Category, Basket) read these fields from `toDisplayObject()` via their own subscription or direct call. **No upward events — aggregation is data, not events.**

---

## States

```
catalog    ← item is in the browsable catalog; shows mini-card
basket     ← item is in the basket; shows accordion with controls
```

### Transitions

| From | Event | To | Notes |
|------|-------|----|-------|
| catalog | ADD_TO_BASKET | basket | Item owns this transition |
| catalog | SET_CONTEXT | catalog (self) | Context always accepted |
| basket | SET_OVERRIDE | basket (self) | |
| basket | CLEAR_OVERRIDE | basket (self) | |
| basket | RESET_OVERRIDES | basket (self) | |
| basket | SET_CONTEXT | basket (self) | Context always accepted |
| basket | REMOVE_FROM_BASKET | catalog | **Playground-only** — see note below |

**Note on `REMOVE_FROM_BASKET`:** In the real application there is no "return to catalog" — when a user removes an item from the basket, the parent machine destroys the actor entirely. `REMOVE_FROM_BASKET` is kept in the standalone playground only to exercise the full catalog→basket→catalog lifecycle in isolation.

### Playground-only debug events (not part of real integration)

These events exist solely for the standalone playground to allow manual testing without a DB:

| Event | Purpose |
|---|---|
| `SET_PROFILE_VALUE { key, value }` | Override a pricing coefficient in-place |
| `SET_DEFAULT_QUANTITY { key, value }` | Override a default quantity |
| `CLEAR_DEFAULT_QUANTITY { key }` | Reset a default quantity to null |

In a real integration the DB definition is immutable at runtime; these events have no equivalent.

---

## Context additions (new fields surfaced from DB definition)

All context is produced by `item.toDisplayObject()` after `Item.fromDefinition()` normalises the DB shape.

### UI visibility flags (new — from category flags)

```
showPax       boolean   derived from categoria.Def_Requiere_Pax
showCantidad  boolean   derived from categoria.Def_Requiere_Cant
showDuracion  boolean   derived from categoria.Def_Requiere_Tiempo
showHora      boolean   derived from categoria.Def_Requiere_Hora
```

### Read-only definition panels (new — from resolved DB definition)

```
perfil        object    { ID_Perfil_Precio, Nombre, Costo_Base_Fijo,
                          Costo_Unitario_Pax, Costo_Unitario_Tiempo, Costo_Unitario_Item }

categoria     object    { ID_Categoria, Nombre, Icono_UI }
```

### Rules output (already implemented — explicitly listed here for clarity)

```
ruleErrors    string[]  messages for blocking ERROR rules that fired
ruleWarnings  string[]  messages for non-blocking WARNING rules that fired
available     boolean   false when any ERROR rule fires
appliedRules  Rule[]    full evaluated set (for diagnostics panel)
```

The machine does not transition on rule results. Rules are evaluated inside `calculate()` on every mutation; results appear immediately in the next `toDisplayObject()` snapshot.

---

## Playground selector layer (Alpine-only, no machine event)

Item switching is handled outside the machine. When the user picks a different item the current actor is stopped and a new one is created.

```
Playground Alpine state (not in machine):
  selectedItemId    string    controlled by the item selector dropdown

loadItem(itemId):
  if (actor) actor.stop()
  definition = resolveItemDefinition(itemId, db)
  actor = createItemActor({ mode: 'catalog', definition: Item.fromDefinition(definition) })
  actor.subscribe(snap => Object.assign(this.itemState, snap.context))
```

---

## Alpine connection

```
init()
  loadItem('ITEM_CENA')    ← load first item on mount

Item selector dropdown
  @change → loadItem($el.value)   [replaces actor, not a machine event]

External context panel
  paxGlobal slider  → actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: +v } })
  hora input        → actor.send({ type: 'SET_CONTEXT', patch: { hora: v } })
  dia input         → actor.send({ type: 'SET_CONTEXT', patch: { dia: +v } })

Catalog card
  "Add to basket" button → actor.send({ type: 'ADD_TO_BASKET' })

Basket accordion
  pax input    → actor.send({ type: 'SET_OVERRIDE', key: 'pax', value: +v })
  duracion     → actor.send({ type: 'SET_OVERRIDE', key: 'duracionMin', value: +v })
  "Reset"      → actor.send({ type: 'RESET_OVERRIDES' })
  "Remove"     → actor.send({ type: 'REMOVE_FROM_BASKET' })  [playground-only]
```

### UI visibility from context fields

```
pax input row      x-show="itemState.showPax"
cantidad row       x-show="itemState.showCantidad"
duracion row       x-show="itemState.showDuracion"
hora row           x-show="itemState.showHora"

Profile panel      read-only x-text from itemState.perfil.*
Category badge     x-text="itemState.categoria.Nombre"

Rule errors        x-for="err in itemState.ruleErrors"
Rule warnings      x-for="warn in itemState.ruleWarnings"
Unavailable badge  x-show="!itemState.available"
```

---

## What does NOT change

- `machine/itemMachine.js` — no modifications needed
- Domain functions (`pricing.js`, `quantity.js`, `formatting.js`, `rulesEngine/`) — untouched
- `Item` class public API (`setOverride`, `receiveContext`, `toDisplayObject`, etc.)
- `fromSeed()` — kept for backward compat with existing tests

The only new entry point is `Item.fromDefinition(resolvedDbShape)` which normalises DB field names to the internal camelCase shape before constructing the instance.
