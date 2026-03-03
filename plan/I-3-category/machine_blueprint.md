# I-3 Category — Machine Blueprint

## Role of the machine

The `Category` domain class is intentionally **pure** — no XState, no Alpine, no reactivity. The machine lives only in the **playground**, where it orchestrates the interactions the pure class cannot know about: which category is selected, when to rebuild, how to propagate context to children, and how to keep the reactive display in sync.

The machine earns its place here not because the logic is complex today, but because it makes the **async upgrade path clean**: when GAS arrives in Phase 4, only the machine changes — Alpine and the domain class stay untouched.

---

## States

```
loading     ← transient; rebuilds Category instance from selected definition
              (sync today, async in Phase 4 when DB calls go to GAS)

idle        ← category is ready; items can be added/removed; context can be pushed
```

### Transitions

| From | Event | Guard | To |
|------|-------|-------|----|
| loading | — (always) | — | idle |
| idle | SELECT_CATEGORY | — | loading |
| idle | ADD_ITEM | canAddItem | idle (self) |
| idle | REMOVE_ITEM | — | idle (self) |
| idle | SET_CONTEXT | — | idle (self) |

---

## Context

```
selectedCategoryId   string     which category is loaded ('CAT_GASTRO', etc.)

paxGlobal            number     current event headcount
dia                  number     current day number
hora                 string     current time ('HH:MM')

selectedItemToAdd    string     item dropdown value (what will be added next)

state                object     category.toDisplayObject() snapshot
  {
    id          string
    nombre      string
    icono       string | null
    items       ItemDisplayObject[]   each child's toDisplayObject()
    subtotal    number
    itemCount   number
    hasErrors   boolean
    hasWarnings boolean
  }
```

---

## Guards

| Guard | Logic |
|-------|-------|
| `canAddItem` | `selectedItemToAdd !== null && selectedItemToAdd !== ''` |

---

## Events

| Event | Payload |
|-------|---------|
| SELECT_CATEGORY | `{ categoryId }` |
| ADD_ITEM | `{ itemId }` |
| REMOVE_ITEM | `{ itemId }` |
| SET_CONTEXT | `{ patch: { paxGlobal?, dia?, hora? } }` |

---

## Closure pattern

The `Category` instance lives in the factory closure — not in machine context (not serializable, and not needed across sessions). Actions mutate the closure object and return a fresh `state` snapshot.

```
factory closure:
  category = null        ← rebuilt on SELECT_CATEGORY and on init

machine context:
  state = category.toDisplayObject()   ← plain snapshot, replaced after every mutation
```

### Action sketches

```
rebuildCategory(context):
  catDef   = SEED_CATEGORIAS.find(c => c.ID_Categoria === context.selectedCategoryId)
  category = new Category(catDef)       ← closure mutation
  return { state: category.toDisplayObject() }

addItemAction(context, event):
  def  = resolveItemDefinition(event.itemId, db)
  item = Item.fromDefinition(def)
  item.setMode('basket')
  category.addItem(item)
  category.receiveContext({ paxGlobal, dia, hora })   ← bring new item into sync
  return { state: category.toDisplayObject() }

removeItemAction(context, event):
  category.removeItem(event.itemId)
  return { state: category.toDisplayObject() }

pushContextAction(context, event):
  merged = { ...context, ...event.patch }
  category.receiveContext({ paxGlobal: merged.paxGlobal, dia: merged.dia, hora: merged.hora })
  return { ...merged, state: category.toDisplayObject() }
```

---

## Alpine connection

Alpine is conceptually display-only — it renders `state.*` and fires events up to the actor. However, some UI interactions (drag-and-drop reorder, time picker, expand/collapse) generate synthetic events that must be wired back to the actor. Any Alpine handler that mutates state must do so exclusively via `actor.send(...)` — never by writing to `state.*` directly.

```
init()
  actor.subscribe(snap => Object.assign(this, snap.context))

Category selector
  @change → actor.send({ type: 'SELECT_CATEGORY', categoryId: $el.value })

Context controls
  paxGlobal slider → actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: +v } })
  hora input       → actor.send({ type: 'SET_CONTEXT', patch: { hora: v } })
  dia input        → actor.send({ type: 'SET_CONTEXT', patch: { dia: +v } })

Item management
  "Add item" button  → actor.send({ type: 'ADD_ITEM', itemId: selectedItemToAdd })
  "Remove" button    → actor.send({ type: 'REMOVE_ITEM', itemId })
```

### UI state derivations (Alpine computes from context)

| UI element | Derived from |
|-----------|--------------|
| Category header name + icon | `state.nombre`, `state.icono` |
| Item list | `x-for="item in state.items"` — renders each item's `toDisplayObject()` |
| Subtotal in header | `state.subtotal` |
| Item count pill | `state.itemCount` |
| Error indicator | `:class="{ 'has-errors': state.hasErrors }"` |
| Warning indicator | `:class="{ 'has-warnings': state.hasWarnings }"` |
| Loading overlay | `x-show="$state.matches('loading')"` |

---

## Relationship between Category machine and Item display

Category's playground renders each item using the **existing Item component template** — it does not re-implement item rendering. Each `item` in `state.items` is the output of `Item.toDisplayObject()`, so the same HTML partial used in the I-2 playground can be reused here.

The Category machine does **not** spawn child Item machines. Items are plain domain objects managed by the closure `Category` instance. This keeps the machine simple and avoids inter-actor communication overhead at this stage.

---

## Async readiness (Phase 4)

When GAS is wired in, `SELECT_CATEGORY` and `ADD_ITEM` become async. The `loading` state absorbs this:

```
idle → SELECT_CATEGORY → loading → (on done: category rebuilt) → idle
                                 → (on error: set loadError) → idle

idle → ADD_ITEM → loading → (on done: item resolved + added) → idle
                           → (on error: set addError) → idle
```

Alpine shows a loading spinner during `loading`; item rendering and context controls are disabled. No Alpine code changes — only the machine grows async transitions.
