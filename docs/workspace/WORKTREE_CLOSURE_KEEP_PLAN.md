# Worktree Closure Keep Plan

This document defines what must be preserved before closing or archiving sibling worktrees, while keeping branch data intact.

## Goal

Rebuild module worktrees from the current integrated source (`claps_codelab`) without losing testing, mocking, and historical value.

## Non-Negotiables

- Do not lose any git branch history from existing worktrees.
- Keep high-value tests and mock fixtures that validate business behavior.
- Keep reproducible local commands for module and integrated validation.
- Keep traceability from old paths to new rebuilt paths.

## Canonical Source for Rebuild

- `claps_codelab/packages/database`
- `claps_codelab/packages/pricing`
- `claps_codelab/packages/xstate`
- `claps_codelab/packages/frontend`
- `claps_codelab/bundling`
- `claps_codelab/gas`

## What to Keep by Worktree

### 1) `claps_codelab_database`

- Keep:
  - adapter interface and implementations (`IStore`, `InMemoryStore`, `FileStore`, `GasSheetStore`)
  - seeding utilities (`csvSeed`, v1 CSV preset support)
  - database tests (especially schema/model generation and seed initialization)
- Rebuild target baseline:
  - `claps_codelab/packages/database`

### 2) `claps_codelab_pricing`

- Keep:
  - pricing pipeline modules and rules actions
  - historical quotation smoke test and related fixture/data assumptions
  - unit/integration test catalog that protects deterministic behavior
- Rebuild target baseline:
  - `claps_codelab/packages/pricing`

### 3) `claps_codelab_xstate`

- Keep:
  - machine blueprint and adapter separation pattern
  - guard/action/integration tests validating transitions and parallel regions
  - helper scripts useful for debugging (`inspect`, `example`) where relevant
- Rebuild target baseline:
  - `claps_codelab/packages/xstate`

### 4) `claps_codelab_frontend`

- Keep:
  - `AlpineXStateBridge` behavior and tests
  - local actor bootstrap patterns and tests
  - phase blockers notes that affect bundling/GAS/local behavior
- Rebuild target baseline:
  - `claps_codelab/packages/frontend`

## Cross-Worktree Assets to Keep

- Shared fixtures and seeded-store test helpers used across layers.
- End-to-end integration tests validating merged flow.
- Local/GAS shim notes that document environment differences.

## Branch/Data Persistence Plan

For each sibling worktree branch:

1. Ensure branch is preserved on local and remote (if applicable).
2. Create an archive tag before rebuild cutoff point (for example `archive/<worktree>-before-rebuild-YYYYMMDD`).
3. Keep README pointer in archived branch to new rebuilt branch location.
4. Do not delete legacy branch until rebuilt branch passes agreed test gates.

## Rebuild Acceptance Checklist

A rebuilt module is acceptable only if all are true:

- Core test suite from legacy branch is migrated or intentionally superseded with explicit parity notes.
- Mocking interfaces used by downstream layers still work.
- Public IO contract (inputs/events/outputs) remains stable or has migration notes.
- Integrated tests in `claps_codelab` still pass after module replacement.
- Documentation is updated in rebuilt branch and in root index/status docs.

## Known Gaps to Resolve During Rebuild

- Replace deep import paths that point into nested `node_modules`.
- Close remaining machine adapter TODOs (`LOAD_QUOTATION` and write/send stubs).
- Unify local browser behavior vs GAS template behavior in frontend runtime docs and tests.

## Suggested Execution Order

1. Database
2. Pricing
3. XState
4. Frontend
5. Integrated regression pass in `claps_codelab`

This order minimizes breakage because downstream layers depend on upstream data and orchestration contracts.
