---
id: R-02-3
name: "[Integration] Timeline Modularization"
domain: quotation
status: open
priority: p1
depends_on: [R-02-1, R-02-2]
pills:
  - pill-modular-composition
---

## Goal
Replace the hardcoded Timeline in the orchestrators with the modular component.

## Context
- App Orchestrator (GAS): `apps/gas/Quotation_App_Source.html`

## Requirements
1. Replace the `<div class="timeline">` block with a marker or include.
2. Update the orchestrator to initialize the `TimelineController`.

## Validation
- `npm run build` succeeds.
- Timeline is functional.
