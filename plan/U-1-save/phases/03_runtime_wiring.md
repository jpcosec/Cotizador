# Phase 03 - Runtime/UI Wiring Through PersistencePort

## Context

Phase 02 provides the storage boundary.
This phase wires save/load actions to runtime and UI without leaking storage details.

## Objectives

- [ ] Add `confirmSave()` and `loadQuotation(id)` to quotation runtime using `PersistencePort` only.
- [ ] Enable `Confirm & Save` action in validation UI.
- [ ] Show quotation ID after successful save.
- [ ] Keep error handling visible and non-blocking.

## Integration Rules

- No direct model/store calls in UI or runtime.
- Storage choice (local/GAS) is injected at runtime factory boundary.
- Flow semantics remain aligned with legacy save/confirm behavior.

## Outputs

- `apps/quotation/state/createQuotationInternalRuntime.js`
- `apps/quotation/playground/QuotationFlowInternal.html`
- `bundling/createQuotationFlowComponent.js`

## Acceptance

- Save works in sandbox and GAS preview.
- Quotation ID is propagated to completed state.
- Tests remain green.

## Commit

`feat: wire save/load flow through PersistencePort`
