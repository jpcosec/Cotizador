---
id: V-06
name: Excel Export
domain: quotation
status: open
priority: p2
depends_on: [U-1]
pills:
  - pill-excel-export-strategy
commit_messages:
  - feat: implement Excel export logic
  - test: verify Excel export in user_flow
---

# V-06: Excel Export

## Goal
Export quotation data with calculations to an Excel file.

## What This Produces
| Artifact | Location |
|----------|----------|
| Service update | `apps/quotation/services/exportService.js` |
| UI Component | `apps/quotation/playground/QuotationFlowInternal.html` |
| E2E Step | `user_flow.json` |

## Phase 01: Core Logic
- [ ] Implement CSV/Excel generation logic for quotation data.

## Phase 02: UI Wiring
- [ ] Add "Export to Excel" button to the UI.

## Phase 03: Validation
- [ ] Add `export_to_excel` step to `user_flow.json`.
- [ ] Run `userFlowRunner.mjs`.
