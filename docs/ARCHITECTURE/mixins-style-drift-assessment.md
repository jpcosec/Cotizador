# Mixins and Style Drift Assessment

## Purpose

This document explains:

1. What problem mixins were designed to solve.
2. How that design addresses the current style-drift issue.
3. Which components should use which mixins/base classes.
4. How much drift we currently have per component versus an ideal mixin-integrated architecture.

Date: 2026-03-07

---

## Executive Summary

- The mixin system was built to enforce one reusable component style: composable capabilities, predictable APIs, and less duplication.
- The active I-2/I-3 runtime path drifted into machine-factory orchestration (`createXActor`) and standalone classes, so style became inconsistent across components.
- The quotation package still uses mixin-based base classes, but most Step-04 runtime behavior currently bypasses that package-level object model.
- Result: mixins exist and are partly used, but they do not currently govern the primary runtime architecture.

---

## Why Mixins Existed

Mixins were intended as behavior modules that can be composed into base classes:

- Domain: `Prizable`, `Aggregable`, `Rulable`, `Storable`
- UI: `Modalable`, `Formable`, `Eventable`, `Serviceable`, `Alpineable`, `Actorlike`

Then reused through base classes:

- `ItemBase`
- `ContainerBase`
- `ModalControllerBase`
- `UIContainerBase`
- `ViewBase`

Intended effect:

1. New components share the same shape.
2. Capabilities are explicit by composition.
3. Actor/UI/event contracts stay consistent.
4. Documentation and code evolve around one pattern.

---

## How Mixins Solve Style Drift

Style drift appears when each component invents its own lifecycle and API. Mixins reduce drift by turning style into code-level constraints:

1. **Role templates:** leaf domain, container domain, modal controller, UI container, presentational view.
2. **Capability bundles:** each role gets the same minimal behavior set.
3. **Stable public contracts:** `toDisplayObject()`, event surface, optional actor bridge are consistently present.
4. **Testable invariants:** base/mixin contract tests can fail quickly when a component diverges.

If adopted as canonical, mixins become the enforcement mechanism for style consistency.

---

## Current State of Use (Observed)

### Active core flow (I-2/I-3)

- `item` uses a standalone class (`Item`) plus external machine wrapper, not `ItemBase`.
- `category`, `catalog`, `basket-day`, `basket` are machine-actor factories, not mixin-based component classes.

### Quotation package

- Most quotation classes extend mixin-based base classes (`ViewBase`, `UIContainerBase`, `ModalControllerBase`).
- However, active Step-04 playground runtime is assembled in `apps/quotation/state/createQuotationInternalRuntime.js` from catalog/basket actors, bypassing most package quotation classes.

---

## Target Mapping: Which Components Should Use Which Mixins

## Core Components

| Component | Role | Recommended Base | Effective Mixins |
|---|---|---|---|
| `item` | Domain leaf actor component | `ItemBase` | `Actorlike + Prizable + Rulable + Storable + Alpineable` |
| `category` | Domain container actor component | `ContainerBase` | `Actorlike + Aggregable + Rulable + Storable + Alpineable` |
| `catalog` | Domain container actor component | `ContainerBase` | `Actorlike + Aggregable + Rulable + Storable + Alpineable` |
| `basket-day` | Domain container actor component | `ContainerBase` | `Actorlike + Aggregable + Rulable + Storable + Alpineable` |
| `basket` | Domain container actor component | `ContainerBase` | `Actorlike + Aggregable + Rulable + Storable + Alpineable` |

## Quotation Components

| Component Group | Role | Recommended Base | Effective Mixins |
|---|---|---|---|
| `quotation/modals/*` (initializer/selectors/viewers) | Modal controllers | `ModalControllerBase` | `Modalable + Formable + Serviceable + Eventable + Alpineable` |
| `quotation/views/QuotationView`, `quotation/views/Sidebar`, `quotation/views/Catalog`, `quotation/views/Basket` | UI containers | `UIContainerBase` | `Actorlike + Eventable + Alpineable` |
| `quotation/views/*` presentational (`DayTabs`, `DayAccordion`, `ItemAccordion`, `CatalogItemCard`, `CategoryGroup`, `QuotationHeader`, `QuotationTotals`, `ValidationSummary`, `CompletionSuccess`, `HomePage`) | Presentational views | `ViewBase` | `Eventable + Alpineable` |
| `quotation/modals/AppState` | Flow state controller | **New base recommended** (`FlowControllerBase`) | `Actorlike + Eventable + Serviceable + Alpineable` |

Note: `AppState` currently extends `ModalControllerBase`, which is semantically mismatched (it is flow state, not a modal/form controller).

---

## Drift Scoring Method

Drift score: `0` (no drift) to `100` (severe drift).

Each component gets up to 25 points in each deficit dimension:

1. **Mixin integration deficit** (expected base/mixins not used)
2. **Actor ownership deficit** (actor not owned by the component class)
3. **Runtime path deficit** (component exists but is bypassed in active flow)
4. **API/style deficit** (public surface diverges from canonical style)

Total drift = sum of the four deficits.

---

## Drift by Component (Current)

| Component | Mixin Deficit | Actor Deficit | Runtime Deficit | API Deficit | Drift Total |
|---|---:|---:|---:|---:|---:|
| `item` | 25 | 20 | 0 | 10 | **55** |
| `category` | 25 | 25 | 0 | 20 | **70** |
| `catalog` | 25 | 25 | 0 | 20 | **70** |
| `basket-day` | 25 | 25 | 0 | 20 | **70** |
| `basket` | 25 | 25 | 0 | 20 | **70** |
| `quotation` (package overall) | 5 | 15 | 25 | 15 | **60** |

Interpretation:

- `0-20`: aligned
- `21-40`: minor drift
- `41-60`: moderate drift
- `61-80`: high drift
- `81-100`: severe drift

Current system has moderate-to-high drift in all core runtime components.

---

## Quotation Package Internal Breakdown

| Quotation Subsystem | Drift | Notes |
|---|---:|---|
| `modals/AppState` | **75** | Uses mixin base but wrong role; no actor ownership; mostly outside active step-04 runtime path |
| `modals/*` (excluding `AppState`) | **50** | Good mixin alignment, but not primary runtime path right now |
| `views/UI containers` | **50** | Base alignment good; actor bridge is mostly not exercised in active runtime |
| `views/presentational` | **30** | Mostly aligned to `ViewBase`; lower drift than stateful layers |

---

## What to Fix First (to reduce drift fastest)

1. Convert `item` to actor-owned class while preserving `toDisplayObject()` and compatibility wrappers.
2. Introduce class APIs for `category`, `catalog`, `basket-day`, `basket` and keep current `createXActor()` functions as temporary adapters.
3. Re-classify `quotation/modals/AppState` to a flow-state base (not modal base).
4. Decide whether Step-04 runtime should be package-first (recommended) or remain app-runtime-first; align docs and ownership to that decision.

---

## Conclusion

Mixins are the right mechanism to stop style drift, but they are not currently the controlling architecture for the active runtime path. To resolve drift, mixins/base classes must become the canonical entry point for core components, with actor ownership inside those classes and adapters only for backward compatibility.
