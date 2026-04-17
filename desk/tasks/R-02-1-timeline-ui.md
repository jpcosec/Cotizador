---
id: R-02-1
name: "[UI] Extract Timeline Template"
domain: quotation
status: completed
priority: p1
depends_on: []
pills:
  - pill-modular-composition
  - pill-timeline-component-boundary
---

## Goal
Extract the Timeline UI from the monolithic orchestrator.

## Context
- Source: `apps/gas/Quotation_App_Source.html` (Lines 111-209)
- Target: `packages/components/quotation/ui/Timeline.html`

## Requirements
1. Extract the `<main class="main panel">` block (excluding the sidebar).
2. Ensure all `x-data`, `x-init`, and `x-for` bindings for the timeline grid are preserved.
3. Preserve the Day Tabs and Timeline Controls sections.

## Validation
- File `packages/components/quotation/ui/Timeline.html` created.
- Structure matches the original block.
