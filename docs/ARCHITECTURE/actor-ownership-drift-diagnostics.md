# Actor Ownership Drift Diagnostics

## Context

The architectural invariant for this rebuild is:

> Every component should be an actor-owned class.

This diagnostic captures where the implementation drifted from that invariant, when it happened, why it likely happened, and a safe path to converge.

Date: 2026-03-07

## Intended Invariant

Expected shape for each component:

1. Component class owns its XState actor internally.
2. Public methods delegate to actor events (not direct synchronous mutation pipelines).
3. Lifecycle ownership is local to the class (`start`, `stop`, subscriptions, cleanup).
4. Parent containers compose child classes through their actor-owned APIs.

## Observed Implementation (Current)

### Item

- `packages/components/item/Item.js` is a stateful class with private fields and synchronous `calculate()`.
- The class does not own an internal actor.
- Actor runtime exists outside the class in `packages/components/item/machine/itemMachine.js` (`createItemMachine`, `createItemActor`).

### Category, Catalog, BasketDay, Basket

- These layers are implemented as actor factory modules (`createXActor`) in machine files.
- They do not currently expose actor-owned classes as the primary API.

## Drift Timeline (Evidence)

### 2026-02-22

- Commit `7497f0e` introduces the "pure class + closure machine" pattern for Item.
- Commit message explicitly describes wrapping mutable `Item` in machine closure.

### 2026-03-01 to 2026-03-04

- DB integration and I-3 orchestration continue building on that split pattern.
- Container layers standardize around machine-level actor factories.

## Why the Drift Likely Happened

1. Delivery speed pressure during I-2 and I-3 favored direct class mutation + projection snapshots.
2. Strong emphasis on pure-domain testability encouraged keeping Item independent from actor runtime internals.
3. Playground/orchestrator work naturally centered around machine factories, which became de facto component entry points.
4. Documentation and implementation evolved in parallel without a single enforced architecture gate.

## Impact

1. Architectural mismatch: docs describe actor-owned classes while code often uses class+machine split or machine-only factories.
2. Lifecycle ambiguity: actor ownership is distributed, making cleanup contracts less uniform.
3. API inconsistency: some modules are class-first, others actor-factory-first.
4. Onboarding friction: engineers cannot infer one canonical component construction pattern.

## Decision Options

### Option A - Normalize docs to current split/factory reality

- Pros: minimal refactor, lower short-term risk.
- Cons: accepts architecture divergence from the intended invariant.

### Option B - Converge code to actor-owned classes (recommended if invariant is firm)

- Pros: consistent lifecycle model and component API across layers.
- Cons: requires staged refactor and compatibility wrappers during transition.

## Recommended Convergence Plan (Option B)

### Stage 1 - Freeze the target contract

Define one canonical component contract:

- `new Component(...)`
- internal actor creation/start
- event-driven public methods
- `getSnapshot()` / `toDisplayObject()`
- `stop()` and deterministic cleanup

### Stage 2 - Item migration with compatibility

1. Introduce actor ownership inside `Item` while preserving current public methods.
2. Re-implement `createItemActor()` as a compatibility wrapper over the actor-owned class.
3. Keep `toDisplayObject()` shape unchanged to avoid breaking category/basket bindings.

### Stage 3 - Container migration (Category -> Catalog -> BasketDay -> Basket)

1. Add actor-owned classes for each container component.
2. Keep existing `createXActor()` factories as thin adapters calling the class API.
3. Move teardown responsibilities into class-owned `stop()` methods.

### Stage 4 - Documentation and tests alignment

1. Update architecture/guides to one canonical pattern.
2. Add contract tests asserting actor ownership and lifecycle cleanup for every component.
3. Remove transitional wrappers only after all integration routes pass.

## Acceptance Criteria for "Drift Resolved"

1. Every component has an actor-owned class as the primary API.
2. Factory helpers are optional adapters, not the architecture center.
3. Lifecycle operations (`start`, `subscribe`, `stop`) are owned and documented per class.
4. Docs, plans, and implementation all describe the same pattern.

## Notes

This document is diagnostic only. It does not change runtime behavior.
