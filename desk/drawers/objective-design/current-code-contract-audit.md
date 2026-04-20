# Current Code Contract Audit

## Scope

This audit compares the current codebase against the explicit architecture contracts in this folder:

- `view-runtime-contract.md`
- `runtime-interfaces.yaml`
- `store-contract.md`
- `aggregation-rules.md`
- `signal-vocabulary.md`

Primary files reviewed:

- `gas/scripts/createQuotationFlowComponent.js`
- `src/state/createQuotationInternalRuntime.js`
- `src/state/createPersistedQuotationRuntime.js`
- `src/components/catalog/machine/catalogMachine.js`
- `src/components/basket/machine/basketMachine.js`
- `src/components/item/Item.js`

---

## Executive Read

The current code already aligns well with the recursive runtime idea at the lower levels:

- `Item` is close to the intended atomic unit.
- `Catalog` and `Basket` already behave like recursive containers.
- `createQuotationInternalRuntime()` behaves like the orchestration layer above containers.
- `createPersistedQuotationRuntime()` behaves like the persistence-aware wrapper above that.

The main mismatch is the outer layer:

- `createQuotationFlowComponent()` is still a large Alpine-facing shell object, not a reusable `View` abstraction.
- store behavior exists, but is fragmented across runtime/bootstrap, resolver/database modules, and persistence adapters.
- signal vocabulary exists in practice, but is not yet normalized across layers.

So the architecture is **closest to the target in the middle and lower layers**, and **furthest from the target at the outer shell/bounded-store layer**.

---

## 1. `View` Contract Audit

### Expected

`View` should be the first orchestration layer above containers:

- own stage/view state
- coordinate visible units
- route mutations/signals downward
- aggregate child state upward
- remain distinct from pricing and persistence internals

### Current Approximation

Current equivalent:

- `gas/scripts/createQuotationFlowComponent.js`

### What Fits

- It clearly owns outer-layer stage state: `browse`, `client`, `basket`, `validation`, `completed`.
- It coordinates visible child surfaces through:
  - `sidebar`
  - `timeline`
  - `itemList`
  - `modals`
- It subscribes to runtime snapshots and projects them into UI state.
- It acts as the shell-level entrypoint for:
  - save/load
  - export
  - client flow
  - validation flow

### What Does Not Fit Yet

- It is still written as a monolithic Alpine object, not a reusable `View` class/component.
- It mixes:
  - stage orchestration
  - UI projection
  - environment capability handling
  - export wiring
  - modal/search behavior
- It does not expose a formal child registration contract; children are hard-wired through direct construction.
- It is quotation-specific rather than a general `View` abstraction usable by other future views.

### Audit Result

- status: `partial`
- summary: functionally acting as a `View`, structurally not yet implemented as one.

---

## 2. `Container` Contract Audit

### Expected

Containers:

- may contain containers and/or items
- receive mutations/context from above
- propagate context downward
- aggregate child state upward

### Current Approximations

- `src/components/catalog/machine/catalogMachine.js`
- `src/components/category/machine/categoryMachine.js`
- `src/components/basket/machine/basketMachine.js`
- `src/components/basket-day/machine/basketDayMachine.js`

### What Fits

- `Catalog` contains `Category` runtimes.
- `Category` contains `Item` runtimes.
- `Basket` contains `BasketDay` runtimes.
- `BasketDay` contains `Item` runtimes.
- `Catalog` and `Basket` both propagate shared context downward with `SET_CONTEXT`.
- Both aggregate child runtime snapshots upward into projections/summaries.
- This already validates the recursive container rule:

```text
Catalog -> Category -> Item
Basket -> BasketDay -> Item
```

### What Does Not Fit Yet

- There is no explicit shared `Container` abstraction in code.
- Recursion exists by pattern, not by formal reusable contract.
- Container APIs are still machine-specific rather than normalized.

### Audit Result

- status: `real by pattern, missing common abstraction`
- summary: the architecture exists in practice, but not yet as a reusable container interface.

---

## 3. `Item` Contract Audit

### Expected

`Item` should:

- own local definition/context/overrides
- compute quantities locally
- compute pricing locally from quantities
- evaluate rules locally
- emit results upward

### Current Implementation

- `src/components/item/Item.js`
- plus machine/runtime wrapper around it

### What Fits

- `Item` owns:
  - `definition`
  - `externalContext`
  - `overrides`
  - `userSetFields`
