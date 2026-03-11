# U-4 PDF Export - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_pdf_template.md` - HTML template for PDF rendering
2. `02_gas_server_pdf.md` - GAS server function and Drive integration
3. `03_ui_wiring.md` - runtime command, UI buttons, local shim, bundle

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- PDF generation is server-side only (GAS `HtmlService` + `DriveApp`).
- Template uses inline CSS (no external stylesheets in GAS).
- Quotation must be saved before PDF can be generated.
- Local shim provides a mock URL for development.
- All existing tests must remain green after every phase.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Objectives checklist in that phase document is complete.
2. Automated test suite passes for touched scope.
3. Manual verification passes for phase behavior.
4. Commit created with the exact phase commit message.

## Commit Sequence

1. `feat: add PDF template for quotation export`
2. `feat: add generateQuotationPdf GAS server function`
3. `feat: wire exportPdf command into quotation runtime`
4. `feat: add PDF export buttons to quotation UI`
5. `feat: extend Local_GAS_Shim with PDF mock`
6. `test: verify PDF export end-to-end`
