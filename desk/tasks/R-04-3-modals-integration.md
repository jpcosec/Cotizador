---
id: R-04-3
name: "[Integration] Modals Modularization"
domain: quotation
status: open
priority: p1
depends_on: [R-04-1, R-04-2]
pills:
  - pill-modular-composition
---

## Goal
Replace the hardcoded Modals in the orchestrators with modular components.

## Context
- App Orchestrator (GAS): `apps/gas/Quotation_App_Source.html`

## Requirements
1. Replace Client Selection and other modals with modular includes.
2. Update the orchestrator to initialize Modal controllers.

## Validation
- `npm run build` succeeds.
