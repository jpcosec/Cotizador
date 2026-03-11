# U-1 Save Vertical Slice — Objectives

## Goal

Enable the `Confirm` button in the validation stage to save a quotation to local persistence (CSV-simulated InMemoryStore), producing a recoverable `ID_Cotizacion`. This establishes the `SavePayload` contract that U-3 (GAS) and U-4 (PDF) depend on.

---

## What this step produces

| Artifact | Location |
|---|---|
| `SavePayload` type contract | `packages/database/src/persistence/SavePayload.md` |
| `serializeQuotation(snapshot)` mapper | `packages/database/src/persistence/serializeQuotation.js` |
| `PersistencePort` interface | `packages/database/src/persistence/PersistencePort.js` |
| `LocalPersistenceAdapter` (InMemory) | `packages/database/src/persistence/LocalPersistenceAdapter.js` |
| `confirmSave()` command in runtime | `apps/quotation/state/createQuotationInternalRuntime.js` |
| `loadQuotation(id)` command in runtime | `apps/quotation/state/createQuotationInternalRuntime.js` |
| UI wiring for Confirm button | `apps/quotation/playground/QuotationFlowInternal.html` |
| Bundled flow component wiring | `bundling/createQuotationFlowComponent.js` |
| Tests | `packages/database/src/persistence/serializeQuotation.test.js` |

---

## Completion Criteria

### SavePayload contract
- [ ] `SavePayload.md` documents the exact shape of data written to `COTIZACIONES` and `LINEA_DETALLE`
- [ ] Shape maps 1:1 to `Config_Schema.js` column definitions for both tables

### Serialization mapper
- [ ] `serializeQuotation(snapshot, client, settings)` produces `{ cotizacion: {...}, lineas: [...] }`
- [ ] `cotizacion` fields: `ID_Cotizacion`, `ID_Cliente`, `Estado`, `Fecha_Evento`, `Duracion_Dias`, `Pax_Global`, `Updated_At`
- [ ] Each `linea` fields: `ID_Linea`, `ID_Cotizacion`, `ID_Item`, `Estado_Linea`, `Dia_Numero`, `Hora_Inicio`, `Override_Pax`, `Override_Cantidad`, `Override_Duracion_Min`, `Comentarios`, `Updated_At`
- [ ] Mapper is a pure function with zero side effects

### PersistencePort
- [ ] Interface defines `save(payload)` → `{ ok, id, error }` and `load(id)` → `{ ok, data, error }`
- [ ] `LocalPersistenceAdapter` implements the interface using `createDatabase` models
- [ ] Save writes to `COTIZACIONES` and `LINEA_DETALLE` tables in InMemoryStore
- [ ] Load reads back and reconstructs a snapshot-compatible shape

### Runtime integration
- [ ] `confirmSave()` added to `createQuotationInternalRuntime` API
- [ ] `loadQuotation(id)` added to runtime API
- [ ] Save transitions stage from `validation` → `completed` with `quotationId` available
- [ ] Load reconstructs basket state from persisted lineas

### UI wiring
- [ ] `Confirm (deferred)` button becomes active `Confirm & Save`
- [ ] After save, `quotationId` is displayed in completed stage
- [ ] Bundled GAS flow component exposes the same confirm/load commands

---

## Testing Criteria

**Automated:**
```bash
npm test
# All existing tests pass + new serialization/persistence tests
```

**Manual (sandbox):**
- [ ] Create quotation with items across 2+ days
- [ ] Click Confirm → see quotation ID
- [ ] Verify serialized data shape matches SavePayload contract

**Manual (GAS preview):**
```bash
npm run dev:gas
# Open http://localhost:8082
```
- [ ] Same confirm flow works in GAS preview mode

---

## Key Constraints

- Mapper must be pure — no database access, no I/O
- PersistencePort is an interface — adapter selection happens at runtime factory level
- Local adapter uses existing `InMemoryStore` — no new store implementations
- Do not modify `Config_Schema.js`
- Do not modify item/basket/catalog machine contracts
- `ID_Cotizacion` format: `COT-{timestamp}-{random}` (matches legacy pattern)

---

## What already exists

| Artifact | Status | Location |
|---|---|---|
| `COTIZACIONES` + `LINEA_DETALLE` schema | ✅ Defined | `packages/database/src/Config_Schema.js:119-146` |
| `InMemoryStore` with insert/update/all | ✅ Complete | `packages/database/src/stores/InMemoryStore.js` |
| `createDatabase({ seed })` factory | ✅ Complete | `packages/database/src/createDatabase.js` |
| `IStore` interface | ✅ Complete | `packages/database/src/IStore.js` |
| `Item.toSeed()` serialization | ✅ Complete | `packages/components/item/Item.js` |
| `buildValidationProjection()` | ✅ Complete | `apps/quotation/state/createQuotationInternalRuntime.js:62-86` |
| Runtime `getSnapshot()` with full basket state | ✅ Complete | `apps/quotation/state/createQuotationInternalRuntime.js:225-258` |
| `QuotationHeader` emits `SAVE_CLICKED` | ✅ Complete | `packages/components/quotation/views/QuotationHeader.js:28` |
| `AppState` handles `SAVE_QUOTATION` / `CONFIRM_SAVE` | ✅ Complete | `packages/components/quotation/modals/AppState.js:160-176` |
| Legacy `guardarCotizacion()` reference | ✅ Reference | `claps_codelab/Stores_App.html:199-213` |
| Legacy `servicioGuardarCotizacion()` reference | ✅ Reference | `claps_codelab/Codigo.js:56-58` |
