---
id: U-1
name: Save Vertical Slice
domain: persistence
status: completed
priority: p0
depends_on: []
pills:
  - pill-persist-boundary
  - pill-legacy-save-semantics
commit_messages:
  - docs(plan): align U-1 save contract with legacy behavior
  - feat: implement persistence boundary and local adapter
  - feat: wire save/load flow through PersistencePort
---

# U-1: Save Vertical Slice

## Goal

Enable `Confirm` to persist quotation data end-to-end in rebuild, while preserving validated behavior from `claps_codelab`.

## Legacy Decisions

1. Save/Load/PDF routed via GAS-facing functions
2. Save-first mandatory before PDF generation
3. Business flow layered: router → controller/service → model/store
4. Client + quotation + detail rows persisted as one operation

## Key Constraints

- Keep layer separation strict: runtime → interface → adapter → storage
- Do not bind runtime/UI to physical DB details
- Do not bypass `PersistencePort` from UI code
- Do not change pricing/item/basket contracts to implement persistence

## What This Produces

| Artifact | Location |
|----------|----------|
| Save contract + legacy mapping | `src/database/src/persistence/SavePayload.md` |
| Serializer | `src/database/src/persistence/serializeQuotation.js` |
| Persistence boundary | `src/database/src/persistence/PersistencePort.js` |
| Local adapter | `src/database/src/persistence/LocalPersistenceAdapter.js` |
| Runtime wiring | `src/state/createPersistedQuotationRuntime.js` |
| UI wiring | `playground/routes/step-04-quotation/index.html` |

---

## Phase 01: Save Contract

**Commit:** `docs(plan): align U-1 save contract with legacy behavior`

### Objectives

- [x] Document legacy save/load behavior in `SavePayload.md`
- [x] Document rebuild mapping to `COTIZACIONES` + `LINEA_DETALLE`
- [x] Define normalized response contract
- [x] Define ID policy as strategy
- [x] Implement pure serializer with tests

### Outputs

- `src/database/src/persistence/SavePayload.md`
- `src/database/src/persistence/serializeQuotation.js`
- `src/database/src/persistence/serializeQuotation.test.js`

### Acceptance

- Serializer covers all required transactional fields
- Contract separates semantic vs. storage representation
- No UI/runtime coupling in serializer

### Status: ✅ Implemented

---

## Phase 02: Persistence Boundary

**Commit:** `feat: implement persistence boundary and local adapter`

### Objectives

- [x] Define/confirm `PersistencePort` interface
- [x] Implement local adapter for simulation and tests
- [x] Normalize adapter return shape
- [x] Add save/load round-trip tests

### Design Rules

- Runtime and UI know only `PersistencePort`
- Adapter owns physical storage specifics
- Interface supports local + GAS without runtime changes

### Outputs

- `src/database/src/persistence/PersistencePort.js`
- `src/database/src/persistence/LocalPersistenceAdapter.js`
- `src/database/src/persistence/LocalPersistenceAdapter.test.js`

### Acceptance

- Adapter tests cover success and failure
- No direct model/store imports from quotation runtime
- Interface sufficient for U-3 GAS adapter

### Status: ✅ Implemented

---

## Phase 03: Runtime Wiring

**Commit:** `feat: wire save/load flow through PersistencePort`

### Objectives

- [x] Add `confirmSave()` and `loadQuotation(id)` to runtime via `PersistencePort`
- [x] Enable `Confirm & Save` action in validation UI
- [x] Show quotation ID after successful save
- [x] Keep error handling visible and non-blocking

### Integration Rules

- No direct model/store calls in UI or runtime
- Storage choice injected at runtime factory boundary
- Flow semantics aligned with legacy save/confirm behavior

### Outputs

- `src/state/createPersistedQuotationRuntime.js`
- `src/state/createQuotationInternalRuntime.js`
- `playground/routes/step-04-quotation/index.html`
- `bundling/createQuotationFlowComponent.js`

### Acceptance

- Save works in sandbox and GAS preview
- Quotation ID propagated to completed state
- Validation transitions through `saving`, returns on failure
- Load transitions through `loadingQuotation`
- Tests remain green

### Status: ✅ Implemented

---

## Completion Criteria

### Contract

- [x] `SavePayload.md` includes legacy + rebuild mappings
- [x] ID strategy configurable via boundary

### Serializer

- [x] `serializeQuotation(...)` is pure and deterministic
- [x] All required transactional columns populated
- [x] Overrides mapped

### Boundary

- [x] Runtime depends only on `PersistencePort`
- [x] Local adapter implements `save/load` with no UI dependency
- [x] Response contract normalized

### Runtime/UI

- [x] `confirmSave()` transitions validation → completed on success
- [x] Save flow through intermediate `saving` state
- [x] `quotationId` visible after save
- [x] `loadQuotation(id)` path exists
- [x] Load flow through intermediate `loadingQuotation` state

---

## Testing

**Automated:**
```bash
npm test
```

**Manual:**
- [ ] Create quotation with entries across multiple days
- [ ] Save succeeds and returns visible quotation ID
- [ ] Load by ID returns expected header + detail rows
- [ ] Behavior matches legacy save/load expectations
