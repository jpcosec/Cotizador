---
id: R-03-2
name: "[Logic] Implement Item List Controller"
domain: quotation
status: open
priority: p1
depends_on: [R-03-1]
pills:
  - pill-naming-conventions
---

## Goal
Extract Item List (Basket) logic into a modular controller.

## Context
- Source: `apps/quotation/playground/mountQuotationFlow.js` (Basket-related methods)
- Target: `packages/components/quotation/views/ItemList.js`

## Requirements
1. Inherit from `UIContainerBase`.
2. Map methods: `setBasketOverride`, `clearBasketOverride`, `resetBasketOverrides`, `destroyRuntimeEntry`, `duplicateBasketEntry`, `copyBasketEntry`.
3. Ensure `toDisplayObject()` provides the basket state.

## Validation
- `ItemList.js` exports `ItemListController`.
- Unit tests pass.
