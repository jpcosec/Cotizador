# Phase 03 - Runtime and UI Wiring

## Context

Phases 01-02 produced the serialization mapper and persistence adapter. This phase wires them into the quotation runtime and enables the Confirm button in the UI.

## Why

Without this wiring, the user cannot complete the quotation flow end-to-end.

## How

1. Add `persistence` option to `createQuotationInternalRuntime`.
2. Add `confirmSave()` and `loadQuotation(id)` to the runtime API.
3. Update UI to enable Confirm button and show completed stage.
4. Update bundled GAS flow component.
5. Rebuild bundle and verify in GAS preview.

## Objectives

### Runtime
- [ ] `createQuotationInternalRuntime` accepts optional `persistence` adapter.
- [ ] Default persistence is `LocalPersistenceAdapter` backed by a transactional-only database.
- [ ] `confirmSave()` serializes current state, calls `persistence.save()`, transitions to `completed`.
- [ ] `quotationId` available in `getSnapshot()` after save.
- [ ] `loadQuotation(id)` retrieves persisted data via `persistence.load()`.
- [ ] Error handling: if save fails, stage stays at `validation` and error is surfaced.

### UI
- [ ] Validation stage: `Confirm (deferred)` button replaced with active `Confirm & Save`.
- [ ] Completed stage: displays `quotationId` and `New Quotation` button.
- [ ] `New Quotation` resets flow via `resetToBrowse()`.

### Bundle
- [ ] `createQuotationFlowComponent.js` exposes `confirmSave()`.
- [ ] `createQuotationFlowComponent.js` syncs `quotationId` from snapshot.
- [ ] `npm run build` succeeds.
- [ ] GAS preview at `http://localhost:8082` shows functional Confirm button.

## Subagent Instructions

### Subagent A - Runtime changes (general)

Modify `apps/quotation/state/createQuotationInternalRuntime.js`:
- Add `persistence` parameter with default.
- Add `confirmSave()` and `loadQuotation(id)` methods.
- Add `quotationId` to snapshot.

### Subagent B - UI and bundle changes (general)

Modify:
- `apps/quotation/playground/QuotationFlowInternal.html` (enable button, add completed stage)
- `bundling/createQuotationFlowComponent.js` (expose confirmSave, sync quotationId)
- `apps/quotation/playground/mountQuotationFlow.js` (same changes for sandbox)

Run `npm run build` and verify.

## How To Test

### Automated
```bash
npm test
```

### Manual (sandbox)
```bash
npm run serve:sandbox
# Open quotation route → create items → validate → confirm → see quotation ID
```

### Manual (GAS preview)
```bash
npm run dev:gas
# Open http://localhost:8082 → same flow
```

## Commit

`feat: enable Confirm & Save in quotation UI`
