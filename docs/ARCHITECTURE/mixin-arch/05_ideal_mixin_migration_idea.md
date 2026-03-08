# Ideal Mixin Architecture Migration Idea

## Why this proposal

We want one common architecture that:

1. Keeps mixins as reusable capability modules.
2. Enforces a single component contract across all components.
3. Introduces a clear scenario/context owner and an application flow owner.
4. Reuses the existing `packages/components/common/` foundation.

This document captures the idea and the expected effort.

---

## Core idea

Create a single root `ComponentBase` and build a tree of role-specific base classes from it.

Today, base classes are composed from `class {}`. The proposal is to compose them from `ComponentBase` so all components share the same lifecycle and identity contract.

### Target base tree

```text
ComponentBase
├─ DomainComponentBase
│  ├─ ItemBase
│  └─ ContainerBase
├─ UIComponentBase
│  ├─ ViewBase
│  ├─ UIContainerBase
│  └─ ModalControllerBase
└─ FlowComponentBase
   └─ AppFlowBase
```

Notes:

- `ItemBase`, `ContainerBase`, `ViewBase`, `UIContainerBase`, and `ModalControllerBase` keep using mixins.
- The only structural change is the root they extend from (`ComponentBase` instead of `class {}`).
- `FlowComponentBase` / `AppFlowBase` gives a dedicated home to app-level orchestration (instead of overloading modal/controller roles).

---

## Responsibilities by layer

## 1) `ComponentBase` (common ground)

Shared contract for all components:

- stable ids (`componentId`, `kind`, optional domain ids)
- lifecycle (`start()`, `stop()`, `destroy()`, `isStarted`)
- wiring hooks (`wireScenario()`, `wireActor()`)
- snapshot contract (`toDisplayObject()` abstract)
- cleanup registry for subscriptions/timers

## 2) Role base classes (capability bundles)

- `ItemBase`: actor + pricing + rules + storage + display contract
- `ContainerBase`: actor + child aggregation + rules propagation + storage + display contract
- `ViewBase`: display + event emission
- `UIContainerBase`: view + event + actor bridge
- `ModalControllerBase`: modal state + form state + service injection + events + display

## 3) Scenario/context layer

Introduce a scenario owner class (e.g., `ScenarioContext`):

- owns environment/session inputs (`paxGlobal`, `dia`, `hora`, etc.)
- applies patch updates
- broadcasts context changes to root container components
- can switch scenario profiles (browse, basket, validation) without rewriting components

## 4) App flow layer

Introduce `AppFlow` (or `AppFlowBase` + concrete `QuotationAppFlow`):

- owns stage transitions (`browse -> client -> basket -> validation -> completed`)
- owns active scenario and context policy
- coordinates root components (catalog, basket, quotation summary)
- replaces scattered runtime orchestration logic with a single, testable flow object

---

## How existing code is reused

Most reusable pieces already exist:

- mixins in `packages/components/common/mixins/`
- role base classes in `packages/components/common/base/`
- container actor orchestration patterns in `category`, `catalog`, `basket-day`, `basket`
- quotation flow stages already modeled in runtime logic

Migration focuses on:

1. adding `ComponentBase` and flow/scenario bases,
2. re-pointing existing base compositions to inherit from `ComponentBase`,
3. moving component entry points to class-first APIs,
4. keeping compatibility wrappers during transition.

---

## Effort estimate

Estimate assumes one engineer, preserving current behavior and tests.

## Phase A - Foundation (3 to 5 days)

- create `ComponentBase`, `FlowComponentBase`, `AppFlowBase`
- update existing base classes to compose from `ComponentBase`
- add composition/lifecycle contract tests

## Phase B - Core components alignment (7 to 12 days)

- Item migration to actor-owned class rooted in base tree
- Category, Catalog, BasketDay, Basket as class-first components (wrapping existing actor factories)
- keep `createXActor()` adapters for compatibility

## Phase C - Scenario and AppFlow extraction (4 to 7 days)

- extract `ScenarioContext` from app runtime code
- create concrete `QuotationAppFlow` class
- move stage and scenario transitions into flow class

## Phase D - Integration hardening (3 to 5 days)

- regression tests (unit + integration + e2e smoke)
- docs and contracts update
- deprecate obsolete wrappers

## Total

- **Fast path (minimal refactor):** 2 to 3 weeks
- **Full ideal alignment:** 3 to 5 weeks

---

## Recommended migration strategy

1. **Do not rewrite everything at once.** Build class-first APIs while preserving wrappers.
2. **Stabilize Item first.** It is the foundational leaf for all container components.
3. **Migrate containers in dependency order:** `category -> catalog -> basket-day -> basket`.
4. **Extract `AppFlow` last,** once component contracts are stable.
5. **Gate each phase with tests** before removing adapters.

---

## Risks and controls

Main risks:

- hidden behavior changes during class/factory migration
- dual-path confusion while wrappers coexist
- flow regressions in step-04 runtime

Controls:

- compatibility wrappers with explicit deprecation window
- contract tests for lifecycle, actor wiring, and `toDisplayObject()` shape
- scenario/flow tests for stage transitions and context propagation

---

## Decision checkpoint

If this direction is approved, the next artifact should be a file-by-file implementation checklist with acceptance criteria per phase, starting from `ComponentBase` and Item migration.
