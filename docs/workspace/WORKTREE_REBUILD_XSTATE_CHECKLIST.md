# XState Rebuild Execution Checklist

This checklist rebuilds `claps_codelab_xstate` from `claps_codelab/packages/xstate` while preserving orchestration tests and branch history.

## Objective

- Align xstate module with integrated canonical package.
- Preserve legacy xstate branch and diagnostics value.
- Keep machine/adapter test confidence while closing known TODOs.

## Current Baseline (Verified)

- Branch: `feature/xstate-machine-design`.
- Notable differences (excluding docs/node_modules):
  - `package.json`, `package-lock.json`, `vitest.config.js`
  - `src/Orchestration/adapters/actions.js`
  - `src/QuotationService.js`
  - `tests/helpers/store_factory.js`
  - legacy-only assets (`.clasp.json`, `data/`, `scripts/`, `tools/`, `old/`, `schema_viewer.html`, `src/Config/`)

## Step 0 - Preflight

```bash
cd /home/jp/CotizadorLodge/claps_codelab_xstate && npm test
cd /home/jp/CotizadorLodge/claps_codelab/packages/xstate && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

## Step 1 - Preserve Legacy Branch State

```bash
git status
git add -A
git commit -m "docs: freeze pre-rebuild xstate worktree state"  # only if needed
git tag "archive/xstate-before-rebuild-YYYYMMDD"
```

Optional remote backup:

```bash
git push origin feature/xstate-machine-design
git push origin "archive/xstate-before-rebuild-YYYYMMDD"
```

## Step 2 - Create Rebuild Branch

```bash
git checkout -b rebuild/xstate-from-v2
```

## Step 3 - Sync Canonical Package Source

```bash
rsync -av --delete \
  --exclude=node_modules \
  /home/jp/CotizadorLodge/claps_codelab/packages/xstate/ \
  /home/jp/CotizadorLodge/claps_codelab_xstate/
```

## Step 4 - Re-Apply Keep Items Explicitly

Must keep:
- Guard/action/integration tests validating state transitions and parallel regions.
- Useful machine diagnostics scripts if still used (`inspect`, `example`) with normalized paths.
- Store factory helpers used by tests and local actor bootstrapping.

## Step 5 - Close Known TODOs

Prioritize:
- `actions.js`: implement `updateRow` write behavior.
- `actions.js`: implement `addNewRow` insert behavior.
- `services.js`: implement actual send service behavior.

## Step 6 - Parity Validation

```bash
cd /home/jp/CotizadorLodge/claps_codelab_xstate && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

Acceptance:
- Rebuilt xstate tests pass.
- Integrated tests pass.
- No regression in machine transitions for add/update/remove/validate flows.

## Step 7 - Document and Commit

Update:
- `claps_codelab_xstate/README.md`
- `claps_codelab_xstate/changelog.md`

## Rollback Plan

```bash
git checkout feature/xstate-machine-design
git checkout -b recovery/xstate-from-archive "archive/xstate-before-rebuild-YYYYMMDD"
```

## Done Definition

XState rebuild is complete when canonical sync is in place, TODO stubs are resolved or explicitly tracked, and module + integration tests pass.
