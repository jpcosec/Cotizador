# Phase 03 - GAS Integration and Spreadsheet Validation

## Context

This phase validates real deployment behavior end-to-end.

## Objectives

- [ ] Build and push GAS project.
- [ ] Execute save -> load round-trip on real spreadsheet.
- [ ] Verify transactional rows in `COTIZACIONES` and `LINEA_DETALLE`.
- [ ] Document operational caveats (locks, retries, partial failures).

## Acceptance

- Real GAS web app persists and reloads quotation data correctly.
- Local preview and real GAS are contract-compatible.

## Commit

`test: verify GAS save/load round-trip on real sheets`
