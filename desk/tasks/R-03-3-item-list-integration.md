---
id: R-03-3
name: "[Integration] Item List Modularization"
domain: quotation
status: open
priority: p1
depends_on: [R-03-1, R-03-2]
pills:
  - pill-modular-composition
---

## Goal
Replace the hardcoded Item List in the orchestrators with the modular component.

## Context
- App Orchestrator (GAS): `gas/scripts/createQuotationFlowComponent.js`

## Requirements
1. Replace the Item List block with a marker or include.
2. Update the orchestrator to initialize the `ItemListController`.

## Validation
- `npm run build` succeeds.
