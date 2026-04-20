# Google Apps Script Platform Constraints

## Why This Matters

This product is deployed to Google Apps Script.

That means architecture decisions must be filtered through a real platform boundary, not only through ideal component design.

The question is not just:

> What would be the cleanest abstraction?

It is also:

> What abstraction can actually run, bundle, render, and persist safely in GAS?

---

## Core Constraint

The deployable runtime is a GAS-hosted HTML app with generated assets.

So the system must favor:

- simple browser-side runtime contracts
- explicit generated artifacts
- stable serialization boundaries
- low-complexity bootstrapping

and avoid relying on patterns that require a richer app platform than GAS provides.

---

## Practical Platform Limits

### 1. No heavy client framework assumption

We should not design around a framework that needs:

- advanced client-side routing
- large hydration/runtime overhead
- complex build-time magic to function correctly

This is why Alpine + explicit runtime orchestration is a good fit.

### 2. HTML + generated includes are the real app shell

The app is ultimately delivered as generated GAS HTML fragments and `Code.gs`.

So abstractions must survive:

- bundling
- template generation
- local GAS shims
- Apps Script HTML service constraints

### 3. Persistence is remote and capability-shaped

Persistence is not just a local module call.

In the GAS target it becomes a boundary around:

- `google.script.run`
- Apps Script server functions
- Sheets-backed persistence

So persistence/export/store APIs must stay explicit and serializable.

### 4. Async boundaries matter more than ideal purity

Anything that may later cross into GAS server calls should already be modeled as a boundary:

- persistence
- store loading
- export generation
- diagnostic/admin tools if server-backed

### 5. Simpler composition beats clever runtime indirection

Because the app must be generated and run inside GAS, overly dynamic runtime composition can become fragile.

Prefer:

- explicit registration
- explicit stage/view definitions
- explicit child relationships

over hidden reflection or magical auto-discovery.

### 6. Serialized snapshots are a hard requirement

View, container, item, and store boundaries should always be able to reduce to plain serializable data.

That affects:

- UI projection contracts
- persistence payloads
- load/save cycles
- generated diagnostics/debug tools

---

## Architectural Consequences

### `View`

`View` can be a code abstraction, but it should stay:

- lightweight
- explicit
- serializable in its projection
- independent from framework-specific lifecycle tricks

Good fit:

- orchestrator object or actor-backed composition layer
- explicit stage model
- explicit child registration

Bad fit:

- router-heavy abstraction
- framework-dependent render lifecycle
- hidden global dependency injection magic

### `Container`

Recursive containers are fine, but they should be predictable.

Good fit:

- actor or object with explicit child registration
- plain snapshot output
- explicit upward aggregation

Bad fit:

- implicit mutation through shared ambient state
- non-serializable hidden closures as required public contract

### `Item`

The current item-local computation model is a strong fit for GAS because it keeps pricing/rules local and deterministic.

This should be preserved.

### `Store`

The store must remain a narrow boundary.

Good fit:

- `initialize()`
- explicit `getX()` / `searchX()` / `persistX()` methods
- payloads that can cross GAS boundaries safely

Bad fit:

- wide open object graph access
- implicit full-dataset coupling

---

## Design Rule For This Project

When deciding between two valid abstractions, prefer the one that is:

1. easier to serialize
2. easier to generate into GAS artifacts
3. easier to call across client/server boundary
4. easier to reason about without framework magic

That rule should override elegance when the two are in tension.

---

## Recommended Bias

For this project, bias toward:

- explicit contracts
- explicit state transitions
- explicit child hierarchies
- explicit boundaries
- plain-object projections

And bias away from:

- implicit framework behavior
- hidden dependency injection
- large dynamic runtime systems
- abstractions that are hard to express in generated GAS HTML/JS

---

## Bottom Line

Yes, the target architecture can still be sophisticated.

But it must be a **GAS-compatible sophistication**:

- Alpine-friendly
- XState-friendly
- serializable
- generated-artifact-friendly
- boundary-explicit

That platform reality should shape every future `View`, `Container`, `Store`, and persistence decision.
