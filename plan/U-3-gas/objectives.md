# U-3 GAS Persistence — Objectives

## Goal

Make the same `confirmSave()` flow from U-1 work against real Google Sheets via Apps Script. The `PersistencePort` interface enables this by swapping the local adapter for a GAS adapter — no runtime or UI changes needed.

---

## What this step produces

| Artifact | Location |
|---|---|
| `GasSheetAdapter` (PersistencePort impl) | `packages/database/src/persistence/GasSheetAdapter.js` |
| GAS server functions | `tools/generate_gas_code.mjs` (templates for `saveQuotation`, `loadQuotation`) |
| `Local_GAS_Shim.html` extensions | `apps/gas/Local_GAS_Shim.html` |
| GAS adapter selection logic | `bundling/createQuotationRuntime.js` |
| Smoke tests | `packages/database/src/persistence/GasSheetAdapter.test.js` |

---

## Completion Criteria

### GAS server functions
- [ ] `saveQuotation(payload)` writes to `COTIZACIONES` and `LINEA_DETALLE` sheets
- [ ] `loadQuotation(id)` reads from both sheets and returns joined data
- [ ] Both use `SpreadsheetApp` API with proper error handling
- [ ] Generated into `gas/Code.gs` via `tools/generate_gas_code.mjs`

### GasSheetAdapter (client-side)
- [ ] Implements `PersistencePort` interface
- [ ] `save(payload)` calls `google.script.run.saveQuotation(payload)` with success/failure handlers
- [ ] `load(id)` calls `google.script.run.loadQuotation(id)` with success/failure handlers
- [ ] Returns promise-based `{ ok, id|data, error }` matching `PersistencePort` contract

### Local GAS Shim extensions
- [ ] `Local_GAS_Shim.html` implements `saveQuotation` and `loadQuotation` methods
- [ ] Local shim uses `LocalPersistenceAdapter` internally (same as U-1 local flow)
- [ ] No behavior difference between local preview and real GAS — same data shape

### Adapter selection
- [ ] `createQuotationRuntime` detects environment (localhost vs GAS) and selects adapter
- [ ] Localhost: uses local shim → `LocalPersistenceAdapter`
- [ ] GAS: uses `GasSheetAdapter` → `google.script.run`
- [ ] Adapter selection is transparent to the quotation flow component

### Spreadsheet verification
- [ ] `clasp push` succeeds with generated code
- [ ] Save writes visible rows in `COTIZACIONES` and `LINEA_DETALLE` sheets
- [ ] Load retrieves correct data from sheets
- [ ] Round-trip: save → load → data integrity verified

---

## Testing Criteria

**Automated:**
```bash
npm test
# GasSheetAdapter tests pass (using mock google.script.run)
```

**Manual (local GAS preview):**
```bash
npm run dev:gas
# Confirm → verify shim intercepts and uses local adapter
```

**Manual (real GAS):**
```bash
npm run build && clasp push
# Deploy as webapp → Confirm → verify rows in spreadsheet
```

---

## Key Constraints

- Do not modify `PersistencePort` interface — GAS adapter must conform to it
- Do not modify quotation runtime — adapter is injected via factory
- GAS server functions must handle concurrent writes safely (lock sheet)
- Local shim must remain functional when `google.script.run` is not available
- Payload shape over `google.script.run` must be JSON-serializable (no Maps, Sets, functions)

---

## What already exists

| Artifact | Status | Location |
|---|---|---|
| `PersistencePort` interface | U-1 output | `packages/database/src/persistence/PersistencePort.js` |
| `LocalPersistenceAdapter` | U-1 output | `packages/database/src/persistence/LocalPersistenceAdapter.js` |
| `serializeQuotation()` mapper | U-1 output | `packages/database/src/persistence/serializeQuotation.js` |
| `Local_GAS_Shim.html` (basic) | ✅ Complete | `apps/gas/Local_GAS_Shim.html` |
| `gas/Code.gs` (healthcheck only) | ✅ Complete | `gas/Code.gs` |
| `generate_gas_code.mjs` template | ✅ Complete | `tools/generate_gas_code.mjs` |
| Legacy `SheetDB` ORM | ✅ Reference | `claps_codelab/SheetDB.js` |
| Legacy `guardarCotizacion()` server | ✅ Reference | `claps_codelab/Codigo.js:56-58` |
| Legacy `google.script.run` client calls | ✅ Reference | `claps_codelab/Stores_App.html:199-307` |
