---
id: U-2
name: Editor Basic
domain: quotation
status: pending
priority: p1
depends_on: []
pills:
  - pill-editor-gesture-matrix
  - pill-legacy-editor-semantics
commit_messages:
  - docs(plan): define U-2 gesture matrix and baseline
  - feat: add timeline layer for catalog drop
  - feat: add move and resize interactions with regression coverage
---

# U-2: Editor Basic

## Goal

Finish usable editor baseline fast:
1. Preserve existing list/time semantics from legacy + rebuild
2. Add basic drag interactions (ship/move/resize) from timeline draft

This track is UI/orchestration only. Runtime contracts already exist.

## Legacy + Draft Baseline

- Legacy editor: `claps_codelab/Components_Timeline.html`
- Legacy app flow: `claps_codelab/Stores_App.html`
- Drag/timeline draft: `plan/legacy/I-3-category/html_playground_draft.html`

## Key Constraints

- Do not add new machine states as first move
- Do not break current accordion/list workflow
- Keep drag as progressive enhancement
- Keep pack/group behavior out of MVP scope

---

## Phase 01: Gesture Matrix

**Commit:** `docs(plan): define U-2 gesture matrix and baseline`

### Objectives

- [ ] Produce gesture event matrix
- [ ] Tag each interaction: `existing`, `to-add`, `deferred`
- [ ] Validate non-deferred interactions map to runtime events
- [ ] Mark group/kit interactions as deferred

### Acceptance

- Matrix reviewed and complete
- No interaction left without event mapping or deferral note

### Status: ⏳ Pending

---

## Phase 02: Timeline Grid

**Commit:** `feat: add timeline layer for catalog drop`

### Objectives

- [ ] Timeline UI layer over current editor
- [ ] Catalog drop behavior defined
- [ ] Entry drop zone behavior
- [ ] Regression checks for existing editor behavior

### Status: ⏳ Pending

---

## Phase 03: Move and Resize

**Commit:** `feat: add move and resize interactions with regression coverage`

### Objectives

- [ ] Entry move behavior
- [ ] Entry resize behavior
- [ ] Regression gates for existing editor behavior
- [ ] E2E cases for drag regression

### Status: ⏳ Pending
