---
id: R-01-3
name: "[Integration] Sidebar Modularization"
domain: quotation
status: open
priority: p1
depends_on: [R-01-1, R-01-2]
pills:
  - pill-modular-composition
  - pill-build-markers-contract
---

## Goal
Replace the hardcoded Sidebar in the orchestrators with the modular component.

## Context
- App Orchestrator (GAS): `apps/gas/Quotation_App_Source.html`
- Playground Orchestrator: `apps/quotation/playground/QuotationFlowInternal.html`

## Requirements
1. Update `apps/quotation/playground/mountQuotationFlow.js` to use `createSidebar` and mount it.
2. Replace the `<aside class="sidebar">` block in both HTML files with a marker or the component include.
3. Ensure the `SidebarController` is correctly initialized with the runtime.

## Validation
- `npm run build` succeeds.
- Sidebar renders and is functional in `/step-04-quotation` sandbox.
