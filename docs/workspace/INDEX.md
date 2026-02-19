# Cotizador Lodge Documentation Index

This index reflects the current local state where `claps_codelab` is the integration source of truth and sibling worktrees are candidates for rebuild/archival.

## Start Here

- `README_ECOSYSTEM.md` - current architecture and consolidation direction.
- `QUICK_START.md` - shortest path to run tests/build locally.
- `WORKTREE_STATUS.md` - per-worktree status and legacy/rebuild assessment.
- `WORKTREE_CLOSURE_KEEP_PLAN.md` - what must be preserved before closing legacy worktrees.
- `WORKTREE_REBUILD_GAP_AUDIT.md` - concrete differences and migration focus by worktree.
- `WORKTREE_REBUILD_DATABASE_CHECKLIST.md` - first executable rebuild checklist (database module).
- `WORKTREE_REBUILD_EXECUTION_PLAN.md` - rebuild order, phase gates, and cutover criteria.
- `WORKTREE_REBUILD_PRICING_CHECKLIST.md` - pricing rebuild checklist with parity focus items.
- `WORKTREE_REBUILD_XSTATE_CHECKLIST.md` - xstate rebuild checklist with adapter hardening tasks.
- `WORKTREE_REBUILD_FRONTEND_CHECKLIST.md` - frontend rebuild checklist with bridge/local-GAS parity tasks.

## Current Source of Truth

- Integrated runtime and deployment: `claps_codelab/`.
- Main integration entrypoints:
  - `claps_codelab/bundling/entry.js`
  - `claps_codelab/bundling/createCotizadorActor.js`
- Build/deploy outputs:
  - `claps_codelab/dist/quotation-engine.iife.js`
  - `claps_codelab/gas/Bundle_Runtime.html`

## Worktrees (Current Role)

- Active local worktree: `claps_codelab/`.
- Closed module worktrees were removed from local checkout after archival.
- Module branch history remains available through archived branches and tags.

## Notes

- Removed stale references to missing architecture files in root docs.
- Historical/legacy design remains in each worktree `docs/legacy/` when needed for audit.
