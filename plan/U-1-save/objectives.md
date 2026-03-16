# U-1 Save Vertical Slice - Objectives

## Goal

Enable `Confirm` to persist quotation data end-to-end in rebuild, while preserving the validated behavior already implemented in `claps_codelab` for save/load flow.

This step defines the canonical save contract used by:

- local simulation (InMemory/CSV-backed flow),
- GAS save/load adapters,
- PDF generation flow (save-first).

---

## Legacy Decisions To Preserve

From `claps_codelab`:

1. Save/Load/PDF are routed via GAS-facing functions (`guardarCotizacion`, `cargarCotizacion`, `generarPDF`).
2. Save-first flow is mandatory before PDF generation.
3. Business flow is layered: router -> controller/service -> model/store.
4. Client + quotation + detail rows are persisted together as one business operation.

References:

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Models.js`
- `claps_codelab/Stores_App.html`

---

## What this step produces

| Artifact | Location |
|---|---|
| Save contract (legacy parity + rebuild schema mapping) | `packages/database/src/persistence/SavePayload.md` |
| Snapshot serializer (pure) | `packages/database/src/persistence/serializeQuotation.js` |
| Persistence boundary interface | `packages/database/src/persistence/PersistencePort.js` |
| Local adapter (InMemory/CSV simulation) | `packages/database/src/persistence/LocalPersistenceAdapter.js` |
| Runtime wiring (`confirmSave`, `loadQuotation`) | `apps/quotation/state/createQuotationInternalRuntime.js` |
| UI wiring (`Confirm & Save`) | `apps/quotation/playground/QuotationFlowInternal.html` |
| Bundle wiring | `bundling/createQuotationFlowComponent.js` |

---

## Completion Criteria

### Contract

- [ ] `SavePayload.md` includes two mappings:
  - legacy semantic mapping (`claps_codelab` fields and responses),
  - rebuild schema mapping (`COTIZACIONES`, `LINEA_DETALLE` in `Config_Schema.js`).
- [ ] ID strategy is configurable via boundary (no hard-coded format in runtime).

### Serializer

- [ ] `serializeQuotation(...)` is pure and deterministic.
- [ ] All required transactional columns are populated.
- [ ] Overrides are mapped (`pax`, `cantidad`, `duracionMin`, `hora`, `comentarios`).

### Boundary

- [ ] Runtime depends only on `PersistencePort`.
- [ ] Local adapter implements `save/load` with no UI dependency.
- [ ] Response contract normalizes legacy shape and rebuild shape.

### Runtime/UI

- [ ] `confirmSave()` transitions `validation -> completed` on success.
- [ ] `quotationId` is visible after save.
- [ ] `loadQuotation(id)` path exists and returns normalized payload.

---

## Testing Criteria

**Automated:**

```bash
npm test
```

**Manual (sandbox + GAS preview):**

- [ ] Create quotation with entries across multiple days.
- [ ] Save succeeds and returns visible quotation ID.
- [ ] Load by ID returns expected header + detail rows.
- [ ] Behavior matches legacy save/load expectations.

---

## Key Constraints

- Keep layer separation strict: runtime -> interface -> adapter -> storage.
- Do not bind runtime/UI to physical DB details.
- Do not bypass `PersistencePort` from UI code.
- Do not change pricing/item/basket contracts to implement persistence.

---

## What already exists

| Artifact | Status | Location |
|---|---|---|
| Transactional schema (`COTIZACIONES`, `LINEA_DETALLE`) | ✅ | `packages/database/src/Config_Schema.js` |
| In-memory store and model factory | ✅ | `packages/database/src/stores/InMemoryStore.js`, `packages/database/src/createDatabase.js` |
| Runtime snapshot/projection | ✅ | `apps/quotation/state/createQuotationInternalRuntime.js` |
| Legacy save/load behavior | ✅ reference | `claps_codelab/Controller_Cotizacion.js` |
| Legacy UI calls (`google.script.run`) | ✅ reference | `claps_codelab/Stores_App.html` |
