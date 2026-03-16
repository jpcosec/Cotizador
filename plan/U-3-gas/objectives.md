# U-3 GAS Persistence - Objectives

## Goal

Port save/load behavior to real Google Sheets in Apps Script using the U-1 persistence boundary, while preserving proven legacy flow and layering.

---

## Legacy Decisions To Reuse

- Router functions exposed to client (`guardarCotizacion`, `cargarCotizacion`) via `google.script.run`.
- Service orchestration separated from model/store access.
- Sheet persistence through a dedicated abstraction (`SheetDB` in legacy).

References:

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Models.js`
- `claps_codelab/SheetDB.js`

---

## What this step produces

| Artifact | Location |
|---|---|
| GAS save/load server functions (legacy-compatible naming + aliases if needed) | `tools/generate_gas_code.mjs` -> `gas/Code.gs` |
| GAS adapter implementing `PersistencePort` | `packages/database/src/persistence/GasSheetAdapter.js` |
| Local shim parity for save/load | `apps/gas/Local_GAS_Shim.html` |
| Runtime adapter selection wiring | `bundling/createQuotationRuntime.js` |
| Smoke test protocol | `plan/U-3-gas/phases/03_integration.md` |

---

## Completion Criteria

- [ ] Server functions can save and load quotation header + detail rows from Sheets.
- [ ] Function contract is compatible with `google.script.run` and normalized at adapter boundary.
- [ ] `GasSheetAdapter` conforms to `PersistencePort`.
- [ ] Local shim reproduces the same contract for preview.
- [ ] Real GAS deployment round-trip succeeds (save -> load).
- [ ] Concurrency and write safety risks are documented and mitigated.

---

## Constraints

- Runtime must remain storage-agnostic.
- Do not duplicate business logic in UI layer.
- Spreadsheet resolution strategy must be explicit (configured ID and/or active spreadsheet fallback).
- Keep legacy-compatible behavior where it is already proven.
