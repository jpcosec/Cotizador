# U-2 Editor Basic - Objectives

## Goal

Finish a usable editor baseline fast:

1. preserve existing list/time semantics already present in legacy and rebuild,
2. add basic drag interactions (ship/move/resize) from the timeline draft.

This track is UI/orchestration only. Runtime contracts already exist.

---

## Legacy + Draft Baseline

- Legacy editor semantics: `claps_codelab/Components_Timeline.html`
- Legacy app flow wiring: `claps_codelab/Stores_App.html`
- Drag/timeline draft source: `plan/legacy/I-3-category/html_playground_draft.html`

---

## What this step produces

| Artifact | Location |
|---|---|
| Gesture-to-event matrix | `plan/U-2-editor/gesture_event_matrix.md` |
| Phase specs for timeline rollout | `plan/U-2-editor/phases/*.md` |
| Timeline UI integration plan | `apps/quotation/playground/QuotationFlowInternal.html` (implementation target) |
| Runtime event mapping plan | `bundling/createQuotationFlowComponent.js` (implementation target) |

---

## Completion Criteria

- [ ] Existing list editor behavior remains intact (hour input, overrides, remove/duplicate/copy).
- [ ] Gesture matrix is complete and mapped to existing events only.
- [ ] Catalog -> timeline drop behavior defined.
- [ ] Entry move and resize behavior defined.
- [ ] Group/kit drop zone explicitly deferred until kit runtime is ready.
- [ ] E2E cases defined for drag regression.

---

## Constraints

- Do not add new machine states as first move.
- Do not break current accordion/list workflow.
- Keep drag as progressive enhancement over existing editor.
- Keep pack/group behavior out of MVP scope for this urgent track.
