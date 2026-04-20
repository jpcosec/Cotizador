---
id: R-03-1
name: "[UI] Extract Item List Template"
domain: quotation
status: completed
priority: p1
depends_on: []
pills:
  - pill-modular-composition
---

## Goal
Extract the Item List (Basket Details) UI.

## Context
- Source: `gas/scripts/createQuotationFlowComponent.js` (Lines 211-220)
- Target: `src/components/quotation/ui/ItemList.html`

## Requirements
1. Extract the `<section class="basket-list">` block.
2. Note that this section heavily uses `<!-- BASKET_RUNTIME -->` which is a placeholder for dynamically injected item components.

## Validation
- File `src/components/quotation/ui/ItemList.html` created.
