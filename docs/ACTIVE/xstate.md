# XState Orchestration (Current)

## Module

- Path: `packages/xstate`
- Machine factory: `src/Orchestration/quotationMachine.xstate.js`
- Blueprint: `src/Orchestration/quotationMachineBlueprint.js`
- Service facade: `src/QuotationService.js`

## Responsibilities

- Drive quotation lifecycle through actor events.
- Coordinate pricing recalculation and persistence boundaries.
- Maintain workflow context (quotation, lines, totals, messages, errors).
- Support parallel concerns where applicable (workflow/data management).

## Adapters

- `adapters/actions.js` for synchronous state transitions/effects.
- `adapters/guards.js` for transition guards.
- `adapters/services.js` for async operations.

## Known Open Items

- Complete `updateRow` and `addNewRow` write behavior in actions adapter.
- Implement real async send behavior in services adapter.
- Complete machine-native `LOAD_QUOTATION` integration path.

See `../TODO_ACTIVE_NON_LEGACY.md` for prioritized tasks.
