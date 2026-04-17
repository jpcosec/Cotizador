---
id: R-02
name: Extract Timeline Component
domain: quotation
status: open
priority: p1
depends_on: []
pills:
  - pill-timeline-component-boundary
---

## Goal
Extract the Timeline Grid and interactions from the main orchestrator into its own modular package.

## What This Produces
| Artifact | Location |
|----------|----------|
| Timeline Template | `packages/components/quotation/ui/Timeline.html` |
| Timeline Logic | `packages/components/quotation/views/Timeline.js` |

## Phase 01: UI Extraction
- [ ] Move the `timeline-scroll-container` and `tl-grid` HTML blocks to `packages/components/quotation/ui/Timeline.html`.
- [ ] Preserve all drag-and-drop and resize bindings.

## Phase 02: Logic Extraction
- [ ] Extract `blockStyle`, `minuteToY`, `yToStartMin`, `doResize`, and `onGridDrop` logic into `packages/components/quotation/views/Timeline.js`.

## Phase 03: Integration
- [ ] Update `reset_gas_workspace.mjs` to include the new Timeline template.
- [ ] Replace the Timeline block in the orchestrator with an `include`.

## Validation
- [ ] Run `npm run build`.
- [ ] Verify Timeline is functional in the bundled app.
