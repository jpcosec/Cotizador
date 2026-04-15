# Step 04 - Basket Split by Days

## Context

Step 03 delivered a stable single-day basket with entry-level runtime isolation.

This step introduces day partitioning while preserving the same entry contract and item actor behavior.

## Why

The planned UI expects a day-structured quotation flow.

Day partition is a container concern, not an item concern. If we push day logic into item actors, complexity and coupling rise quickly.

## How

Add a day orchestration layer over basket entries:

- `selectedDayIndex`
- `entriesByDay: Map<dayIndex, BasketEntry[]>`

Aggregation levels:

1. line total (item actor snapshot)
2. day subtotal
3. full basket subtotal

All mutations stay entry-targeted (`entryId`).

Reuse constraint:

- Day partition logic stays in container orchestration only; item/database adapters remain shared and unchanged.

## Objectives

- [x] Support day selection and per-day entry views.
- [x] Add entries to selected day.
- [x] Remove entries from selected day.
- [x] Move entries between days.
- [x] Keep day and global totals consistent.

## Detailed Subagent Instructions

### Subagent A - Reuse audit for day views (explore)

Review existing UI/view primitives:

- `packages/components/quotation/views/DayTabs.js`
- `packages/components/quotation/views/DayAccordion.js`

Return:

- what can be reused directly
- what must be adapted for item-actor-backed entries

### Subagent B - Day partition implementation (general)

Implement day-aware basket runtime with APIs:

- `selectDay(dayIndex)`
- `addEntryToDay(dayIndex, resolvedDef)`
- `removeEntryFromDay(dayIndex, entryId)`
- `moveEntryToDay(entryId, targetDayIndex)`
- `getDayDisplay(dayIndex)`
- `toDisplayObject()` with day + global aggregates

### Subagent C - Test matrix (general)

Add tests for:

- day switch rendering
- per-day add/remove behavior
- cross-day move behavior
- subtotal consistency after mutations

## How To Check If It's Ready

- Selecting a day changes visible entry set correctly.
- Entries mutate only in intended day.
- Moving entries updates both source and target day totals.
- Global totals remain accurate after all day operations.

## How To Test

### Automated

```bash
npm test
```

Expected:

- Day partition tests pass.
- Step 03 behavior remains green.

### Manual

```bash
npm run serve:sandbox
```

Verify:

1. Add entries to Day 1 and Day 2.
2. Switch tabs and validate visibility.
3. Move entries between days.
4. Check day-level and global totals.

## Commit

`docs(plan): define step 04 day-partitioned basket`
