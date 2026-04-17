---
id: R-04
name: Extract Modals Component
domain: quotation
status: open
priority: p1
depends_on: []
pills:
  - pill-modular-composition
  - pill-actor-bridge-pattern
---

## Goal
Extract the Client Selection and Quotation Search modals into a dedicated package.

## What This Produces
| Artifact | Location |
|----------|----------|
| Modals Template | `packages/components/quotation/ui/Modals.html` |
| Modals Logic | `packages/components/quotation/views/Modals.js` |

## Phase 01: UI Extraction
- [ ] Move the `modal-overlay` blocks for Client and Search from `apps/gas/Quotation_App_Source.html` to `packages/components/quotation/ui/Modals.html`.

## Phase 02: Logic Extraction
- [ ] Create `packages/components/quotation/views/Modals.js`.
- [ ] Manage modal visibility state and search term logic, bridging back to the `runtime` for actual selection.

## Phase 03: Integration
- [ ] Update `reset_gas_workspace.mjs` to include the new Modals template.
- [ ] Replace the Modal blocks in the orchestrator with an `include`.
