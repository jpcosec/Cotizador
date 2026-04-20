# GenericUnit Base Component Plan

## Objective

Build and validate a reusable `GenericUnit` base component plus a first `View` specialization that can be exercised visually with Alpine and structurally with XState, while remaining compatible with GAS deployment constraints and explicit runtime boundaries.

This plan assumes the first milestone is **not** production migration. The first milestone is a **playground-backed architecture spike** that proves:

- unit initialization
- state mutation
- unit-to-unit signaling
- XState orchestration
- Alpine visual projection
- persistence/export boundary calls
- external JS integration such as pricing/rules callbacks
- serializable snapshots and projections

## Why This Order

The current codebase is already strong in item-local computation and recursive container behavior, but weak in the explicit outer abstraction. The highest-leverage first proof is therefore:

1. `GenericUnit` as the shared runtime contract
2. `View` as the first real orchestration specialization
3. an Alpine visual playground around them

This matches the existing architecture analysis:

- current shell acts like a `View`, but is still monolithic
- lower layers already behave like containers/items by pattern
- GAS requires explicit boundaries and serializable projections

## Scope Of The Spike

### In Scope

- define the minimal `GenericUnit` runtime contract
- define the first `View` contract on top of `GenericUnit`
- prove Alpine rendering from serializable projection
- prove XState-driven stage transitions and mutation flow
- prove child registration and parent/child signaling
- prove mocked persistence/export/store/pricing/rules boundaries
- prove interaction with external plain JS functions
- define success criteria for later `Container` and `Item`

### Out Of Scope

- full migration of the quotation editor
- production replacement of `createQuotationFlowComponent()`
- rewriting current item pricing logic
- extracting the full `Store` facade implementation
- final UX/polish work

## Guiding Constraints

- keep contracts explicit and serializable
- keep `GenericUnit` lightweight and free of business-specific behavior
- keep pricing/rules external and invoked through orchestration or injected boundaries
- design for Alpine projection instead of framework-hidden state
- design for GAS-compatible generated artifacts, not router-heavy runtime magic
- prefer explicit registration over implicit discovery

## Target Architecture For The Spike

```text
PlaygroundShell
  -> View extends GenericUnit
    -> GenericUnit child units

Boundaries injected explicitly:
- store
- persistence
- export
- pricing
- rules
- diagnostics/logger (optional)
```

## Core Contracts To Define

### 1. `GenericUnit` Contract

`GenericUnit` should define the shared runtime mechanics only.

Required responsibilities:

- identity: `id`, `type`, optional `parentId`
- lifecycle: `initialize(context, boundaries, initialState?)`
- mutation entrypoint: `applyMutation(mutation)`
- signal input: `receiveSignal(signal)`
- signal output: `emitSignal(signal, target?)`
- child registration: `registerChild(unit, meta?)`
- boundary access: injected only, never ambient global dependency
- state access: `getSnapshot()`
- UI access: `getProjection()`
- subscription/update hook for Alpine/XState bridge

Rules:

- no pricing logic inside `GenericUnit`
- no quotation-specific fields inside `GenericUnit`
- no direct Alpine internals inside the core contract
- projection and snapshot must be plain serializable objects

### 2. `View` Contract

`View` should be the first specialization of `GenericUnit`.

Required responsibilities:

- own `view_id`
- own ordered `stage_id`
- manage visible child units
- route mutations/signals to children
- aggregate child projections for UI
- request persistence/export/store operations through boundaries
- expose a shell-friendly visual projection for Alpine

Rules:

- `View` coordinates, but does not price
- `View` may invoke boundaries, but does not implement those services
- `View` remains reusable, not quotation-specific

### 3. Projection Contract

The visual playground requires a stable `projection` shape from day one.

Minimum projection fields to standardize:

- `id`
- `type`
- `status`
- `visible`
- `enabled`
- `stage`
- `ui`
- `children`
- `derived`
- `errors`
- `warnings`
- `actions`

Suggested `ui` shape:

```js
{
  title,
  subtitle,
  variant,
  badges,
  panels,
  fields,
  actions,
  classes
}
```

## Workstreams

## Workstream A - Contract Design

### Deliverables

- `GenericUnit` responsibilities and non-responsibilities
- `View` responsibilities and non-responsibilities
- mutation semantics
- signal semantics
- projection vs snapshot semantics
- boundary injection contract

### Tasks

1. Write the `GenericUnit` contract spec.
2. Write the `View` extension spec.
3. Normalize the first minimal signal list for the spike.
4. Define what belongs in `snapshot` vs `projection`.
5. Define which parts of state are visual-only, runtime-only, or shared.

### Exit Criteria

- no unresolved ambiguity around `initialize`, `applyMutation`, `receiveSignal`, `emitSignal`, `getProjection`, `getSnapshot`
- clear separation between core mechanics and business/domain logic

