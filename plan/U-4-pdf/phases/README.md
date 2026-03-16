# U-4 PDF Export - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_pdf_template.md` - choose parity strategy from legacy PDF flow
2. `02_gas_server_pdf.md` - implement server-side PDF endpoint
3. `03_ui_wiring.md` - wire save-first PDF flow in runtime/UI and validate

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- Legacy save-first behavior is mandatory baseline.
- PDF generation remains server-side.
- Local preview and real GAS share behavior contract.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Legacy baseline references are captured.
2. Phase checklist is complete.
3. Manual and automated checks pass for touched scope.

## Commit Sequence

1. `docs(plan): define U-4 PDF parity strategy`
2. `feat: implement GAS PDF server flow`
3. `feat: wire save-first PDF flow in rebuild UI`
