---
id: R-04-2
name: "[Logic] Implement Modals Controller"
domain: quotation
status: open
priority: p1
depends_on: [R-04-1]
pills:
  - pill-naming-conventions
---

## Goal
Extract Modal logic (Client selection, Quotation search) into a modular controller.

## Context
- Source: `apps/quotation/playground/mountQuotationFlow.js` (Modal and search-related methods)
- Target: `packages/components/quotation/views/Modals.js`

## Requirements
1. Inherit from `UIContainerBase`.
2. Map methods: `openQuotationSearchModal`, `closeQuotationSearchModal`, `setQuotationSearch`, `filteredQuotations`, `selectQuotationResult`, `setClientSearch`, `filteredClients`, `selectClient`.

## Validation
- `Modals.js` exports `ModalsController`.
- Unit tests pass.
