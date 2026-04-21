# T-001 - GenericViewBase UI Migration Plan

## Status

- status: open
- priority: high
- domain: quotation/runtime

## Objective

Define and execute the migration path from the current hybrid quotation UI shell to a `GenericViewBase`-centered architecture without breaking the working GAS flow.

This task covers architecture, sequencing, boundaries, and acceptance criteria for migrating the active quotation UI surfaces onto `GenericViewBase`/`GenericUnitBase` contracts.

## Current State

The repo is currently hybrid.

- `gas/scripts/QuotationFlowRuntimeView.js` already extends `GenericViewBase` and acts as the best current view-level adapter.
- `gas/scripts/createQuotationFlowComponent.js` is still the real Alpine-facing orchestrator and the main integration point for the GAS UI.
- Active quotation child surfaces still use older UI base classes:
  - `src/components/quotation/views/sidebar/Sidebar.js` -> `UIContainerBase`
  - `src/components/quotation/views/ItemList.js` -> `UIContainerBase`
  - `src/components/quotation/views/Modals.js` -> `UIContainerBase`
  - `src/components/quotation/views/timeline/Timeline.js` -> `UIContainerBase`
- Legacy modal/browser-style surfaces use `ModalControllerBase`, not `GenericUnitBase`:
  - `src/components/quotation/modals/ClientSelector.js`
  - `src/components/quotation/modals/PreviousQuotationsModal.js`

## Main Conclusion

Full migration is feasible, but it is not a base-class rename.

- difficulty: medium-to-high for full UI migration
- difficulty: low-to-medium for incremental migration of the shell children
- recommended strategy: incremental, not big-bang

The repo is already partially aligned because the top-level runtime view exists, but the rendered UI contract is still mostly a flat Alpine object.

## Why Full Migration Is Non-Trivial

### 1. The flat Alpine shell is still the runtime API

`gas/scripts/createQuotationFlowComponent.js` currently owns:

- stage coordination
- shell synchronization from runtime snapshots
- modal visibility/search state
- persistence error/loading state
- command forwarding for save/load/export/select/drag/drop
- capability handling for runtime mode and database editor access

The GAS template binds directly to this flat API in `gas/Quotation_App.html`.

### 2. Child controllers are not registered runtime units yet

The child UI controllers are instantiated side-by-side, but not yet treated as registered `GenericUnitBase` children with formal projection/signal routing.

### 3. Timeline is interaction-heavy

`TimelineController` contains transient UI mechanics that will require careful migration:

- drag/drop state
- resize state
- coordinate math
- event emission for item movement and resizing

This makes it the hardest high-value child to migrate.

## Recommended Target Architecture

```text
Quotation runtime
  -> QuotationFlowRuntimeView extends GenericViewBase
       -> SidebarView/Unit
       -> ItemListView/Unit
       -> ModalsView/Unit
       -> TimelineView/Unit

Alpine shell
  -> thin adapter over view projection + routed commands
```

## Migration Order

### Phase 1 - Stabilize the view shell contract

Goal: make `QuotationFlowRuntimeView` the explicit owner of shell projection shape.

Tasks:

1. Document the shell projection contract consumed by `gas/Quotation_App.html`.
2. Move more shell-only derived state into `QuotationFlowRuntimeView` where appropriate.
3. Reduce direct snapshot-to-template coupling inside `createQuotationFlowComponent()`.

Expected outcome:

- one stable projection contract for the shell
- less ad hoc state copying inside the Alpine facade

### Phase 2 - Migrate the easiest active child surfaces

Goal: convert low-risk child surfaces first.

Recommended order:

1. `Sidebar`
2. `ItemList`
3. `Modals`

Why:

- `Sidebar` is mostly projection plus command forwarding
- `ItemList` is mostly basket mutation forwarding
- `Modals` owns async search state and will benefit from formal unit boundaries

Expected outcome:

- these surfaces become `GenericUnitBase` or `GenericViewBase` descendants
- they are registered under `QuotationFlowRuntimeView`
- their output is consumed through child projections instead of raw side objects

### Phase 3 - Migrate Timeline

