# Category Component — State Contract

## Purpose

Documents the state boundary of the `Category` class: what flows in, what it owns, and what it exposes. Category is the first item-container; its pattern will be extended by Kit and Basket. This contract must be agreed before implementation.

---

## 1. External state (flows in, Category does not own)

### Definition — a CATEGORIAS row from the DB

Passed once at construction. Category reads from it but does not mutate it.

```js
definition: {
  ID_Categoria:             string,        // PK
  Nombre:                   string,        // display name
  ID_Perfil_Precio_Default: string,        // informational only — Item uses it
  Def_Requiere_Pax:         boolean,
  Def_Requiere_Cant:        boolean,
  Def_Requiere_Tiempo:      boolean,
  Def_Requiere_Hora:        boolean,
  Def_Duracion_Min:         number,
  Def_Unidades_Por_Pax:     number,
  Icono_UI:                 string | null,
  Activo:                   boolean,
}
```

### External context — from container (Basket / playground)

Propagated by parent. Category passes it through to all children without interpreting it.

```js
externalContext: {
  paxGlobal: number,  // event headcount
  dia:       number,  // day number (1..N)
  hora:      string,  // 'HH:MM'
}
```

Category does not compute with these values directly — it relays them to each child `Item` via `receiveContext()`.

---

## 2. Internal state (Category owns and manages)

```js
items: Item[]   // ordered list of Item instances
                // managed via addItem() / removeItem()
                // each Item is responsible for its own calculations
```

That is the complete internal state. Category is intentionally minimal.

---

## 3. Output shape — `toDisplayObject()`

```js
{
  id:          string,              // ID_Categoria
  nombre:      string,              // Nombre
  icono:       string | null,       // Icono_UI

  items:       ItemDisplayObject[], // each child's toDisplayObject() — full shape
  itemCount:   number,              // items.length

  subtotal:    number,              // sum of item.total for all children (CLP integer)

  hasErrors:   boolean,             // true if any child has ruleErrors.length > 0
  hasWarnings: boolean,             // true if any child has ruleWarnings.length > 0
}
```

> `items` is an array of the full `toDisplayObject()` output from each Item. Category does not reshape or filter it — the template decides what to render.

---

## 4. Mutation API (public methods)

| Method | Effect |
|--------|--------|
| `addItem(item: Item)` | Appends to `#items`. Does not call `receiveContext` automatically — caller is responsible for pushing context after adding. |
| `removeItem(itemId: string)` | Removes by `item.toDisplayObject().id`. No-op if not found. |
| `receiveContext(ctx)` | Calls `item.receiveContext(ctx)` on every child in order. |

All methods return `this` for chaining.

---

## 5. What Category does NOT own

- Pricing calculation — each Item calculates its own total
- Rule evaluation — each Item runs its own RulesCoordinator
- Context values (paxGlobal, dia, hora) — flows through, not stored
- Basket-level aggregation (multi-category subtotals, taxes) — belongs to Basket
- Rendering — Category has no knowledge of HTML or Alpine

---

## 6. Relationship to XState machine (playground)

The `Category` class is pure. XState lives in `createCategoryStandaloneComponent.js`. The machine holds the playground controls (selectedCategoryId, paxGlobal, dia, hora, selectedItemToAdd) and keeps a `Category` instance in its closure. After every mutation, it snapshots `category.toDisplayObject()` into `context.state` and Alpine renders from there.

See `plan/I-3-category/machine_blueprint.md` for the full machine design.

---

## 7. Extension pattern (Kit, Basket)

Category establishes the container interface:

```
constructor(definition)   — accepts the component's DB row
addItem(item)             — adds a child
removeItem(id)            — removes by ID
receiveContext(ctx)        — propagates context down
toDisplayObject()         — snapshots state up
```

Kit and Basket will follow this same interface, adding:
- Kit: fixed composition (items from COMPOSICION_KIT, not dynamically added)
- Basket: multi-category grouping, tax aggregation, quotation-level context
