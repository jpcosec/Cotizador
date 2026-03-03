# I-3 Category — Agent Guideline

## Context

You are building a container domain component from scratch. The component holds `Item` instances and aggregates their output — it does not re-implement any item logic. Think of it as a lightweight orchestrator that pushes context down and pulls totals up.

Prerequisites: Task I-2 must be complete. `Item.fromDefinition()` must accept DB-shaped definitions and all tests must pass.

Reference: `plan/I-3-category/STATE_CONTRACT.md` (write this first), `plan/I-3-category/minimal_js_pseudo_code.md`

Run `npm test` after every step.

---

## Step 1 — Write STATE_CONTRACT.md

File: `packages/components/category/STATE_CONTRACT.md`

Document before writing any code:
1. **External state** — what flows in from outside (basket context, category definition from DB)
2. **Internal state** — what Category owns (its items list)
3. **Output shape** — what `toDisplayObject()` returns

Commit: `docs: add Category component state contract`

---

## Step 2 — Write failing tests

File: `packages/components/category/tests/Category.test.js`

Create the directory first:
```bash
mkdir -p packages/components/category/tests
```

Write tests that cover all completion criteria from `objectives.md`. Import `Category` from `../Category.js` (which does not exist yet). Import `Item` and `resolveItemDefinition` and seed from the established paths.

Run to confirm all fail (module not found).

---

## Step 3 — Implement Category.js

File: `packages/components/category/Category.js`

See `minimal_js_pseudo_code.md` for the class structure. Keep it minimal:
- Private `#definition` and `#items` fields
- `addItem(item)`, `removeItem(itemId)`, `receiveContext(ctx)`, `toDisplayObject()`
- No Alpine, no XState, no event emitters at this stage

---

## Step 4 — Run tests

```bash
npm test
```

All Category tests must pass. All existing 462+ tests must still pass.

Commit: `feat: add Category domain component with tests`

---

## Step 5 — Build the playground mount function

File: `packages/components/category/logic/createCategoryStandaloneComponent.js`

The mount function sets up an Alpine component that:
1. Maintains the `externalContext` (paxGlobal, dia, hora) — the External State Panel controls
2. Maintains the selected category definition
3. Maintains the `Category` instance and its items list
4. Re-calls `category.receiveContext()` and `item.calculate()` whenever context changes
5. Exposes `state = category.toDisplayObject()` for the template to bind to

See `minimal_js_pseudo_code.md` for the Alpine component data structure.

---

## Step 6 — Build the playground template

File: `packages/components/category/ui/CategoryStandalone.html`

Follow the three-zone structure from `html_playground_draft.html`:
- **Zone 1** (External State): category selector, paxGlobal/dia/hora inputs, add-item dropdown
- **Zone 2** (Component Display): category header with name + subtotal, then a list of item cards — each card is a **placeholder** showing the item name and total, not the full Item playground
- **Zone 3** (Debug): toDisplayObject() JSON dump

The item cards in Zone 2 are simple `<div>` elements showing `item.nome` and `item.total`. They are **not** the full ItemStandalone component. That integration comes in Phase II (step 9 — environment + item).

---

## Step 7 — Create sandbox route

File: `apps/sandbox/routes/step-I3-category/index.html`

Standard sandbox page:
- Links global CSS
- Loads Alpine
- Imports and calls `mountCategoryStandalone(document.getElementById('app'))`

Update:
- `apps/sandbox/index.html` — add nav link to step-I3-category
- `tools/serve-sandbox.mjs` — add `'step-I3-category'` to route list

---

## Step 8 — Manual test

```bash
npm run serve:sandbox
# Open http://localhost:8090/step-I3-category/
```

Walk through every human-testable criterion in `objectives.md`.

Commit: `feat: add Category component playground (step-I3)`

---

## What NOT to do

- Do not embed ItemStandalone HTML inside the category playground — item cards are placeholders only
- Do not add rule evaluation logic to Category — rules live in each Item
- Do not compute pricing inside Category — it only sums `item.total` values

## XState requirement

Category **must use XState** for its playground orchestration. The machine blueprint is in `plan/I-3-category/machine_blueprint.md`. Category is the first item-container; its machine pattern will be extended for Kit and Basket in later phases. The domain class (`Category.js`) stays pure — XState lives only in `createCategoryStandaloneComponent.js`.
