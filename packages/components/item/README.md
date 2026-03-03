# item (Step 03)

Item domain + state machine + sandbox playgrounds.

## Core behavior docs

- `LOGIC.md` — pricing kind, initialization mode, catalog vs basket semantics.
- `EXPECTED_BEHAVIOR.md` — runtime expectations and QA checks.
- `STATE_CONTRACT.md` — public state boundary (`toDisplayObject()` contract).

## Current playground routes

- `/step-03-item` — single-item sandbox with resolver panel (debug/edit).
- `/step-03b` — orchestrated playground with factory + global context + catalog + basket columns.

## Runtime architecture

- **Domain object:** `Item.js`
  - self-contained business object
  - receives external context via `receiveContext()`
  - enforces override precedence and computes display projections
- **State machine adapter:** `machine/itemMachine.js`
  - wraps one `Item` instance
  - handles events (`SET_CONTEXT`, `SET_OVERRIDE`, etc.)
- **Playground orchestrators:**
  - `logic/createItemStandaloneComponent.js` (single actor)
  - `logic/createItemMultiComponent.js` (multi-actor orchestration)

## Implementation planning

- `ITEM_PLAYGROUND_IMPLEMENTATION_PLAN.md` documents the target factory->catalog+basket architecture and acceptance checks.

## Historical note

- `STEP_03B_MULTI_VIEW_ISSUE_DIAGNOSIS.md` records the prior multi-view initialization issue and the migration to the new orchestrated model.
