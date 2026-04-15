# I-3 Category — Objectives

## Goal

Build the `Category` domain component: a container that holds a list of `Item` instances, propagates external context (paxGlobal, dia, hora) to all its children, aggregates their totals into a subtotal, and surfaces error/warning states from child rules.

---

## What this step produces

| Artifact | Location |
|---|---|
| `Category` class with domain logic | `packages/components/category/Category.js` |
| Category tests | `packages/components/category/tests/Category.test.js` |
| `STATE_CONTRACT.md` | `packages/components/category/STATE_CONTRACT.md` |
| Category standalone playground | `packages/components/category/ui/CategoryStandalone.html` |
| Mount function | `packages/components/category/logic/createCategoryStandaloneComponent.js` |
| Sandbox route | `apps/sandbox/routes/step-I3-category/index.html` |

---

## Completion Criteria

- [ ] `STATE_CONTRACT.md` written and agreed before implementation begins
- [ ] `new Category(categoryDefinition)` creates a category with an empty item list
- [ ] `category.addItem(item)` adds an `Item` instance to the list
- [ ] `category.removeItem(itemId)` removes by `ID_Item`
- [ ] `category.receiveContext({ paxGlobal, dia, hora })` calls `item.receiveContext()` on all children
- [ ] `toDisplayObject().subtotal` is the sum of all children's `total`
- [ ] `toDisplayObject().hasErrors` is `true` if any child has `ruleErrors.length > 0`
- [ ] `toDisplayObject().hasWarnings` is `true` if any child has `ruleWarnings.length > 0`
- [ ] `toDisplayObject().items` is an array of each child's `toDisplayObject()`
- [ ] All existing tests still pass (no regressions)
- [ ] Playground accessible at `http://localhost:8090/step-I3-category/`

---

## Testing Criteria

**Automated:**
```bash
npm test
# All tests pass including new Category tests
```

**Human (playground):**
- [ ] Category selector shows all seed categories
- [ ] Adding an item from the dropdown places an item card inside the category
- [ ] Changing paxGlobal recalculates all item totals and updates the subtotal
- [ ] Subtotal shown in category header updates reactively
- [ ] Removing an item updates the subtotal
- [ ] Setting paxGlobal below min-pax rule threshold shows hasErrors = true
- [ ] Item cards in the category display show their own name and total (they are the Item component, not reimplemented)

---

## Key constraints

- `Category` is a **pure domain class** — no Alpine, no XState, no reactivity inside it
- `Category` does not know how to render itself — `toDisplayObject()` is its only output contract
- The playground is the first place Alpine bindings appear for this component
- Child items inside the playground are rendered using the **existing Item component display** — do not re-implement item rendering inside Category
