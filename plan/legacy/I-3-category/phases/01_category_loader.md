# Step 01 - Category Loader (Single Category)

## Context

The rebuild already has three stable building blocks:

- I-1 database loading and CSV-backed seed flow.
- `resolveItemDefinition(itemId, db)` for DB-native joins.
- I-2 item runtime (`Item.fromDefinition()` + `createItemActor()`) with rule evaluation and projection.

This step introduces the first real container boundary: one selected category owning a collection of child item runtimes.

## Why

If category aggregation and lifecycle are not correct now, every later layer (full catalog, basket, days, full planner UI) inherits unstable behavior.

Step 01 is the smallest production-relevant integration slice.

## How

Build a category playground route that:

1. Loads DB seed once.
2. Maps seed using shared adapter `seedToResolverDb(seed)`.
3. Lets the user select one category.
4. Resolves all active category items through `resolveItemDefinition`.
5. Creates one item actor per runtime entry.
6. Broadcasts context (`paxGlobal`, `dia`, `hora`) to every child actor via `SET_CONTEXT`.
7. Aggregates snapshot collections into category display state.

Presentation constraint for this step:

- Use the shared item catalog HTML (`catalogRuntimeHtml`) instead of duplicating card markup in category templates.

Identity rule for this and all next steps:

- `itemId`: definition identity from DB.
- `entryId`: runtime identity for each instance in the container.

## Objectives

- [x] Add `Category` container runtime contract for one selected category.
- [x] Load all active items for that category from DB.
- [x] Aggregate `subtotal`, `hasErrors`, `hasWarnings` from child snapshots.
- [x] Expose aggregated rule collections for debugging and validation.
- [x] Guarantee clean actor subscription teardown on reload/switch/destroy.

## Detailed Subagent Instructions

### Subagent A - Contract and dependency audit (explore)

Read and summarize integration boundaries from:

- `packages/database/src/resolveItemDefinition.js`
- `packages/components/item/Item.js`
- `packages/components/item/machine/itemMachine.js`
- `packages/components/category/STATE_CONTRACT.md`

Return:

- Required child snapshot fields for aggregation.
- API assumptions that must not change.
- Mismatches to fix before implementation.

### Subagent B - Category runtime and tests (general)

Implement and test a minimal category runtime manager.

Required runtime capabilities:

- initialize from `{ categoryId, db, context }`
- create/destroy child entries
- broadcast context patches to all children
- compute category display snapshot from child snapshots

Write tests first for:

- load all active items in selected category
- aggregate totals and rule flags
- cleanup correctness (no stale updates after destroy)

### Subagent C - Minimal playground route (general)

Create a basic route with:

- category selector
- context controls (`paxGlobal`, `dia`, `hora`)
- simple list of child item summaries
- category aggregate panel

Do not implement timeline interactions in this step.

## How To Check If It's Ready

- Switching category reloads entries with correct count.
- Context changes update child and aggregate state immediately.
- Subtotal and warning/error state always match child snapshots.
- Route teardown or category switch leaves no stale actor updates.

## How To Test

### Automated

```bash
npm test
```

Expected:

- New Category runtime tests pass.
- Existing item/database tests remain green.

### Manual

```bash
npm run serve:sandbox
```

Open new category route and verify:

1. Category selector loads data correctly.
2. Changing `paxGlobal` changes affected child totals.
3. Aggregates reflect current child state.
4. Switching categories does not duplicate stale entries.

## Commit

`docs(plan): define step 01 single-category loader`
