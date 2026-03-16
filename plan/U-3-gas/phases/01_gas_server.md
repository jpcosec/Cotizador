# Phase 01 - GAS Server Contract from Legacy

## Context

Legacy already defines save/load server semantics. This phase ports that behavior to rebuild-generated GAS code.

## Objectives

- [ ] Extract legacy function contract (`guardarCotizacion`, `cargarCotizacion`).
- [ ] Define rebuild GAS contract (including compatibility aliases if required).
- [ ] Implement server-side save/load functions in generated GAS code.
- [ ] Keep server-side layering readable (router/facade + service helpers).

## Acceptance

- Functions are callable from `google.script.run`.
- Save and load work against transactional sheets.
- Contract deviations from legacy are explicitly documented.

## Commit

`docs(plan): define U-3 GAS server contract from legacy`
