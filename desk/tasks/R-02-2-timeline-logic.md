---
id: R-02-2
name: "[Logic] Implement Timeline Controller"
domain: quotation
status: open
priority: p1
depends_on: [R-02-1]
pills:
  - pill-naming-conventions
---

## Goal
Extract the Timeline logic into a modular controller.

## Context
- Source: `apps/quotation/playground/mountQuotationFlow.js` (The large `x-data` object in the main section)
- Target: `packages/components/quotation/views/Timeline.js`

## Requirements
1. Inherit from `UIContainerBase`.
2. Move constants (`HOUR_H`, `N_HOURS`, `START_H`) and helper methods (`yToStartMin`, `minuteToY`, `fmtMin`, `blockStyle`) to the controller.
3. Handle event handlers: `onGridDragOver`, `onGridDrop`, `startMovePlaced`, `startResize`, `doResize`, `endResize`.

## Validation
- `Timeline.js` exports `TimelineController`.
- Unit tests pass.
