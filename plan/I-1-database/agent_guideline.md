# I-1 Database — Agent Guideline

## Context

You are implementing the database foundation step. The schema is already defined in `packages/database/src/Config_Schema.js`; do not modify it. Your job is to verify and test seed data with exact field names, then deliver editable/validated table browsing for the database playground.

The real production CSV data (188 items, 12 categories, 188 profiles, 63 rules) is at `data/init/*.csv`.
A `csvSeed.js` utility already exists at `packages/database/src/csvSeed.js` for loading it (Node.js only).
The minimal fixture for tests lives in `packages/database/src/seed.js`; use this for unit tests.

Run `npm test` after each step. Do not proceed if tests fail.

---

## Step 1 — Verify CSV loading covers all 11 tables

**Data source:** `data/init/*.csv` is the only source of truth. Do not maintain a separate hand-written seed fixture for the playground or integration tests.

Load data via:
- `loadSeedFromCsvUrl(baseUrl)` — browser (fetches from `/data/init`)
- `loadSeedFromCsvDir(dirPath)` — Node.js tests (reads from `data/init/`)

Verify that all 11 tables load without error and that `BROWSER_TABLES` in `databaseMachine.js` lists all of them:

```
Block 1 — Reference:   CLIENTES, PERFILES_PRECIO, CATEGORIAS, ITEM_CATALOGO, COMPOSICION_KIT, REGLAS_NEGOCIO
Block 2 — Transactional: COTIZACIONES, LINEA_DETALLE, AJUSTES_COTIZACION, CACHE_COTIZACION, HISTORIAL_COTIZACION
```

Tables with header-only CSVs (no data rows yet) should still load without error.

Export format (single named export):
```js
export const SEED_DATA = [
  { table: 'PERFILES_PRECIO', records: [...] },
  { table: 'CATEGORIAS', records: [...] },
  { table: 'ITEM_CATALOGO', records: [...] },
  { table: 'REGLAS_NEGOCIO', records: [...] }
];
```

---

## Step 2 — Validate CSV integration via `seed.test.js`

File: `packages/database/src/seed.test.js`

Tests load directly from `data/init/*.csv` using `loadSeedFromCsvDir()`. No hand-written seed fixture — the CSV files are the test data.

Tests must verify:
1. All 11 tables load without error
2. FK references resolve across tables (e.g., `ITEM_CATALOGO.ID_Categoria` → `CATEGORIAS`)
3. At least one item has `ID_Perfil_Precio_Override: null` (inherits from category)
4. At least one item has a non-null `ID_Perfil_Precio_Override` (explicit override)
5. `REGLAS_NEGOCIO` rows contain at least one `ERROR` and one `WARNING` rule with `Scope='ITEM'`

Run tests first to confirm failures if coverage is missing, then fix until all pass.

Commit: `feat: csv-based schema conformance and FK integrity tests`

---

## Step 3 — Implement edit service

File: `packages/database/src/services/editService.js`

Implement pure write helpers over in-memory models:
- `updateRow(table, id, patch)`
- `addRow(table, row)`
- `deleteRow(table, id)`

Rules:
- Return `{ ok, data, error }` for every operation
- Do not throw from public service methods
- Keep implementation synchronous for in-memory workflows

Add tests for success + failure paths.

Commit: `feat: add database edit service for playground writes`

---

## Step 4 — Implement validation module

File: `packages/database/src/validation.js`

Build per-table validation rules from `Config_Schema.js`:
- Required fields
- Enum/allowed-value checks
- FK existence checks

Expose:
- `validateField(table, field, value, context)`
- `validateRow(table, row, context)`

Add tests for field-level and row-level validation behavior.

Commit: `feat: add schema-derived validation for db playground`

---

## Step 5 — Build database playground route (table-first)

Files:
- `apps/sandbox/routes/step-I1-database/index.html`
- `apps/sandbox/index.html` (add nav link)
- `tools/serve-sandbox.mjs` (add route `'step-I1-database'`)

The playground should support:
1. Table selector for all 11 real tables (loaded from `data/init/*.csv`)
2. Sortable headers
3. Tag filters (category for items, action type for rules)
4. Inline cell edit with Enter/Escape behavior
5. Add row flow with `_new: true` pending state and cancel/remove
6. Validation feedback on invalid edits

Manual test:
- Open `http://localhost:8090/step-I1-database/`
- Browse all tables and verify field names + row rendering
- Edit invalid value and verify save is blocked with visual error
- Add row, save valid row, and cancel pending row
- Double-click cell to edit, confirm with Enter, cancel with Escape

Commit: `feat: add editable database playground (step-I1)`

---

## What NOT to do

- Do not modify `Config_Schema.js`
- Do not add async database writes in this step
- Do not use `csvSeed.js` in browser-facing code (it uses Node `fs`)
- Do not scope this step to resolver diagnostics; that work lives in `plan/III-1-resolver/`
