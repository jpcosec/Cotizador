---
id: R-04-1
name: "[UI] Extract Modals Template"
domain: quotation
status: completed
priority: p1
depends_on: []
pills:
  - pill-modular-composition
---

## Goal
Extract Client Selection and Quotation Search modals.

## Context
- Source: `apps/gas/Quotation_App_Source.html` (Lines 264-320)
- Target: `packages/components/quotation/ui/Modals.html`

## Requirements
1. Extract the `modal-overlay` blocks.
2. Ensure `x-show` and `@click.away` bindings are preserved.

## Validation
- File `packages/components/quotation/ui/Modals.html` created.
