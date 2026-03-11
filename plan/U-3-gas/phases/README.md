# U-3 GAS Persistence - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_gas_server.md` - GAS server functions for save/load
2. `02_gas_adapter.md` - client-side GasSheetAdapter + local shim extensions
3. `03_integration.md` - adapter selection, bundle, and real GAS smoke test

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- `PersistencePort` interface must not be modified.
- Payload shape over `google.script.run` must be JSON-serializable.
- Local GAS shim must remain functional for development.
- GAS server functions use `getActiveSpreadsheet()`, not `openById()`.
- All existing tests must remain green after every phase.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Objectives checklist in that phase document is complete.
2. Automated test suite passes for touched scope.
3. Manual verification passes for phase behavior.
4. Commit created with the exact phase commit message.

## Commit Sequence

1. `feat: add saveQuotation/loadQuotation to GAS server template`
2. `feat: add GasSheetAdapter client-side persistence`
3. `feat: extend Local_GAS_Shim with save/load persistence`
4. `feat: add environment-based persistence adapter selection`
5. `test: verify GAS persistence smoke test`
