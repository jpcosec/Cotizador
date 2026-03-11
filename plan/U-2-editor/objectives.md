# U-2 Editor Basic Drag & Drop — Objectives

## Goal

Add timeline-grade drag interactions to the basket editor: drag catalog items onto a time grid, move existing entries to change their start hour, and resize entries to change their duration. All gestures map to existing runtime events — no new machine logic needed.

---

## What this step produces

| Artifact | Location |
|---|---|
| Gesture-to-event mapping matrix | `plan/U-2-editor/gesture_event_matrix.md` |
| Timeline grid component (Alpine template) | integrated into `QuotationFlowInternal.html` basket section |
| Drag/move/resize handlers | `bundling/createQuotationFlowComponent.js` + sandbox mount |
| E2E tests for drag interactions | `tests/e2e/editor-drag.spec.js` |

---

## Completion Criteria

### Drag from catalog to timeline
- [ ] Dragging a catalog item onto the timeline grid drops it at the target hour
- [ ] Drop fires `SHIP_ITEM_TO_DAY` + `SET_ENTRY_OVERRIDE('hora', targetHour)`
- [ ] Visual feedback during drag (drop zone highlight, drag ghost)

### Move existing entry
- [ ] Dragging an existing basket entry vertically on the grid changes its start hour
- [ ] Drop fires `SET_ENTRY_OVERRIDE('hora', newHour)`
- [ ] Entry snaps to hour grid (configurable: 30min or 60min slots)

### Resize entry duration
- [ ] Dragging the bottom edge of an entry changes its duration
- [ ] Release fires `SET_ENTRY_OVERRIDE('duracionMin', newDuration)`
- [ ] Minimum duration: 30 minutes
- [ ] Visual resize handle visible on hover

### Drop on day tab
- [ ] Existing behavior preserved: dropping a catalog item on a day tab ships to that day
- [ ] Already implemented — verify no regression

### Feature-flagged: group drop zone
- [ ] Child drop zone from `html_playground_draft.html` is NOT implemented
- [ ] Placeholder comment marks where it will go when kit/group runtime exists (U-future)

---

## Testing Criteria

**Automated:**
```bash
npm test
npm run test:e2e
```

**Manual (GAS preview):**
- [ ] Drag item from catalog sidebar onto hour slot in timeline → entry appears at that hour
- [ ] Drag existing entry to different hour → hour updates in basket and validation
- [ ] Resize entry bottom edge → duration updates
- [ ] All non-drag interactions still work (click to ship, accordion expand, overrides)

---

## Key Constraints

- All drag gestures map to existing runtime events — no new machine states or transitions
- Timeline grid is a presentation overlay — basket list (accordion) remains as the data authority
- Drag interactions degrade gracefully on touch/mobile (touch support is nice-to-have, not required)
- Do not implement pack/group/kit drop zones — just mark with comments for future
- Hour grid resolution: 30-minute slots (default), configurable

---

## What already exists

| Artifact | Status | Location |
|---|---|---|
| Catalog drag start/end/drop | ✅ Complete | `bundling/createQuotationFlowComponent.js:135-172` |
| `SHIP_ITEM_TO_DAY` event | ✅ Complete | `packages/components/basket/machine/basketMachine.js:222` |
| `SET_ENTRY_OVERRIDE` event | ✅ Complete | `packages/components/basket/machine/basketMachine.js:246` |
| `hora` override support | ✅ Complete | `packages/components/item/ui/playgroundItemSections.js:70` |
| `duracionMin` override support | ✅ Complete | `packages/components/item/ui/playgroundItemSections.js:118` |
| Timeline draft with all gestures | ✅ Draft | `plan/legacy/I-3-category/html_playground_draft.html` |
| Day tab drop | ✅ Complete | `apps/quotation/playground/QuotationFlowInternal.html:117` |
