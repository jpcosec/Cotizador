# Worktree Status (Consolidation-Oriented)

## Summary

- Canonical integrated workspace: `claps_codelab`.
- Sibling module worktrees were closed and removed from local checkout.
- Branches and archive tags preserve their data/history for future rebuild.

## Per-Worktree Status

| Worktree | Primary Role | Current Condition | Legacy Risk | Keep For |
|---|---|---|---|---|
| `claps_codelab` | Integration + bundling + GAS surface | Active | Low | Source of truth |
| `feature/database` | Persistence module branch | Closed (archived, no local worktree) | Medium | Adapter tests, seed flows |
| `feature/pricing-logic` | Pricing/rules engine branch | Closed (archived, no local worktree) | Medium | Extensive pricing tests/mocks |
| `feature/xstate-machine-design` | Orchestration branch | Closed (archived, no local worktree) | Medium | Machine tests, adapter patterns |
| `feature/frontend` | Frontend bridge branch | Closed (archived, no local worktree) | Medium/High | Bridge tests and local harnesses |

## Structural Differences to Track

- `claps_codelab` uses `packages/*` composition and has `bundling/`, `dist/`, and `gas/`.
- Sibling worktrees keep layer-specific file structures and scripts.
- Import paths in some frontend/integration helpers are deep and workspace-specific; they should be normalized during rebuild.

## Known Active TODO Areas

- Machine-level load flow completion (`LOAD_QUOTATION`).
- Replace deep `node_modules` imports with stable package exports.
- Finish remaining xstate adapter stubs (`updateRow`, `addNewRow`, send service behavior).
- Align GAS final UI composition with integrated runtime bundle.

## Consolidation Rule

Before closing/archiving any module worktree, follow `WORKTREE_CLOSURE_KEEP_PLAN.md` and ensure data/history persists on each worktree branch.

First execution artifact available: `WORKTREE_REBUILD_DATABASE_CHECKLIST.md`.
