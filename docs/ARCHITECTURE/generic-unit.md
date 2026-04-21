# Generic Unit

## Purpose

`GenericUnitBase` is the base runtime contract for the current redesign.

It exists to give every runtime node the same minimal behavior surface before specialization into:

- `GenericViewBase`
- `GenericContainerBase`
- `GenericItemBase`

The goal is not to hide differences between view, container, and item. The goal is to give them a shared runtime grammar that works with Alpine, XState, local preview, and GAS deployment.

## Location

- `src/components/common/base/runtime/GenericUnitBase.js`

Related files:

- `src/components/common/base/runtime/GenericViewBase.js`
- `src/components/common/base/runtime/GenericContainerBase.js`
- `src/components/common/base/runtime/GenericItemBase.js`
- `src/components/common/base/runtime/signals.js`

## What It Owns

`GenericUnitBase` owns shared runtime mechanics only.

It is responsible for:

- identity: `id`, `type`, parent/child references
- lifecycle: `initialize()` and `dispose()`
- local state mutation through `applyMutation()`
- signal input through `receiveSignal()`
- signal output through `emitSignal()`
- actor integration through `attachActor()`
- explicit boundary calls through `callBoundary()`
- serializable UI output through `getProjection()`
- serializable runtime output through `getSnapshot()`

It is not responsible for:

- quotation-specific orchestration
- recursive aggregation policy
- pricing logic
- business rules logic
- persistence implementation details

Those belong in subclasses or injected boundaries.

## Core Shape

The base class tracks a small set of shared runtime fields:

```js
{
  id,
  type,
  parent,
  children,
  boundaries,
  context,
  state,
  ui,
  status,
  visible,
  enabled,
  stage,
  derived,
  errors,
  warnings,
  boundaryStatus,
  lastSignal,
  signalHistory
}
```

These fields are intentionally plain-object friendly so they can cross:

- Alpine bindings
- XState actor sync
- persistence/debugging boundaries
- GAS deployment constraints

## Lifecycle

### `initialize(context, boundaries, initialState)`

Bootstraps the unit with:

- starting context
- injected boundaries
- initial local state

It marks the unit as `ready`, emits `UNIT_INITIALIZED`, and refreshes projection/snapshot output.

### `dispose()`

Stops actor subscriptions, clears actor references, marks the unit `disposed`, and refreshes outputs.

## Mutation Model

### `applyMutation(mutation)`

This is the base mutation entrypoint.

It can update:

- `context`
- `state`
- `ui`
- `derived`
- `boundaryStatus`
- `errors`
- `warnings`
- `status`
- `visible`
- `enabled`
- `stage`

After mutation it:

- records `lastSignal`
- appends to `signalHistory`
- emits `STATE_MUTATED`
- refreshes projection and snapshot

This makes every unit mutation observable and serializable.

## Signal Model

Signals are normalized runtime events that let units communicate without direct UI or storage coupling.

### `receiveSignal(signal)`

Accepts an incoming signal and does one of two things:

1. if the unit has an actor, forwards the event to that actor
2. otherwise handles base cases directly

Base handled signals include:

- `PATCH_CONTEXT`
- `SET_CONTEXT`
- `APPLY_MUTATION`
- `SET_UI`
- `SET_STATUS`
- `REQUEST_SNAPSHOT`
- `REFRESH_PROJECTION`

### `emitSignal(signal, target)`

Builds an outgoing envelope with `sourceId` and `sourceType`, records it, emits `SIGNAL_EMITTED`, resolves a target, and forwards the signal if possible.

### `resolveSignalTarget(target, targetId)`

Resolves signals to:

- a direct target unit
- a named child
- a sibling through the parent
- the parent itself

This is what lets the runtime support:

- parent-to-child routing
- child-to-parent bubbling
- sibling signaling through the shared tree

## Child Management

### `registerChild(unit, meta)`

Registers a child explicitly.

It also:

- sets parent linkage
- subscribes to child projection/snapshot updates
- stores child metadata
- emits `CHILD_REGISTERED`

This explicit registration pattern is important for GAS compatibility because it avoids hidden discovery or implicit object graph magic.

### `unregisterChild(unitId)`

Removes a child and emits `CHILD_UNREGISTERED`.

## Actor Integration

`GenericUnitBase` can host an XState actor, but it does not require one.

### `attachActor(actorRef)`

Attaches an actor and subscribes to actor snapshots through `onActorUpdate(snapshot)`.

This means subclasses can be:

- plain-object runtimes without a machine
- machine-backed runtimes with explicit actor behavior

That flexibility is what lets `GenericUnitBase` support both lightweight containers and richer specialized units.

## Boundary Model

External operations must cross explicit boundaries.

### `callBoundary(boundaryName, actionName, payload, options)`

This method:

- marks boundary status as `pending`
- calls the injected boundary handler
- reports success as `BOUNDARY_DONE` or applies success state directly
- reports failure as `BOUNDARY_ERROR` or applies error state directly

Typical boundary groups are:

- `persistence`
- `export`
- `pricing`
- `rules`
- `store`

This is one of the main GAS-driven design constraints: external work must stay explicit and payload-shaped.

## Projection vs Snapshot

### `getProjection()`

Projection is the UI-facing serializable shape.

It includes:

- id/type/status
- visibility and stage
- `state` and `context`
- UI fields
- child projections
- derived data
- errors and warnings
- boundary status
- last signal

Projection is what Alpine should render.

### `getSnapshot()`

Snapshot is the fuller runtime-facing serializable shape.

It includes:

- runtime state
- context
- UI state
- derived data
- error/warning state
- boundary status
- metadata
- last signal
- child ids

Snapshot is better for:

- persistence
- debugging
- diagnostics
- boundary payloads

## Specializations

### `GenericViewBase`

Adds:

- stage ownership
- visible-child filtering
- XState-backed orchestration
- boundary-driven save/export/pricing/rules/store flows

### `GenericContainerBase`

Adds:

- recursive aggregation
- aggregate totals/statuses
- context propagation
- bubbled child signal tracking

### `GenericItemBase`

Adds:

- item seed handling
- item machine hosting
- pricing/rules/item projection integration
- item-specific signals like override and mode changes

## Signal Vocabulary

The canonical runtime signal list is defined in:

- `src/components/common/base/runtime/signals.js`

Important base signals include:

- `APPLY_MUTATION`
- `SET_CONTEXT`
- `PATCH_CONTEXT`
- `SET_UI`
- `SET_STATUS`
- `REQUEST_SNAPSHOT`
- `REFRESH_PROJECTION`
- `BOUNDARY_DONE`
- `BOUNDARY_ERROR`

Specialized signals for view/item flows are also defined there.

## Why It Matters

`GenericUnitBase` is the architectural seam that made the runtime-first redesign possible.

It gives the system:

- a common lifecycle
- a common mutation grammar
- a common signal grammar
- a common serialization boundary
- a common way to host XState or remain lightweight

Without it, the quotation shell, playgrounds, and runtime subclasses would each drift into their own orchestration model.

## Working Rule

If a behavior belongs to every runtime node, it probably belongs in `GenericUnitBase`.

If it belongs only to orchestration, aggregation, or item-local business truth, it should stay in:

- `GenericViewBase`
- `GenericContainerBase`
- `GenericItemBase`

That separation is what keeps the base class useful without turning it into a god object.

## Related Docs

- `docs/ARCHITECTURE/current-architecture.md`
- `docs/DEPLOYMENT/Gas_workflow.md`
- `desk/drawers/objective-design/view-runtime-contract.md`
