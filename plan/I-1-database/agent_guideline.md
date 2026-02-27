# I-1 Database — Agent Guideline

## Context

You are implementing the database foundation step. The schema is already defined in `packages/database/src/Config_Schema.js` — do not modify it. Your job is to write seed data that uses exactly those field names, and a pure resolver function that joins the tables.

Reference for field names: `plan/I-1-database/field_contracts.md`
Reference for full implementation plan: `plan/antecedents/reorder-implementation-plan.md` (Tasks 5–7)

Run `npm test` after every step. Do not proceed if tests fail.

---

## Step 1 — Write field_contracts.md

Before touching any code, write `plan/I-1-database/field_contracts.md` documenting the exact shape of a resolved item definition. See the pseudo code file for the expected shape.

This document is the contract all later components depend on. Take time to get it right.

Commit: `docs: add database field contracts`

---

## Step 2 — Rewrite seed.js with real field names

File: `packages/database/src/seed.js`

Read the existing seed.js first. Then rewrite it so every row uses the exact field names from `Config_Schema.js`. The minimum required rows:

- `SEED_PERFILES_PRECIO`: 2 profiles (one per-pax, one time-based)
- `SEED_CATEGORIAS`: 2 categories (one requiring pax, one requiring time)
- `SEED_ITEM_CATALOGO`: 3 items (2 with no profile override, 1 with override)
- `SEED_REGLAS_NEGOCIO`: 2 rules (1 ERROR, 1 WARNING, both `Scope='ITEM'`, `Etapa='RESTRICCION_UI'`)

See `minimal_js_pseudo_code.md` for the exact field names.

Export each as a named constant: `SEED_PERFILES_PRECIO`, `SEED_CATEGORIAS`, `SEED_ITEM_CATALOGO`, `SEED_REGLAS_NEGOCIO`.

---

## Step 3 — Write seed.test.js (write test BEFORE running)

File: `packages/database/src/seed.test.js`

Tests must verify:
1. Each table's rows have the correct primary key field name
2. Each table's rows have the required domain fields
3. Foreign key references resolve (e.g., every `ID_Perfil_Precio_Default` in CATEGORIAS exists in PERFILES_PRECIO)
4. At least one item has `ID_Perfil_Precio_Override: null` (inherits from category)
5. At least one item has a non-null `ID_Perfil_Precio_Override` (override case)

Run tests first to confirm they fail (module exists but fields may be wrong), then fix seed.js until they pass.

Commit: `feat: rewrite seed fixtures with real schema field names`

---

## Step 4 — Write resolveItemDefinition.test.js (write test BEFORE implementation)

File: `packages/database/src/resolveItemDefinition.test.js`

Tests must cover:
1. Returns item with category joined in as `item.categoria`
2. Returns resolved pricing profile as `item.perfil` — uses category default when item has no override
3. Returns resolved pricing profile as `item.perfil` — uses item override when present
4. Returns `item.reglas` as an array of active RESTRICCION_UI rules scoped to ITEM
5. Throws a descriptive error when `itemId` is not found in the items array

Run to confirm all fail (module does not exist yet).

---

## Step 5 — Implement resolveItemDefinition.js

File: `packages/database/src/resolveItemDefinition.js`

Pure function. No classes, no state, no async. See `minimal_js_pseudo_code.md`.

Run tests. All must pass.

Commit: `feat: add resolveItemDefinition() adapter with tests`

---

## Step 6 — Build the database playground

Files:
- `apps/sandbox/routes/step-I1-database/index.html`
- Update `apps/sandbox/index.html` (add nav link)
- Update `tools/serve-sandbox.mjs` (add route `'step-I1-database'`)

The playground is a simple HTML page (no Alpine needed, just vanilla JS or minimal Alpine) that:
1. Shows a table selector dropdown (the four seed tables)
2. Renders the selected table's rows as an HTML table with correct column headers
3. Has an item selector dropdown that calls `resolveItemDefinition()` and shows the result as formatted JSON

See `html_playground_draft.html` for the structural wireframe.

Manual test:
- Open `http://localhost:8090/step-I1-database/`
- Browse each table, verify all rows and fields are visible
- Select each item, verify the resolved definition matches expectations

Commit: `feat: add database browser playground (step-I1)`

---

## What NOT to do

- Do not add more tables to the seed than listed — YAGNI
- Do not add async database operations — the seed is in-memory, synchronous
- Do not implement the full `createDatabase()` factory now — that comes later
- Do not modify `Config_Schema.js`
