# Step 05 - Full Planned UI Integration

## Context

By this step, runtime contracts are expected to be stable:

- Category loader
- Full catalog categories
- Basket single-day
- Basket day partition

Now we integrate the complete planned playground UI (`html_playground_draft.html`) as a presentation and command layer on top of those contracts.

## Why

The final UI is rich and interaction-heavy. Implementing it before container contracts are stable creates hidden logic duplication and brittle state ownership.

This step keeps runtime logic below, and UI richness above.

## How

Integrate planned UI in subphases:

1. Layout shell and panel structure.
2. Read-only data binding to existing `toDisplayObject()` projections.
3. Interaction wiring (buttons, selectors, drag/drop) mapped to existing container commands.
4. Timeline/scheduler gestures mapped to entry/day operations.

No direct business-state mutation in Alpine.

Reuse constraint:

- Full planned UI must consume existing shared templates/adapters/contracts; do not duplicate item card HTML or DB mapping helpers inside the final UI layer.

## Objectives

- [ ] Render full planned layout.
- [ ] Bind all controls to existing orchestration events.
- [ ] Preserve pricing/rules behavior from prior steps.
- [ ] Keep rule indicators and aggregates consistent in all panels.
- [ ] Maintain deterministic lifecycle and no runtime leaks.

## Detailed Subagent Instructions

### Subagent A - UI to event mapping matrix (explore)

From `plan/I-3-category/html_playground_draft.html`, map:

- each control/gesture
- target orchestrator event
- expected state impact

Return a strict matrix used as implementation checklist.

### Subagent B - Phased UI wiring (general)

Implement in order:

1. shell + regions
2. projection binding
3. interaction wiring

Do not change item domain functions or item machine contract.

### Subagent C - Acceptance and regression suite (general)

Add/extend tests for full flow:

- catalog to basket shipping
- override behavior
- day operations
- final UI interactions

Ensure prior phase tests stay green.

## How To Check If It's Ready

- Planned UI route loads without runtime errors.
- Every primary interaction maps to expected container mutation.
- Aggregates and rule states are consistent across views.
- No stale subscriptions after navigation/removal flows.

## How To Test

### Automated

```bash
npm test
npm run test:e2e
```

Expected:

- new full-UI acceptance scenarios pass
- prior phase regression suite remains green

### Manual

```bash
npm run serve:sandbox
```

Verify end-to-end journey:

1. Browse categories and items.
2. Ship to basket.
3. Override and reset lines.
4. Move items across days.
5. Validate totals and rule indicators across the full UI.

## Commit

`docs(plan): define step 05 full planned UI integration`
