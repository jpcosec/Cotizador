# Runtime Signals

## Purpose

This document explains the runtime signal vocabulary defined in:

- `src/components/common/base/runtime/signals.js`

Signals are the shared event grammar for the generic runtime layer.

They are used to:

- mutate runtime state
- route intent between units
- trigger actor transitions
- coordinate boundaries
- keep Alpine and runtime orchestration decoupled

## Why Signals Exist

The generic runtime needs one explicit language that works across:

- `GenericUnitBase`
- `GenericViewBase`
- `GenericContainerBase`
- `GenericItemBase`
- Alpine event handlers
- XState actors

Without a shared signal vocabulary, each layer would invent its own incompatible event names and routing assumptions.

## Signal Families

## Lifecycle Signals

- `INITIALIZE`
- `RESET`
- `DISPOSE`

Use these when a unit lifecycle must be started, reset, or torn down.

## Projection and Snapshot Signals

- `REFRESH_PROJECTION`
- `REQUEST_SNAPSHOT`

Used when current serializable outputs should be refreshed or requested explicitly.

## Mutation Signals

- `APPLY_MUTATION`
- `SET_CONTEXT`
- `PATCH_CONTEXT`
- `SET_UI`
- `SET_STATUS`

These are the core state-change signals used by `GenericUnitBase`.

General rule:

- `PATCH_CONTEXT` merges into current context
- `SET_CONTEXT` replaces context semantics where subclasses need that behavior
- `APPLY_MUTATION` is the broad mutation envelope for state, derived data, UI, and status

## Registration and Child Signals

- `REGISTER_UNIT`
- `UNREGISTER_UNIT`
- `CHILD_SIGNAL`
- `CHILD_UPDATED`
- `SNAPSHOT_UPDATED`
- `PROJECTION_UPDATED`

These signals support runtime trees.

Typical uses:

- a `View` records child feedback through `CHILD_SIGNAL`
- a `Container` bubbles nested child activity upward
- projection and snapshot refreshes stay observable

## View and Stage Signals

- `OPEN_VIEW`
- `ENTER_STAGE`
- `NEXT_STAGE`
- `PREVIOUS_STAGE`

These are primarily `View`-level orchestration signals.

They are used by `GenericViewBase` to drive stage ownership and visible-unit behavior.

## Boundary Signals

- `REQUEST_SAVE`
- `REQUEST_LOAD`
- `REQUEST_EXPORT`
- `REQUEST_PRICING`
- `REQUEST_RULES`
- `REQUEST_STORE`
- `BOUNDARY_DONE`
- `BOUNDARY_ERROR`

These are used when runtime state crosses into external adapters or services.

The usual pattern is:

```text
REQUEST_* -> boundary call -> BOUNDARY_DONE or BOUNDARY_ERROR
```

This is especially important for GAS compatibility because client/server work must stay explicit and serializable.

## Item-Specific Signals

- `SET_OVERRIDE`
- `CLEAR_OVERRIDE`
- `RESET_OVERRIDES`
- `SET_PROFILE_VALUE`
- `SET_DEFAULT_QUANTITY`
- `CLEAR_DEFAULT_QUANTITY`
- `SET_MODE`

These are mainly consumed by `GenericItemBase`, which maps them onto the real item actor and item machine.

## Helper

`createRuntimeSignal(type, payload)` is a small convenience helper for building signal envelopes.

## Working Rules

### Rule 1

If a signal is intended to be shared by multiple runtime unit types, define it in `signals.js`.

### Rule 2

If a UI action changes runtime truth, it should dispatch a signal rather than mutating Alpine state directly.

### Rule 3

If an operation crosses into persistence, export, store, rules, or pricing, prefer a `REQUEST_*` signal instead of direct hidden calls.

### Rule 4

If a signal name is only meaningful inside a single private actor and never crosses the runtime boundary, it does not have to be promoted into `signals.js`.

## Most Important Signals In Practice

For current day-to-day work, the most important signals are:

- `APPLY_MUTATION`
- `PATCH_CONTEXT`
- `SET_CONTEXT`
- `ENTER_STAGE`
- `NEXT_STAGE`
- `PREVIOUS_STAGE`
- `REQUEST_SAVE`
- `REQUEST_EXPORT`
- `REQUEST_PRICING`
- `REQUEST_RULES`
- `REQUEST_STORE`
- `BOUNDARY_DONE`
- `BOUNDARY_ERROR`
- `SET_OVERRIDE`
- `SET_MODE`

These are the signals most likely to appear in runtime integration and Alpine wiring.

## Related Docs

- `docs/ARCHITECTURE/generic-unit.md`
- `docs/ARCHITECTURE/current-architecture.md`
