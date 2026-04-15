# Step 03 - Basket (Single Day)

## Context

After Step 02, catalog/category browsing is stable over real DB data.

This step introduces basket runtime behavior for one day, using shipping from catalog/category into independent basket entries.

## Why

Basket is where user-controlled mutations intensify:

- add/remove lines
- per-line overrides
- reset behavior
- rule visibility parity

If identity and isolation are not strict here, day-splitting and timeline UI will break later.

## How

Implement a single-day basket container that owns basket entry runtimes.

Shipping contract:

- source: resolved item definition
- output: new basket runtime entry with unique `entryId`
- mode: basket
- no actor sharing with catalog entries

Mutations target `entryId` only.

Reuse constraint:

- Basket wiring must call shared item runtime/machine contracts; no duplicated pricing/rules logic and no local DB-shape forks.

## Objectives

- [x] Add shipping flow from category/catalog to basket.
- [x] Support duplicate same-item entries with independent states.
- [x] Support remove by `entryId`.
- [x] Support per-entry override/clear/reset.
- [x] Aggregate basket subtotal and rule status from basket entries.

## Detailed Subagent Instructions

### Subagent A - Runtime invariants review (explore)

Audit existing step-03b behavior and return explicit invariants:

- catalog and basket runtime independence
- override lock and reset semantics
- expected rule indicator parity

### Subagent B - Basket runtime manager (general)

Implement basket runtime APIs:

- `addEntryFromDefinition(resolvedDef, context)`
- `removeEntry(entryId)`
- `setEntryOverride(entryId, key, value)`
- `clearEntryOverride(entryId, key)`
- `resetEntryOverrides(entryId)`
- `toDisplayObject()` with aggregate totals and rule summary

### Subagent C - Integration and acceptance tests (general)

Add tests for:

- ship one item
- ship duplicate same item
- remove one duplicate without touching sibling
- override then context change (locked)
- reset then context change (reactive again)

## How To Check If It's Ready

- Shipping creates basket entries every time.
- Duplicate item lines remain independent.
- Remove targets only selected `entryId`.
- Rule and total aggregations match child snapshots.

## How To Test

### Automated

```bash
npm test
```

Expected:

- Basket container tests pass.
- Existing category/catalog tests remain green.

### Manual

```bash
npm run serve:sandbox
```

Verify:

1. Ship same item multiple times.
2. Override one line, then change global context.
3. Confirm only non-overridden lines react.
4. Reset override and confirm line reacts again.

## Commit

`docs(plan): define step 03 single-day basket runtime`
