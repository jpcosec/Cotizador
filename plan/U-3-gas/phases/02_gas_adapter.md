# Phase 02 - Gas Adapter and Local Shim Parity

## Context

Server functions are available. This phase connects runtime to GAS through `PersistencePort`.

## Objectives

- [ ] Implement `GasSheetAdapter` as `PersistencePort` implementation.
- [ ] Normalize GAS response shape to boundary contract.
- [ ] Extend `Local_GAS_Shim.html` to mimic save/load contract.
- [ ] Add adapter tests with mocked `google.script.run`.

## Acceptance

- Runtime can switch adapters without code changes.
- Local preview behaves like GAS from runtime perspective.
- Error handling and success mapping are deterministic.

## Commit

`feat: implement GasSheetAdapter and local shim parity`