## Workstream B - Boundary Design

### Deliverables

- boundary interface list for the spike
- mock implementations for playground use
- serialization rules for boundary payloads

### Boundaries To Model Immediately

- `store`
- `persistence`
- `export`
- `pricing`
- `rules`

### Tasks

1. Define the minimal callable shape of each boundary.
2. Decide which boundary calls are synchronous in the playground and which are async.
3. Define how XState actions invoke boundaries.
4. Define success/error payload shapes returned to units.
5. Define how boundary calls are surfaced in projection for visual debugging.

### Exit Criteria

- every external interaction in the spike crosses an explicit injected boundary
- no hidden direct imports required by `GenericUnit` or `View`

## Workstream C - Signal And Mutation Model

### Deliverables

- minimal canonical signal dictionary for the spike
- mutation shape
- event routing rules

### Initial Signal Families

- lifecycle: `INITIALIZE`, `RESET`, `DISPOSE`
- view/stage: `OPEN_VIEW`, `ENTER_STAGE`, `NEXT_STAGE`, `PREVIOUS_STAGE`
- mutation: `SET_CONTEXT`, `PATCH_CONTEXT`, `APPLY_MUTATION`
- registration: `REGISTER_UNIT`, `UNREGISTER_UNIT`
- persistence/export: `REQUEST_SAVE`, `REQUEST_LOAD`, `REQUEST_EXPORT`
- child feedback: `CHILD_UPDATED`, `SNAPSHOT_UPDATED`, `PROJECTION_UPDATED`
- external orchestration: `REQUEST_PRICING`, `REQUEST_RULES`, `BOUNDARY_DONE`, `BOUNDARY_ERROR`

### Tasks

1. Decide the canonical event envelope shape.
2. Define parent-to-child, child-to-parent, and local self-directed mutation rules.
3. Define which signals map directly to XState events.
4. Define how Alpine user actions become signals.
5. Define how boundary completion results become signals.

### Exit Criteria

- one event can be traced end-to-end from Alpine interaction to XState transition to projection update

## Workstream D - XState Integration Design

### Deliverables

- XState integration pattern for `GenericUnit`
- first `View` state machine shape
- action/guard/service boundary rules

### Tasks

1. Decide whether `GenericUnit` always hosts a machine, optionally hosts a machine, or delegates to adapters.
2. Define the minimum machine interface expected by the core contract.
3. Define how `initialize` seeds machine context.
4. Define how `applyMutation` and `receiveSignal` map to machine events.
5. Define where projection derivation happens: machine context, unit methods, or both.
6. Define where pricing/rules calls are triggered in machine actions/services.

### Exit Criteria

- a `View` can transition stages through XState while still exposing serializable projection and snapshot
- external JS pricing/rules hooks can be invoked without contaminating `GenericUnit`

## Workstream E - Alpine Visual Playground Design

### Deliverables

- small visual harness for one `View` and two child units
- projection-to-template mapping
- interactive controls for mutation and signaling
- visible debug panel for snapshots/signals/boundary calls

### Tasks

1. Define the playground page layout.
2. Define how Alpine stores and refreshes the current projection.
3. Define the initial visual components to render:
   - stage header
   - visible unit list
   - child projection cards
   - action buttons
   - diagnostics panel
4. Define user interactions to exercise the runtime.
5. Define a visual state-change checklist to validate reactivity.

### Mandatory Playground Scenarios

1. Initialize `View` and render initial stage.
2. Register child units and show them appearing in projection.
3. Trigger `NEXT_STAGE` from Alpine and confirm stage/UI update.
4. Dispatch mutation from Alpine to child and confirm projection refresh.
5. Trigger persistence request and show loading/success/error states.
6. Trigger export request and show payload/acknowledgement.
7. Trigger external pricing/rules call through XState and show returned results.
8. Show child-to-parent emitted signal updating the `View` projection.

### Exit Criteria

- Alpine can render and interact with the spike without reading hidden runtime internals
- visual state changes are understandable from the projection alone

## Workstream F - Playground Runtime Fixtures

### Deliverables

- fake `store`
- fake `persistence`
- fake `export`
- fake `pricing`
- fake `rules`
- fake child units with predictable state behavior

### Tasks

1. Create deterministic sample payloads for every boundary.
2. Define async delay/error simulation cases.
3. Define minimal child unit behaviors for stage visibility and local state mutation.
4. Define one sample flow that exercises multiple boundaries in sequence.

### Exit Criteria

- the playground can test orchestration without depending on production data sources

## Workstream G - Placement And Isolation Strategy

### Deliverables

- a repo placement decision for the spike
- clear isolation from production runtime
- migration path note

### Recommendation

Implement the spike in a separate experimental/runtime area first, not inside the current quotation flow implementation.

Reason:

- protects current production-adjacent logic
- keeps architecture spike iteration fast
- allows the contract to stabilize before adaptation

### Tasks

1. Choose the folder where the spike lives.
2. Keep its dependencies narrow.
3. Avoid coupling the spike to quotation-specific modules until the contract is proven.
4. Define the future adapter path from the spike into current runtime.

### Exit Criteria

- the spike can be developed and discarded/refined without destabilizing current runtime code

## Workstream H - Verification Strategy

### Deliverables

- acceptance checklist
- test matrix for runtime and visual behavior
- migration readiness criteria

### Verification Layers

#### 1. Contract Verification

- `initialize` produces consistent base snapshot
- `applyMutation` changes local state predictably
- `receiveSignal` normalizes and routes correctly
- `emitSignal` reaches expected targets
- `getProjection` stays serializable

#### 2. XState Verification

- stage transitions follow expected machine path
- side effects call boundaries correctly
- async completion updates projection correctly

#### 3. Alpine Verification

- projection renders without custom patch logic
- UI actions dispatch signals cleanly
- view updates after runtime changes

#### 4. Boundary Verification

- persistence payloads are serializable
- export payloads are serializable
- pricing/rules functions can be swapped without core contract changes

#### 5. GAS Compatibility Verification

- no framework assumptions beyond Alpine/XState/plain JS
- no required non-serializable public contract state
- boundaries remain explicit and payload-shaped

### Exit Criteria

- the spike proves architecture seams, not just happy-path logic

## Recommended Implementation Sequence

### Phase 0 - Architecture Spec

1. Finalize `GenericUnit` contract.
2. Finalize `View` contract.
3. Finalize projection/snapshot distinction.
4. Finalize boundary interface list.
5. Finalize minimal signal vocabulary for the spike.

### Phase 1 - Playground Skeleton

1. Create isolated playground area.
2. Create mock boundaries.
3. Create visual harness page.
4. Create diagnostics/debug output panel.

### Phase 2 - `GenericUnit` Proof

1. Implement lifecycle and state mutation behavior.
2. Implement signal input/output behavior.
3. Implement child registration.
4. Implement projection and snapshot generation.
5. Verify serializability and event traceability.

### Phase 3 - `View` Proof

1. Implement stage ownership.
2. Implement visible unit orchestration.
3. Implement child routing.
4. Implement aggregated projection.
5. Implement persistence/export request flow.
6. Implement XState stage machine.

### Phase 4 - Integration Proof

1. Connect Alpine actions to runtime signals.
2. Connect XState updates to projection refresh.
3. Connect external pricing/rules functions via machine actions/services.
4. Exercise async boundary success/error states.
5. Exercise child-to-parent and parent-to-child signaling.

### Phase 5 - Readiness Review

1. Review whether `Container` should extend `GenericUnit` directly or via a focused intermediary.
2. Review whether `Item` needs a machine-backed default or optional machine support.
3. Review whether current quotation shell can be adapted incrementally.
4. Review whether the same `View` contract can host validator and DB-form views.

## Success Definition

The spike is successful when all of the following are true:

- `GenericUnit` has a stable minimal contract
- `View` proves stage orchestration without quotation-specific assumptions
- Alpine renders from projection only
- XState handles transitions and side effects cleanly
- persistence/export/store/pricing/rules are injected boundaries
- all public runtime data is serializable
- unit signaling works in both directions
- the path to `Container` and `Item` now looks like specialization, not architecture discovery

## Main Risks And Mitigations

### Risk: `GenericUnit` becomes too abstract or too heavy

Mitigation:

- keep only shared runtime mechanics in the base class
- move business logic and specialized orchestration into subclasses or boundaries

### Risk: `View` becomes another monolithic shell

Mitigation:

- keep child registration and signal routing explicit
- keep UI projection separate from boundary implementations

### Risk: Alpine starts owning business truth again

Mitigation:

- Alpine reads projection and dispatches signals only
- all durable state remains in runtime units/machines

### Risk: XState contaminates the base contract too early

Mitigation:

- define machine integration as a runtime capability, not the entire identity of `GenericUnit`

### Risk: spike drifts into quotation-specific implementation

Mitigation:

- use generic sample units and mocked boundaries first
- defer quotation adaptation until after the playground passes

## Decision Gates After The Spike

After the `GenericUnit` + `View` playground passes, the next decision should be based on evidence:

1. If the contract feels stable, implement `Container` as recursive aggregation over `GenericUnit`.
2. If the contract is still unstable, refine the spike instead of adapting production code.
3. Only after that, adapt one real vertical slice, most likely the quotation editor shell.

## Immediate Next Artifact Set

The very next docs/specs to create from this plan should be:

1. `GenericUnit` contract draft
2. `View` contract draft
3. spike signal dictionary
4. playground projection schema
5. first playground scenario matrix