- `Item.calculate()` computes local derived values.
- Quantity resolution, schedule resolution, pricing, and rules all happen at item level.
- `Item` does not aggregate sibling totals.
- This strongly matches the target “local-first pricing” rule.

### What Does Not Fit Yet

- Signals are not exposed through a formal item contract doc in code; they are mediated by machines and runtime helpers.
- The local item API is object-method based and machine-wrapped, rather than explicitly contract-driven.

### Audit Result

- status: `strong`
- summary: `Item` is the closest unit in the repo to the intended architecture.

---

## 4. Aggregation Rule Audit

### Expected

- item computes
- container aggregates
- view coordinates

### What Fits

- `Item` computes totals and rule state locally.
- `Category`, `Catalog`, `BasketDay`, and `Basket` aggregate child projections upward.
- `createQuotationInternalRuntime()` aggregates container state into app-level snapshot and validation projection.

### Current Tension

- `buildValidationProjection()` inside `createQuotationInternalRuntime.js` performs a view/read-model aggregation directly in runtime.
- This is acceptable as app-level aggregation, but it means the validation/read-model is not yet its own explicit unit contract.

### Audit Result

- status: `mostly aligned`
- summary: the core aggregation rule is already present.

---

## 5. `Store` Contract Audit

### Expected

The store should behave as a bounded facade:

- initialize from lower layer
- load on explicit request
- answer selective queries
- persist when asked

### Current Reality

Store-like behavior is split across:

- database resolver/seed modules
- runtime bootstrapping
- persistence adapters
- serialization/hydration helpers

### What Fits

- persistence is adapter-based in `createPersistedQuotationRuntime()`.
- runtime loading uses explicit calls (`loadQuotation`, listing/search functions).
- data access in containers is already selective in practice (category/item/day specific).

### What Does Not Fit Yet

- there is no single explicit `Store` facade in code.
- query responsibilities are fragmented.
- initialization/loading semantics are implicit across modules instead of captured in one interface.

### Audit Result

- status: `split`
- summary: the behavior exists, the abstraction does not.

---

## 6. Signal Vocabulary Audit

### Expected

Signal families should be explicit and reusable across layers.

### What Fits

- the code already uses meaningful machine events like:
  - `SET_CONTEXT`
  - `SET_ENTRY_OVERRIDE`
  - `REMOVE_ENTRY`
  - `SHIP_ITEM`
  - `SELECT_DAY`
  - `CONFIRM_SAVE`
  - `LOAD_DONE`
  - `SAVE_DONE`
- these strongly resemble the intended vocabulary.

### What Does Not Fit Yet

- naming is local to specific machines and runtimes.
- there is no shared canonical signal dictionary enforced across layers.
- some flow is still expressed through direct method calls instead of normalized signal routing.

### Audit Result

- status: `partial`
- summary: a real vocabulary exists, but it is not normalized project-wide.

---

## 7. Biggest Mismatches Against Target

### A. Missing reusable `View` code abstraction

Current shell logic behaves like a `View`, but the abstraction is not explicit yet.

### B. Missing reusable `Container` code abstraction

Recursive containers exist, but only as repeated machine patterns.

### C. Store is fragmented

Behavior is there, but the facade is missing.

### D. Outer-layer view families are broader than current code

The future product map from `Vistas.md` is larger than the current quotation-focused shell.

---

## 8. What Is Already Strong Enough To Reuse

- `Item` local computation model
- recursive container composition pattern
- persisted runtime wrapper pattern
- stageful quotation lifecycle model

These are the parts most worth preserving when introducing explicit `View` / `Container` abstractions.

---

## 9. Recommended Implementation Order

1. Extract a reusable `View` abstraction from `createQuotationFlowComponent()`.
2. Define a shared `Container` interface over the existing recursive machine pattern.
3. Introduce an explicit `Store` facade that wraps current resolver/persistence pieces.
4. Normalize signal names across view/container/item/runtime boundaries.
5. Recast validation as a first-class unit instead of only a runtime projection.

---

## 10. Bottom Line

The current codebase is **not far from the intended architecture**.

The most important observation is this:

- the recursive runtime idea already exists in code
- the atomic pricing idea already exists in code
- the missing pieces are mostly explicit outer-layer abstractions and contracts

So the architecture gap is real, but it is mainly a gap of **formalization and regrouping**, not a total rebuild.
