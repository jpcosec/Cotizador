# Pricing Rebuild Execution Checklist

This checklist rebuilds `claps_codelab_pricing` from `claps_codelab/packages/pricing` while preserving test and mocking value.

## Objective

- Keep integrated package state as canonical.
- Preserve pricing branch history before rebuild.
- Migrate/retain high-value pricing tests and fixtures.

## Current Baseline (Verified)

- Database-style parity does not fully hold for pricing.
- Non-trivial differences detected (excluding docs/node_modules):
  - `package.json`, `package-lock.json`, `vitest.config.js`
  - `tests/helpers/store_factory.js`
  - `tests/integration/historical_quotation_smoke.test.js`
  - `scripts/inspect.js` exists only in integrated package
  - `src/Config/` exists only in sibling pricing worktree

## Step 0 - Preflight

```bash
cd /home/jp/CotizadorLodge/claps_codelab_pricing && npm test
cd /home/jp/CotizadorLodge/claps_codelab/packages/pricing && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

Acceptance:
- Both pricing suites pass.
- Integrated tests pass.

## Step 1 - Preserve Legacy Branch State

From `claps_codelab_pricing`:

```bash
git status
git add -A
git commit -m "docs: freeze pre-rebuild pricing worktree state"  # only if needed
git tag "archive/pricing-before-rebuild-YYYYMMDD"
```

Optional remote backup:

```bash
git push origin feature/pricing-logic
git push origin "archive/pricing-before-rebuild-YYYYMMDD"
```

## Step 2 - Create Rebuild Branch

```bash
git checkout -b rebuild/pricing-from-v2
```

## Step 3 - Sync Canonical Package Source

```bash
rsync -av --delete \
  --exclude=node_modules \
  /home/jp/CotizadorLodge/claps_codelab/packages/pricing/ \
  /home/jp/CotizadorLodge/claps_codelab_pricing/
```

## Step 4 - Re-Apply Keep Items Explicitly

Must keep (from closure plan):
- Full pricing test catalog (unit + integration).
- Historical quotation smoke test behavior and fixture assumptions.
- Rules engine action coverage.

Decision item to resolve during rebuild:
- If `src/Config/` from legacy worktree is still required by tests or tools, either:
  - migrate it into integrated package baseline, or
  - retire it with explicit parity notes in changelog.

## Step 5 - Resolve Known Functional TODO

Carry and prioritize:
- `src/Pricing/pipeline.js`: implement `CANTIDAD_DEFAULT` behavior (currently TODO).

## Step 6 - Parity Validation

```bash
cd /home/jp/CotizadorLodge/claps_codelab_pricing && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

Acceptance:
- Rebuilt pricing tests pass.
- Integrated tests pass.
- Historical smoke test still validates expected reconciliation.

## Step 7 - Document and Commit

Required docs update:
- `claps_codelab_pricing/README.md`
- `claps_codelab_pricing/changelog.md`

Commit guidance:
- Commit A: canonical sync.
- Commit B: parity fixes + TODO closure (if included).
- Commit C: docs alignment.

## Rollback Plan

```bash
git checkout feature/pricing-logic
git checkout -b recovery/pricing-from-archive "archive/pricing-before-rebuild-YYYYMMDD"
```

## Done Definition

Pricing rebuild is complete when rebuilt branch uses integrated baseline, preserves critical test/mocking value, and passes module + integration regression.