Goal: move the most interaction-heavy child onto the new runtime view model.

Tasks:

1. Separate pure timeline math/helpers from transient UI interaction state.
2. Define timeline-specific projection fields.
3. Define timeline signal vocabulary for drag, drop, move, resize.
4. Register timeline as a child runtime unit.

Expected outcome:

- drag/drop logic remains intact
- transient interaction state becomes explicit and testable

### Phase 4 - Thin the Alpine adapter

Goal: keep Alpine only as a renderer and event bridge.

Tasks:

1. Replace broad local mutable state in `createQuotationFlowComponent()` with view projection reads.
2. Route UI commands into the view/unit graph instead of duplicating imperative shell methods.
3. Preserve GAS compatibility and current template behavior while shrinking the shell object.

Expected outcome:

- Alpine becomes a thin adapter
- orchestration lives in runtime view units

### Phase 5 - Revisit modal/browser abstractions

Goal: decide whether `ClientSelector` and `PreviousQuotationsModal` remain legacy modal controllers or become runtime view units.

Recommendation:

- do not migrate them first
- first migrate the active GAS path (`Modals`, `Sidebar`, `ItemList`, `Timeline`)
- revisit legacy modal abstractions after the shell contract is stable

## Candidate Migrations

### Best Immediate Candidates

- `src/components/quotation/views/sidebar/Sidebar.js`
- `src/components/quotation/views/ItemList.js`
- `src/components/quotation/views/Modals.js`

### Highest-Risk Candidate

- `src/components/quotation/views/timeline/Timeline.js`

### Defer Until Later

- `src/components/quotation/modals/ClientSelector.js`
- `src/components/quotation/modals/PreviousQuotationsModal.js`
- inactive/legacy simple views not on the main GAS path

## Suggested Deliverables

1. child registration of active quotation UI surfaces under `QuotationFlowRuntimeView`
2. explicit projection contract for shell + each child
3. signal vocabulary for timeline and modal interactions
4. reduced responsibility in `createQuotationFlowComponent()`
5. tests proving projections and routed commands remain stable

## Acceptance Criteria

- `QuotationFlowRuntimeView` is the explicit top-level view owner for the quotation shell
- at least `Sidebar`, `ItemList`, and `Modals` are no longer `UIContainerBase` holdovers
- `createQuotationFlowComponent()` is materially smaller and thinner
- `gas/Quotation_App.html` still works without behavioral regressions
- `npm test` passes
- `npm run build` passes
- local GAS preview still works
- the quotation lifecycle remains valid in local flow testing

## Risks

- template bindings may be tightly coupled to the current flat Alpine API
- timeline drag/resize behavior may regress if transient state is migrated too aggressively
- modal visibility/search state may get split awkwardly between runtime and shell unless the projection boundary is clarified first

## Difficulty Assessment

### Incremental Migration

- difficulty: 4/10 to 6/10
- reason: the architecture already has a working `GenericViewBase` anchor and the easiest children are mostly adapters

### Full UI Migration

- difficulty: 7/10 to 8/10
- reason: the active GAS UI still depends on a large Alpine shell contract and one interaction-heavy timeline surface

## Recommended First Implementation Slice

If execution starts now, the safest first slice is:

1. formalize shell projection in `gas/scripts/QuotationFlowRuntimeView.js`
2. migrate `src/components/quotation/views/sidebar/Sidebar.js`
3. migrate `src/components/quotation/views/ItemList.js`
4. migrate `src/components/quotation/views/Modals.js`
5. leave `src/components/quotation/views/timeline/Timeline.js` for a follow-up task

## References

- `gas/scripts/QuotationFlowRuntimeView.js`
- `gas/scripts/createQuotationFlowComponent.js`
- `gas/Quotation_App.html`
- `src/components/quotation/views/sidebar/Sidebar.js`
- `src/components/quotation/views/ItemList.js`
- `src/components/quotation/views/Modals.js`
- `src/components/quotation/views/timeline/Timeline.js`
- `src/components/quotation/modals/ClientSelector.js`
- `src/components/quotation/modals/PreviousQuotationsModal.js`
