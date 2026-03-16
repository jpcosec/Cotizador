# U-3 GAS Persistence - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_gas_server.md` - port legacy save/load server semantics
2. `02_gas_adapter.md` - implement boundary adapter and local shim parity
3. `03_integration.md` - deploy and verify save/load against real Sheets

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- Legacy flow must be reviewed before implementation.
- `PersistencePort` remains the only runtime boundary.
- Local preview and real GAS must share the same contract shape.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Legacy-referenced checklist for the phase is complete.
2. Automated tests pass for touched scope.
3. Manual verification passes in local preview and/or real GAS as required.

## Commit Sequence

1. `docs(plan): define U-3 GAS server contract from legacy`
2. `feat: implement GasSheetAdapter and local shim parity`
3. `test: verify GAS save/load round-trip on real sheets`
