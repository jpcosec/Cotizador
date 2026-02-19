# Worktree Rebuild Gap Audit

This audit compares each sibling worktree with the integrated source at `claps_codelab/packages/*` and identifies what to migrate, keep as archive-only, or drop.

## Scope and Baseline

- Baseline (canonical): `claps_codelab/packages/database`, `claps_codelab/packages/pricing`, `claps_codelab/packages/xstate`, `claps_codelab/packages/frontend`.
- Compared against:
  - `claps_codelab_database`
  - `claps_codelab_pricing`
  - `claps_codelab_xstate`
  - `claps_codelab_frontend`

## High-Level Result

- Core source and tests are largely mirrored between sibling worktrees and integrated packages.
- Most drift is structural (paths/layout), dependency declarations, and old docs.
- Rebuild effort should focus on import-path normalization, TODO closure, and documentation pruning rather than logic rewrite.

## Gap Matrix

| Module | Current Gap vs `claps_codelab/packages/*` | Keep/Migrate Action |
|---|---|---|
| Database | Minimal code drift; mostly docs/history drift | Migrate tests + seed utilities as-is, archive legacy docs |
| Pricing | Minimal code drift; test count/doc drift in some branches | Preserve all tests (especially historical smoke), normalize docs/scripts |
| XState | Core parity but adapter TODOs remain | Preserve full machine tests, close adapter TODOs in rebuilt branch |
| Frontend | Core bridge parity, environment notes split across docs | Preserve bridge tests and blockers doc, normalize local/GAS path strategy |

## Detailed Findings by Worktree

### 1) Database (`claps_codelab_database`)

- Aligned assets:
  - `IStore`, `ModelFactory`, `createDatabase`, adapter stores, csv seeders.
  - Database test suite behavior matches integrated package intent.
- Differences to handle:
  - Legacy-focused docs and stale architecture references in non-source files.
  - Module sits at `packages/database` in both places, but documentation narratives differ.
- Rebuild decision:
  - Keep source + tests + seed behavior.
  - Archive old planning docs under branch history only.

### 2) Pricing (`claps_codelab_pricing`)

- Aligned assets:
  - Pricing pipeline/rules engine modules and test tree are mirrored in integrated package.
  - Historical quotation smoke test remains critical for regression confidence.
- Differences to handle:
  - Some dependency/version declarations differ by branch.
  - Legacy docs in sibling branch can conflict with integrated simplified flow.
- Rebuild decision:
  - Keep entire tests catalog and fixtures.
  - Retain interactive/demo workflows where still useful, but document them as developer tools only.

### 3) XState (`claps_codelab_xstate`)

- Aligned assets:
  - Machine blueprint, adapters, tests, service helper patterns all present in integrated package.
- Differences to handle:
  - Open TODO stubs in adapter actions/services remain and should be first-class rebuild tasks.
  - Some branch docs still reference old structures and should not be re-imported.
- Rebuild decision:
  - Keep all guard/transition/parallel-region tests.
  - Close TODO stubs during rebuild hardening.

### 4) Frontend (`claps_codelab_frontend`)

- Aligned assets:
  - `AlpineXStateBridge`, local actor helper, and test folders are represented in integrated package frontend.
- Differences to handle:
  - Local vs GAS behavior notes are spread across docs and should be consolidated.
  - Some local/import patterns are fragile (deep dependency paths).
- Rebuild decision:
  - Keep bridge + local tests + blockers notes.
  - Normalize import boundaries and keep one documented local run path.

## Shared TODOs to Carry Into Rebuild

- Pricing: apply `CANTIDAD_DEFAULT` rules in defaults phase.
- XState: implement adapter write operations (`updateRow`, `addNewRow`).
- XState: implement real send service behavior.
- Integration/frontend: remove deep `node_modules` import paths and stabilize package imports.
- Integration/frontend: complete machine-native quotation load flow (`LOAD_QUOTATION`).

## What Not to Re-Migrate

- Stale phase/timeline claims and historical estimates.
- References to missing files (for example old architecture docs no longer present).
- Legacy docs that duplicate current behavior already covered by tests/source.

## Rebuild Readiness Score (Current)

- Database: High
- Pricing: High
- XState: Medium (due to adapter TODOs)
- Frontend: Medium (due to environment/import concerns)

## Execution Guidance

Follow `WORKTREE_CLOSURE_KEEP_PLAN.md` for branch preservation and acceptance criteria, then execute rebuild in this order:

1. Database
2. Pricing
3. XState
4. Frontend
5. Integrated regression in `claps_codelab`
