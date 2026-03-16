# U-2 Editor Basic - Agent Guideline

## Context

This track is not a full editor redesign.
Start from existing behavior and add only the minimum drag layer required.

Baselines:

- `claps_codelab/Components_Timeline.html` (legacy editing semantics)
- `claps_codelab/Stores_App.html` (legacy flow semantics)
- `plan/legacy/I-3-category/html_playground_draft.html` (drag interactions draft)

## Step 1 - Build gesture matrix first

Create `gesture_event_matrix.md` with one row per interaction:

- source element,
- target element,
- runtime event,
- payload mapping,
- fallback behavior.

No implementation before this matrix is complete.

## Step 2 - Preserve current editor contract

Before adding drag, verify these behaviors stay unchanged:

- manual hour editing,
- overrides,
- duplicate/copy/remove,
- day selection and day copy.

## Step 3 - Add drag layer incrementally

Order:

1. catalog -> day/hour drop,
2. move existing entry between hours,
3. resize duration.

Each step must map to existing runtime events.

## Step 4 - Regression suite

Define E2E coverage for:

- drag interactions,
- legacy/manual controls,
- day operations.

## What NOT to do

- Do not implement kit/group drag behavior yet.
- Do not remove current list editor UI.
- Do not add machine complexity unless required after matrix validation.
