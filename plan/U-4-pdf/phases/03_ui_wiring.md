# Phase 03 - Save-First PDF UI Wiring

## Context

Server endpoint exists. This phase wires runtime and UI to execute save-first PDF flow.

## Objectives

- [ ] Add/confirm runtime `exportPdf` command.
- [ ] Wire UI action sequence: save -> generate PDF -> open URL.
- [ ] Extend local shim for deterministic PDF mock responses.
- [ ] Validate flow in local preview and real GAS.

## Acceptance

- PDF flow works from current quotation UI.
- Save-first dependency is enforced.
- Local preview behavior matches contract.

## Commit

`feat: wire save-first PDF flow in rebuild UI`
