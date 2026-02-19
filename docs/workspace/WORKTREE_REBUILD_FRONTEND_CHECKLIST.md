# Frontend Rebuild Execution Checklist

This checklist rebuilds `claps_codelab_frontend` from `claps_codelab/packages/frontend` while preserving bridge behavior, tests, and environment notes.

## Objective

- Align frontend module with integrated canonical package.
- Preserve legacy frontend branch history.
- Keep Alpine/XState bridge test confidence and local/GAS compatibility notes.

## Current Baseline (Verified)

- Branch: `feature/frontend`.
- Notable differences (excluding docs/node_modules):
  - `package.json` (and lockfile only present in integrated package)
  - `src/Local/createCotizadorActor.local.js`
  - `vitest.config.js` present in integrated package only
  - legacy-only assets (`integration_concerns.md`, `local/`, `schema_viewer.html`, `src/bundle/`, `test-results.txt`)

## Step 0 - Preflight

```bash
cd /home/jp/CotizadorLodge/claps_codelab_frontend && npm test
cd /home/jp/CotizadorLodge/claps_codelab/packages/frontend && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

## Step 1 - Preserve Legacy Branch State

```bash
git status
git add -A
git commit -m "docs: freeze pre-rebuild frontend worktree state"  # only if needed
git tag "archive/frontend-before-rebuild-YYYYMMDD"
```

Optional remote backup:

```bash
git push origin feature/frontend
git push origin "archive/frontend-before-rebuild-YYYYMMDD"
```

## Step 2 - Create Rebuild Branch

```bash
git checkout -b rebuild/frontend-from-v2
```

## Step 3 - Sync Canonical Package Source

```bash
rsync -av --delete \
  --exclude=node_modules \
  /home/jp/CotizadorLodge/claps_codelab/packages/frontend/ \
  /home/jp/CotizadorLodge/claps_codelab_frontend/
```

## Step 4 - Re-Apply Keep Items Explicitly

Must keep:
- `AlpineXStateBridge` behavior and tests.
- Local actor bootstrap tests and helpers.
- Documentation of GAS-template vs localhost behavior differences.

Decision item:
- Keep `integration_concerns.md` as archived reference or condense into rebuilt README/docs.

## Step 5 - Resolve Known Integration Risks

Prioritize:
- Remove fragile deep import paths into nested `node_modules`.
- Complete machine-native quotation load flow to avoid fallback-only behavior.
- Keep one consistent local runner path that mirrors integrated bundle expectations.

## Step 6 - Parity Validation

```bash
cd /home/jp/CotizadorLodge/claps_codelab_frontend && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

Acceptance:
- Rebuilt frontend tests pass.
- Integrated tests pass.
- Bridge/local actor behavior remains stable.

## Step 7 - Document and Commit

Update:
- `claps_codelab_frontend/README.md`
- `claps_codelab_frontend/changelog.md`

## Rollback Plan

```bash
git checkout feature/frontend
git checkout -b recovery/frontend-from-archive "archive/frontend-before-rebuild-YYYYMMDD"
```

## Done Definition

Frontend rebuild is complete when bridge/local behavior is preserved, fragile import/layout drift is removed, and module + integration tests pass.
