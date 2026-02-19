# Docs Consolidation Proposal

## Goal

Reduce documentation sprawl in `claps_codelab/docs`, keep only operationally useful docs in the main path, and move historical/planning-only material to a clear legacy area.

## Current Problems

- Mixed timeline: docs from 2025 and 2026 are side by side without lifecycle tags.
- Duplicate intent: multiple files explain overlapping architecture/testing concepts.
- Legacy planning still lives in active paths (`docs/plan/*`).
- Workspace migration docs are now centralized, but not clearly separated from product/module docs.

## Proposed Target Structure

```text
docs/
  README.md
  ACTIVE/
    architecture.md
    pricing.md
    xstate.md
    frontend-integration.md
    testing.md
    deployment-gas.md
  TODO_ACTIVE_NON_LEGACY.md
  future/
    EVENT_SOURCING_AND_REPLAY.md
  legacy/
    plan/
      step_01.md ... step_14.md
    ui-readiness-2025/
      SYSTEM_READY_FOR_UI.md
      QUICKSTART_CREATING_QUOTATIONS.md
      TESTING_SUMMARY.md
  workspace/
    (existing moved root docs)
```

## Consolidation Rules

- Keep in active path only docs that match current integrated runtime (`packages/*`, `bundling/*`, `gas/*`).
- Mark every non-active doc as `legacy` or `future`.
- Prefer one canonical doc per topic.
- Cross-link from `docs/README.md`; avoid orphan docs.

## File-by-File Recommendation

### Keep Active (with refresh)

- `pricing-engine.md` -> merge into `ACTIVE/pricing.md`
- `pipeline.md` -> merge into `ACTIVE/pricing.md` (technical subsection)
- `xstate-machine-design.md` -> merge into `ACTIVE/xstate.md`
- `PHASE3_ISSUES_AND_BLOCKERS.md` -> merge into `ACTIVE/frontend-integration.md`
- `workspace/*` -> keep as-is (already centralized)

### Keep Future

- `future/EVENT_SOURCING_AND_REPLAY.md` (still valid as roadmap)

### Move to Legacy

- `plan/step_01.md` ... `plan/step_14.md` (historical implementation sequence)
- `SYSTEM_READY_FOR_UI.md` (dated snapshot, file-persistence framing)
- `QUICKSTART_CREATING_QUOTATIONS.md` (contains old setup flow and generated examples)
- `TESTING_SUMMARY.md` (historical phase framing)

## Minimal Consolidated Doc Set (After Cleanup)

- `docs/README.md`
- `docs/ACTIVE/architecture.md`
- `docs/ACTIVE/pricing.md`
- `docs/ACTIVE/xstate.md`
- `docs/ACTIVE/frontend-integration.md`
- `docs/ACTIVE/testing.md`
- `docs/ACTIVE/deployment-gas.md`
- `docs/TODO_ACTIVE_NON_LEGACY.md`
- `docs/future/EVENT_SOURCING_AND_REPLAY.md`
- `docs/workspace/*`
- `docs/legacy/*`

## Execution Plan

1. Create `docs/ACTIVE/` and `docs/legacy/`.
2. Move `docs/plan/*` to `docs/legacy/plan/`.
3. Move dated 2025 snapshots to `docs/legacy/ui-readiness-2025/`.
4. Merge active content into 5-6 canonical docs under `docs/ACTIVE/`.
5. Update `docs/README.md` with lifecycle labels: `active`, `future`, `legacy`, `workspace`.
6. Keep `TODO_ACTIVE_NON_LEGACY.md` as the only task tracker for documentation-driven implementation gaps.

## Success Criteria

- Any engineer can find the current architecture and current TODOs in under 2 minutes.
- No active doc references removed files/paths.
- Legacy docs remain available but clearly out of the active reading path.
