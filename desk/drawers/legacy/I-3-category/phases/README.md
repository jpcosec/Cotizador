# I-3 Category Playground - Phase Index

This folder defines the progressive integration plan from the current item playground toward the full planned container UI.

Execution order is strict. Do not start a phase before the previous phase is complete and verified.

## Phase Order

1. `01_category_loader.md` - single category container
2. `02_full_catalog.md` - all categories catalog orchestration
3. `03_basket_single_day.md` - basket runtime (single day)
4. `04_basket_by_days.md` - day partition over basket
5. `05_full_planned_ui_integration.md` - full planned HTML integration

## Current Status

- Step 01: complete
- Step 02: complete
- Step 03: complete
- Step 04: complete
- Step 05: pending

## Shared Constraints

- Keep `claps_codelab_rebuild_components/` as source of truth.
- Keep `claps_codelab/` as reference-only.
- Do not move pricing or rules logic out of `Item` runtime.
- Keep Alpine as display and event-dispatch layer.
- Keep reusable code in packages, and playground context wiring in apps:
  - reusable component/domain/machine code in `packages/components/**`
  - reusable database adapters and store logic in `packages/database/**`
  - playground mounts/context wiring in `apps/sandbox/playground/**` and `apps/quotation/playground/**`
- Avoid duplication in playground wiring:
  - use `seedToResolverDb()` from `packages/database/src/playgroundAdapter.js`
  - use shared item HTML sections from `packages/components/item/ui/playgroundItemSections.js`
- Preserve identity split everywhere:
  - `itemId` = definition identity
  - `entryId` = runtime instance identity

## Go / No-Go Gate Per Phase

A phase is complete only if all are true:

1. objectives checklist in that phase document is complete
2. automated test suite passes for touched scope
3. manual sandbox checks pass for phase behavior
4. commit created with the exact phase commit message

## Commit Sequence

1. `docs(plan): define step 01 single-category loader`
2. `docs(plan): define step 02 full catalog orchestration`
3. `docs(plan): define step 03 single-day basket runtime`
4. `docs(plan): define step 04 day-partitioned basket`
5. `docs(plan): define step 05 full planned UI integration`

## Notes For Operators

- If a later phase reveals a contract issue in an earlier phase, stop and patch the earlier phase document first.
- Keep changes incremental and avoid introducing full planned HTML interactions before Phase 05.
