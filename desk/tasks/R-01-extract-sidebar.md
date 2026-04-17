---
id: R-01
name: Extract Sidebar Component
domain: quotation
status: open
priority: p1
depends_on: []
pills:
  - pill-modular-composition
---

## Goal
Extract the Sidebar (Client info + Global Settings + Catalog) from the monolithic orchestrator into its own modular package.

## What This Produces
| Artifact | Location |
|----------|----------|
| Sidebar Template | `packages/components/quotation/ui/Sidebar.html` |
| Sidebar Logic | `packages/components/quotation/views/Sidebar.js` |

## Phase 01: UI Extraction
- [ ] Move the Sidebar HTML block from `apps/gas/Quotation_App_Source.html` to `packages/components/quotation/ui/Sidebar.html`.
- [ ] Ensure all Alpine.js bindings (x-text, x-model, @click) are preserved.

## Phase 02: Logic Extraction
- [ ] Create/Update `packages/components/quotation/views/Sidebar.js` to handle sidebar-specific events and state.

## Phase 03: Integration
- [ ] Update `reset_gas_workspace.mjs` to include the new Sidebar template.
- [ ] Replace the Sidebar block in `apps/gas/Quotation_App_Source.html` with an `include` or marker.

## Validation
- [ ] Run `npm run build`.
- [ ] Verify Sidebar renders correctly in the bundled app.
