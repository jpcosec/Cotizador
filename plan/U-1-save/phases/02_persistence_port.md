# Phase 02 - Persistence Boundary and Local Adapter

## Context

Phase 01 defines the save contract.
This phase enforces layer separation so runtime stays storage-agnostic.

## Objectives

- [ ] Define/confirm `PersistencePort` interface (`save`, `load`).
- [ ] Implement local adapter for simulation and tests.
- [ ] Normalize adapter return shape (success/error contract).
- [ ] Add save/load round-trip tests.

## Design Rules

- Runtime and UI know only `PersistencePort`.
- Adapter owns physical storage specifics.
- Interface must support both local simulation and GAS without changes to runtime.

## Outputs

- `packages/database/src/persistence/PersistencePort.js`
- `packages/database/src/persistence/LocalPersistenceAdapter.js`
- `packages/database/src/persistence/LocalPersistenceAdapter.test.js`

## Acceptance

- Adapter tests cover success and failure.
- No direct model/store imports from quotation runtime.
- Interface is sufficient for U-3 GAS adapter.

## Commit

`feat: implement persistence boundary and local adapter`
