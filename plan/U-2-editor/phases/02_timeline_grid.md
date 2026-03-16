# Phase 02 - Timeline Layer and Catalog Drop

## Context

This phase adds a timeline view on top of the existing editor without removing list/accordion behavior.

## Objectives

- [ ] Add timeline rendering layer for current selected day.
- [ ] Keep list editor as fallback/parallel view.
- [ ] Implement catalog -> timeline drop mapped to existing ship + override events.
- [ ] Keep day-tab drop behavior unchanged.

## Acceptance

- Catalog drop places entries at expected hour/day.
- Existing non-drag operations still work.
- No regressions in validation projection after drop.

## Commit

`feat: add timeline layer for catalog drop`
