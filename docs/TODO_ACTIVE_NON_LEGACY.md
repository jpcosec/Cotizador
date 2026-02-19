# TODO (Active, Non-Legacy)

This file captures actionable items that are still relevant after reviewing `docs/plan/` and `docs/future/`.

## Priority 1

- [ ] Implement machine-native `LOAD_QUOTATION` flow end-to-end in xstate adapters and frontend bridge.
- [ ] Replace deep `node_modules` imports in actor/bootstrap code with stable package-level imports.
- [ ] Implement xstate adapter write stubs in `actions.js` (`updateRow`, `addNewRow`).
- [ ] Implement real async send behavior in xstate `services.js`.

## Priority 2

- [ ] Implement `CANTIDAD_DEFAULT` defaults behavior in pricing pipeline where marked TODO.
- [ ] Standardize local vs GAS runtime path and document one canonical local validation flow.
- [ ] Add integration test that covers quotation load + edit + save with bridged frontend state.

## Priority 3

- [ ] Define determinism injection (`Clock`, `IdGenerator`) as prerequisite for event sourcing/replay.
- [ ] Add event sourcing spike from `future/EVENT_SOURCING_AND_REPLAY.md` with a minimal event log prototype.
- [ ] Add a bundle/import boundary check in CI to prevent Node-only APIs in browser bundle graph.

## Items Considered Legacy (Not Copied Here)

- Step-by-step project bootstrap notes from `docs/plan/step_01..14` that refer to old paths (`src/Pipeline/*`).
- 2025 readiness snapshots that describe outdated file-persistence onboarding flow.
