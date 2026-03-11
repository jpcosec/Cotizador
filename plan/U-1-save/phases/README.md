# U-1 Save Vertical Slice - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_save_contract.md` - define SavePayload shape and serialization mapper
2. `02_persistence_port.md` - implement PersistencePort interface and local adapter
3. `03_runtime_wiring.md` - wire confirmSave/loadQuotation into runtime and UI

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- Mapper is a pure function — no I/O, no side effects.
- PersistencePort is an interface — adapter is injected, never hard-coded.
- Local adapter uses existing InMemoryStore from `packages/database/`.
- Field names in persistence layer match `Config_Schema.js` exactly.
- Do not modify item/basket/catalog runtime contracts.
- All existing tests must remain green after every phase.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Objectives checklist in that phase document is complete.
2. Automated test suite passes for touched scope.
3. Manual verification passes for phase behavior.
4. Commit created with the exact phase commit message.

## Commit Sequence

1. `docs: add SavePayload contract for quotation persistence`
2. `feat: add serializeQuotation mapper with tests`
3. `feat: add PersistencePort and LocalPersistenceAdapter`
4. `feat: wire confirmSave command into quotation runtime`
5. `feat: enable Confirm & Save in quotation UI`
