# Cotizador Lodge Ecosystem Overview

## Current Reality

The active integrated stack lives in `claps_codelab`. It already composes database, pricing, xstate, and frontend into a bundleable runtime for local/GAS use.

Sibling worktrees (`claps_codelab_database`, `claps_codelab_pricing`, `claps_codelab_xstate`, `claps_codelab_frontend`) remain valuable for tests, mocks, and history, but much of their documentation is legacy-oriented.

## Active Architecture (Now)

1. UI bridge and actor bootstrap from integrated packages.
2. XState machine orchestrates workflow and persistence access.
3. Pricing module handles deterministic pricing/rules.
4. Database module provides adapter-based model access.
5. Build pipeline emits bundle + GAS runtime include.

Key integration files:

- `claps_codelab/bundling/entry.js`
- `claps_codelab/bundling/createCotizadorActor.js`
- `claps_codelab/package.json`
- `claps_codelab/rollup.config.mjs`

## What Is Legacy vs Current

- Current source of truth: `claps_codelab/packages/*` and `claps_codelab/bundling/*`.
- Legacy candidates: sibling worktree layouts and old long-form planning docs.
- Keep legacy branch history; do not delete branch data.

## Test Snapshot (Local)

- Database worktree tests passing.
- Pricing worktree tests passing (includes historical data smoke test).
- XState worktree tests passing.
- Frontend worktree tests passing.
- Integrated stack tests passing in `claps_codelab`.

## Recommended Consolidation Direction

- Rebuild module worktrees from the integrated package state when needed.
- Preserve and migrate high-value tests/mocks into rebuilt module branches.
- Treat `claps_codelab` as canonical for runtime behavior and deployment.

## Related Docs

- `WORKTREE_STATUS.md`
- `WORKTREE_CLOSURE_KEEP_PLAN.md`
- `WORKTREE_REBUILD_GAP_AUDIT.md`
- `current_state.md`
