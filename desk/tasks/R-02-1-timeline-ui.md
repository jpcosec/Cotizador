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
- Source: `gas/scripts/createQuotationFlowComponent.js` (Lines 111-209)
- Target: `src/components/quotation/ui/Timeline.html`

## Requirements
1. Extract the `<main class="main panel">` block (excluding the sidebar).
2. Ensure all `x-data`, `x-init`, and `x-for` bindings for the timeline grid are preserved.
3. Preserve the Day Tabs and Timeline Controls sections.

## Validation
- File `src/components/quotation/ui/Timeline.html` created.
- Structure matches the original block.
