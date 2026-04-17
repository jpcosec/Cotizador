---
id: R-03
name: Extract Item List Component
domain: quotation
status: open
priority: p1
depends_on: []
pills:
  - pill-modular-composition
  - pill-actor-bridge-pattern
---

## Goal
Extract the "Item Details & Overrides" list into a standalone modular component.

## What This Produces
| Artifact | Location |
|----------|----------|
| Item List Template | `packages/components/quotation/ui/ItemList.html` |
| Item List Logic | `packages/components/quotation/views/ItemList.js` |

## Phase 01: UI Extraction
- [ ] Move the `basket-list` HTML block from `apps/gas/Quotation_App_Source.html` to `packages/components/quotation/ui/ItemList.html`.
- [ ] Ensure `<!-- BASKET_RUNTIME -->` marker is preserved for build-time injection.
- [ ] Ensure anchor IDs (`entry-{{id}}`) are correctly bound.

## Phase 02: Logic Extraction
- [ ] Create `packages/components/quotation/views/ItemList.js` inheriting from `UIContainerBase`.
- [ ] Expose `basketEntries` projection and override methods (`setItemComment`, `setItemTime`, etc.) via the runtime bridge.

## Phase 03: Integration
- [ ] Update `reset_gas_workspace.mjs` to include the new ItemList template.
- [ ] Replace the Item List block in the orchestrator with an `include`.
