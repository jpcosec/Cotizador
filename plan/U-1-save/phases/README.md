# U-1 Save Vertical Slice - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_save_contract.md` - legacy extraction + rebuild save contract
2. `02_persistence_port.md` - boundary and local adapter implementation
3. `03_runtime_wiring.md` - runtime/UI integration using the boundary

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- Legacy behavior must be reviewed first (`Codigo.js`, `Controller_Cotizacion.js`, `Models.js`, `SheetDB.js`, `Stores_App.html`).
- Mapper is pure (no I/O).
- Runtime depends only on `PersistencePort`.
- Adapter owns physical persistence details.
- Field names in persisted payload match `Config_Schema.js`.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Legacy baseline references are captured in the phase output.
2. Objectives checklist in that phase document is complete.
3. Automated tests pass for touched scope.
4. Manual flow verification passes.

## Commit Sequence

1. `docs(plan): align U-1 save contract with legacy behavior`
2. `feat: implement persistence boundary and local adapter`
3. `feat: wire save/load flow through PersistencePort`
