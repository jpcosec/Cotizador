# U-2 Editor Basic - Phase Index

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_gesture_matrix.md` - legacy/draft interaction inventory and event mapping
2. `02_timeline_grid.md` - timeline layer over current editor (catalog drop included)
3. `03_move_and_resize.md` - move/resize interactions and regression gates

## Current Status

- Phase 01: pending
- Phase 02: pending
- Phase 03: pending

## Shared Constraints

- Keep legacy editor semantics from `claps_codelab/Components_Timeline.html`.
- Map gestures to existing runtime events first.
- Keep list editor available while timeline is introduced.
- Group/kit drag is out of scope for this urgent track.

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. Phase checklist is complete.
2. Regression checks for existing editor behavior pass.
3. Automated tests for touched scope pass.

## Commit Sequence

1. `docs(plan): define U-2 gesture matrix and baseline`
2. `feat: add timeline layer for catalog drop`
3. `feat: add move and resize interactions with regression coverage`
