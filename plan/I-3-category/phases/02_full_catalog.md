# Step 02 - Full Catalog (All Categories)

## Context

Step 01 validated one category container with real DB definitions and child item runtimes.

This step scales the same contract to all categories while preserving:

- DB-native source loading from I-1.
- Item runtime ownership from I-2.
- explicit runtime lifecycle management learned in step-03b.

## Why

The full catalog is the first scale test of the container architecture.

If we instantiate everything eagerly without control, the UI can become noisy and heavy. If we skip container boundaries, basket/day logic later becomes coupled and fragile.

## How

Build a catalog orchestrator that owns a collection of category runtimes.

Recommended runtime policy:

- Load all category definitions for navigation.
- Lazily initialize child item actors per category when the category is expanded or activated.
- Teardown inactive category runtimes when appropriate.

Preserve identity contract:

- category identity from `ID_Categoria`.
- item identity from `ID_Item`.
- runtime entry identity with generated `entryId`.

Reuse constraint:

- Keep using shared seed mapping (`seedToResolverDb`) and shared item catalog rendering sections; do not fork per-category card HTML.

## Objectives

- [x] Render all active categories from DB.
- [x] Provide category expand/collapse behavior.
- [x] Keep category-level aggregates visible and correct.
- [x] Use lazy runtime initialization to avoid unnecessary actor creation.
- [x] Keep teardown deterministic when categories deactivate.

## Detailed Subagent Instructions

### Subagent A - Scaling and perf baseline (explore)

Inspect `data/init/*.csv` to report:

- number of active categories
- active item count per category
- likely actor count if eager-loaded

Return recommended lazy policy and expected maximum actor count in normal use.

### Subagent B - Catalog orchestrator implementation (general)

Implement a catalog runtime manager with:

- category registry (`Map<categoryId, runtime>`)
- category expansion state
- lazy category initialization
- category teardown hooks

Guarantee category contract from Step 01 remains unchanged.

### Subagent C - Coverage and regression tests (general)

Add tests for:

- all-category listing
- expand/collapse behavior
- lazy runtime creation
- teardown cleanup and no stale updates

## How To Check If It's Ready

- All active categories appear in the route.
- Expanding category initializes only that category runtime.
- Collapsing/teardown stops updates from removed runtimes.
- Aggregate totals/warnings are accurate for active categories.

## How To Test

### Automated

```bash
npm test
```

Expected:

- New catalog orchestration tests pass.
- Step 01 tests remain green.

### Manual

```bash
npm run serve:sandbox
```

Verify in the catalog route:

1. Expand multiple categories and check item loading.
2. Collapse and re-open categories to verify stable rehydration.
3. Ensure no stale console updates after collapse.

## Commit

`docs(plan): define step 02 full catalog orchestration`
