# Worktree Rebuild Execution Plan

This is the operational sequence to rebuild sibling worktrees from `claps_codelab` while preserving branch history and test value.

## Sequence

1. Database (`claps_codelab_database`)
2. Pricing (`claps_codelab_pricing`)
3. XState (`claps_codelab_xstate`)
4. Frontend (`claps_codelab_frontend`)
5. Final integrated regression in `claps_codelab`

## Phase Gates

Each phase must pass all gates before moving to the next:

- Archive tag created for legacy branch (`archive/<worktree>-before-rebuild-YYYYMMDD`).
- Rebuild branch created from preserved baseline.
- Canonical package sync from `claps_codelab/packages/<module>`.
- Module test suite passes in rebuilt branch.
- `claps_codelab` integration tests still pass.
- README/changelog updated to rebuilt status.

## Current Artifacts

- Keep/closure policy: `WORKTREE_CLOSURE_KEEP_PLAN.md`
- Gap assessment: `WORKTREE_REBUILD_GAP_AUDIT.md`
- Database execution checklist: `WORKTREE_REBUILD_DATABASE_CHECKLIST.md`
- Pricing execution checklist: `WORKTREE_REBUILD_PRICING_CHECKLIST.md`
- XState execution checklist: `WORKTREE_REBUILD_XSTATE_CHECKLIST.md`
- Frontend execution checklist: `WORKTREE_REBUILD_FRONTEND_CHECKLIST.md`

## Next Artifacts to Produce

- (none - all module checklists are now available)

## Final Cutover Criteria

Cutover is complete when all rebuilt module branches pass their tests and integrated regression passes with documentation aligned across root and module READMEs/changelogs.
