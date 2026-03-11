# I-1 Database — Objectives

## Goal

Establish the real database schema as the single source of truth for component data. Deliver a verified seed fixture, edit operations, validation rules, and a table-first database playground that uses exact DB-native field names.

---

## What this step produces

| Artifact | Location |
|---|---|
| Verified seed fixtures (real field names) | `packages/database/src/seed.js` |
| Seed schema conformance tests | `packages/database/src/seed.test.js` |
| Edit database service | `packages/database/src/services/editService.js` |
| Data validation module | `packages/database/src/validation.js` |
| Interactive DB browser playground | `apps/sandbox/routes/step-I1-database/index.html` |

---

## Completion Criteria

- [ ] `seed.js` uses exact field names from `Config_Schema.js` for all four tables: `PERFILES_PRECIO`, `CATEGORIAS`, `ITEM_CATALOGO`, `REGLAS_NEGOCIO`
- [ ] `seed.test.js` passes and verifies field names match schema column names

### Edit database service
- [ ] `editService.js` exposes `updateRow(table, id, patch)`, `addRow(table, row)`, and `deleteRow(table, id)` as pure functions operating on the in-memory store
- [ ] Each write operation returns `{ ok, data, error }` and never throws
- [ ] Service is called by the playground inline-edit and add-row flows; GasSheetStore adapter is wired in Phase 4

### Data validation
- [ ] `validation.js` defines per-table field rules derived from `Config_Schema.js` (required fields, allowed values, FK existence checks)
- [ ] Validation runs in two contexts: (a) tag-filter annotation for constraint violations, (b) pre-commit checks for inline edits and new rows
- [ ] Invalid state is surfaced visually with red outline and tooltip
- [ ] A row with validation errors cannot be saved (commit is blocked until fixed or cancelled)

### Add row
- [ ] An "Add row" button appears in the toolbar (right side, before the row count pill)
- [ ] Clicking it appends a blank template row to the current table and immediately enters inline-edit mode on the first required field
- [ ] New rows are marked with a `_new: true` flag until saved, displayed with a subtle green-left-border accent
- [ ] Saving validates the full row; cancelling removes the pending row entirely

---

## Testing Criteria

**Automated:**
```bash
npm test
# All tests pass, including new seed/edit/validation coverage
```

**Human (playground):**
- [ ] Can browse each table (`PERFILES_PRECIO`, `CATEGORIAS`, `ITEM_CATALOGO`, `REGLAS_NEGOCIO`) and see all seed rows with correct field names
- [ ] Can sort any column by clicking its header; direction indicator is visible
- [ ] Tag filter chips appear for `ITEM_CATALOGO` (by category) and `REGLAS_NEGOCIO` (by action type); filtering updates row count
- [ ] Double-clicking a cell enters inline edit; Enter commits, Escape cancels; invalid values show a red outline and block save
- [ ] "Add row" appends a blank row, enters edit mode, validates before saving, and cancels cleanly

---

## Key constraint

All edit and validation primitives remain synchronous and side-effect-light for local development. The async adapter layer (`GasSheetStore`) is introduced only in Phase 4.

---

## What is already migrated (do not re-create)

| Artifact | Status | Location |
|---|---|---|
| `Config_Schema.js` (11-table schema) | ✅ Migrated | `packages/database/src/Config_Schema.js` |
| `IStore.js` + `ModelFactory.js` + `InMemoryStore.js` | ✅ Migrated | `packages/database/src/` |
| `createDatabase({ adapter, schema, seed })` | ✅ Migrated | `packages/database/src/createDatabase.js` |
| `seed.js` minimal fixture (SEED_DATA format) | ✅ Exists | `packages/database/src/seed.js` |
| `csvSeed.js` — Node.js CSV loader | ✅ Created | `packages/database/src/csvSeed.js` |
| Real production CSV data (188 items, 63 rules) | ✅ Migrated | `data/init/*.csv` |

## What is planned for later phases

| Artifact | Phase | Source to port from |
|---|---|---|
| `GasSheetStore` (Google Sheets adapter) | Phase 4 | `claps_codelab/packages/database/src/stores/GasSheetStore.js` |
| `FileStore` (local file adapter) | Phase 4 | `claps_codelab/packages/database/src/stores/FileStore.js` |
| Extend `createDatabase` to support `adapter: 'gas'` | Phase 4 | `claps_codelab/packages/database/src/createDatabase.js` |
