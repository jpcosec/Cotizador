# I-3 Category — Minimal JS Pseudo Code

## Category.js — the domain class

```js
export class Category {
  #definition   // DB category row (ID_Categoria, Nombre, Icono_UI, ...)
  #items        // Item[] — child item instances

  constructor(definition) {
    this.#definition = definition
    this.#items = []
  }

  // Add an Item instance to this category
  addItem(item) {
    this.#items.push(item)
    return this
  }

  // Remove by item ID
  removeItem(itemId) {
    this.#items = this.#items.filter(i => i.toDisplayObject().id !== itemId)
    return this
  }

  // Push context down to all children
  // Category does not interpret or transform the context — just passes it through
  receiveContext(ctx) {
    this.#items.forEach(item => item.receiveContext(ctx))
    return this
  }

  // Produce render-ready output
  toDisplayObject() {
    const items = this.#items.map(i => i.toDisplayObject())
    const subtotal = items.reduce((sum, i) => sum + (i.total ?? 0), 0)

    return {
      id:          this.#definition.ID_Categoria,
      nombre:      this.#definition.Nombre,
      icono:       this.#definition.Icono_UI ?? null,
      items,
      subtotal,
      itemCount:   items.length,
      hasErrors:   items.some(i => (i.ruleErrors?.length ?? 0) > 0),
      hasWarnings: items.some(i => (i.ruleWarnings?.length ?? 0) > 0),
    }
  }
}
```

---

## Alpine component data structure (mount function)

```js
// createCategoryStandaloneComponent.js

Alpine.data('categoryStandaloneComponent', () => ({

  // ── External state (playground controls) ──────────────
  selectedCategoryId: 'CAT_GASTRO',    // controlled by category dropdown
  paxGlobal:  50,
  dia:        1,
  hora:       '09:00',
  selectedItemToAdd: 'ITEM_CENA',      // controlled by add-item dropdown

  // ── Internal Alpine state ──────────────────────────────
  category: null,     // Category instance
  state:    {},       // category.toDisplayObject() result

  init() {
    this.rebuildCategory()
  },

  rebuildCategory() {
    const catDef = SEED_CATEGORIAS.find(c => c.ID_Categoria === this.selectedCategoryId)
    this.category = new Category(catDef)
    this.refresh()
  },

  addItem() {
    const def = resolveItemDefinition(this.selectedItemToAdd, db)
    const item = Item.fromDefinition(def)
    this.category.addItem(item)
    // Bring item into basket mode and give it current context
    item.addToBasket()
    this.pushContext()
  },

  removeItem(itemId) {
    this.category.removeItem(itemId)
    this.refresh()
  },

  setContext(field, value) {
    this[field] = (field === 'hora') ? value : Number(value)
    this.pushContext()
  },

  pushContext() {
    // Push current external context to all items, then recalculate
    this.category.receiveContext({
      paxGlobal: this.paxGlobal,
      dia:       this.dia,
      hora:      this.hora,
    })
    // Each item must recalculate after receiving new context
    // (implementation detail: expose a recalculateAll() or loop items)
    this.refresh()
  },

  refresh() {
    this.state = this.category.toDisplayObject()
  },
}))
```

---

## External state (what the playground provides)

```js
// From parent container (Basket/Day) in a real app
// Simulated by playground controls here:
externalContext = {
  paxGlobal: 50,
  dia:       1,
  hora:      '09:00',
}

// Category definition from DB (selected via dropdown)
categoryDefinition = SEED_CATEGORIAS.find(c => c.ID_Categoria === selectedId)
```

---

## Internal state (what Category owns)

```js
// Category manages only one thing: its children
items: Item[]    // ordered list of Item instances
```

---

## Output shape — toDisplayObject()

```js
{
  id:          'CAT_GASTRO',
  nombre:      'Gastronomía',
  icono:       'utensils',
  items:       [...],         // each item's own toDisplayObject()
  subtotal:    2500000,       // sum of all item.total values
  itemCount:   2,
  hasErrors:   false,
  hasWarnings: false,
}
```
