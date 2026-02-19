# Quick Start

This quick start is aligned with the current integrated workflow in `claps_codelab`.

## 1) Validate Module Health

```bash
cd /home/jp/CotizadorLodge/claps_codelab_database/packages/database && npm test
cd /home/jp/CotizadorLodge/claps_codelab_pricing && npm test
cd /home/jp/CotizadorLodge/claps_codelab_xstate && npm test
cd /home/jp/CotizadorLodge/claps_codelab_frontend && npm test
```

## 2) Validate Integrated Runtime

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run test:integration
npm run build
```

## 3) Understand the Active Integration Surface

- Runtime exports: `claps_codelab/bundling/entry.js`
- Actor bootstrap: `claps_codelab/bundling/createCotizadorActor.js`
- GAS wrapper files: `claps_codelab/gas/`

## 4) Current Direction

- Keep `claps_codelab` as source of truth.
- Rebuild sibling worktrees from `claps_codelab/packages/*` when needed.
- Preserve existing branch history and useful tests/mocks from each worktree.

## 5) Next Document to Read

- `WORKTREE_CLOSURE_KEEP_PLAN.md` for what to preserve before closing/archiving worktrees.
