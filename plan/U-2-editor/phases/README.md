# U-2 Editor Basic Drag & Drop - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_gesture_matrix.md` - document gesture-to-event mapping from draft HTML
2. `02_timeline_grid.md` - build grid layout and catalog drop
3. `03_move_and_resize.md` - wire entry re-drag and resize interactions

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- All gestures map to existing runtime events. No new machine logic.
- Timeline grid is a presentation overlay. Accordion view remains as alternate.
- Do not implement kit/group/pack drop zones.
- Preserve all existing drag-to-day-tab behavior.
- All existing tests must remain green after every phase.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Objectives checklist in that phase document is complete.
2. Automated test suite passes for touched scope.
3. Manual verification passes for phase behavior.
4. Commit created with the exact phase commit message.

## Commit Sequence

1. `docs: add editor gesture-to-event mapping matrix`
2. `feat: add timeline grid layout to basket editor`
3. `feat: wire catalog-to-timeline-grid drop`
4. `feat: wire entry move-to-hour on timeline grid`
5. `feat: wire entry duration resize on timeline grid`
6. `feat: add timeline drag interactions to GAS bundle`
7. `test: add E2E tests for editor drag interactions`
