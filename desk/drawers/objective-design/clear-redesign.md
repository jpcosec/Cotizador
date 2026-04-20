# Clear Redesign

## Goal

Redesign the app into a GAS-compatible recursive architecture with explicit code abstractions.

The target chain is:

```text
AppShell
  -> View
    -> Container
      -> Container and/or Item
```

with side boundaries:

```text
Store
Persistence
Export
PricingEngine
RulesEngine
```

This redesign assumes:

- deployment stays on Google Apps Script
- Alpine remains the UI projection layer
- XState remains the orchestration/state mechanism where it already provides value
- current recursive lower-level units are preserved and formalized, not discarded

---

## 1. Final Architectural Shape

## 1.1 AppShell

`AppShell` is the top runtime entrypoint.

It owns:

- available views
- active view id
- global boundaries/capabilities
- handoff between views

It does **not** own domain editing logic.

### Responsibilities

- initialize boundaries (`Store`, `Persistence`, `Export`)
- choose and mount the active `View`
- route top-level navigation between views
- provide shell-level projection to Alpine

---

## 1.2 View

`View` is a real code abstraction.

It is the first orchestration unit above containers.

Examples of views:

- `HomeView`
- `NuevaCotizacionView`
- `EditorCotizacionView`
- `ValidadorView`
- `GenericDbFormView`
- `SpecificDbFormView`

### Responsibilities

- own `view_id`
- own ordered `stage_id`
- know which units are visible in the current stage
- route mutations/signals to child containers/units
- aggregate child projections into one view projection
- expose a serializable snapshot to Alpine

### Non-responsibilities

- no local pricing implementation
- no direct raw DB behavior
- no hidden global framework lifecycle

---

## 1.3 Container

`Container` is recursive.

Examples:

- `Catalog`
- `Category`
- `Basket`
- `BasketDay`

### Responsibilities

- hold child containers and/or items
- propagate context and mutations downward
- aggregate snapshots upward
- preserve local ordering/grouping semantics

### Non-responsibilities

- no sibling-global pricing computation
- no shell-level stage transitions

---

## 1.4 Item

`Item` remains the atomic commercial/runtime unit.

### Responsibilities

- own resolved definition
- own local context
- own overrides
- compute quantities locally
- compute pricing locally
- evaluate rules locally
- emit a serializable snapshot upward

### Non-responsibilities

- no aggregation of siblings
- no parent container orchestration

---

## 1.5 Store

`Store` becomes a first-class bounded facade.

Internally it may still use:

- resolver logic
- seed/database loaders
- persistence adapters
- serialization helpers

But externally it should read as one API.

### Responsibilities

- initialize/load from lower layer
- answer selective queries
- persist when requested

---

## 2. Runtime Rulebook

## 2.1 Alpine Rule

Alpine renders projections and forwards signals.

It must not become the source of truth.

### Allowed

- render current projection
- dispatch user signals
- hold tiny local UI-only state if purely visual

### Forbidden

- business truth in Alpine state
- direct cross-component mutation without runtime mediation

---

## 2.2 XState Rule

XState is used where orchestration and transitions matter.

Good fit:

- `View` stage flow
- recursive `Container` coordination
- persistence save/load lifecycle
- async loading transitions

It should not replace pure domain computation.

---

## 2.3 Pricing Rule

Pricing is local-first.

- `Item` computes from quantities
- `Container` aggregates child pricing outputs
- `View` aggregates container projections into stage-level summaries

---

## 2.4 Rules Rule

Rules may flow up and down.

- downward: context, enabled constraints, stage conditions
- upward: warnings, errors, activations, effects

Execution happens at the appropriate component boundary, usually item-local.

---

## 3. GAS-Compatible Code Shape

## 3.1 AppShell API

```js
const shell = createAppShell({
  views,
  boundaries: { store, persistence, exportPdf, exportExcel },
});

shell.initialize();
shell.openView('home');
shell.routeSignal({ type: 'OPEN_VIEW', viewId: 'editor_cotizacion' });
shell.getProjection();
```

### Notes

- explicit registration
- explicit boundaries
- projection must be serializable

---

## 3.2 View API

```js
const editorView = createView({
  id: 'editor_cotizacion',
  stages,
  boundaries: { store, persistence, exportPdf },
});

editorView.initialize(context);
editorView.registerUnit('catalog', catalogContainer);
editorView.registerUnit('basket', basketContainer);
editorView.transition({ type: 'NEXT_STAGE' });
editorView.routeSignal({ type: 'SET_CONTEXT', patch });
editorView.getProjection();
```

### Notes

- explicit child registration
- stage progression inside the view
- projection built from child projections

---

## 3.3 Container API

```js
const basket = createContainer({ id: 'basket', kind: 'basket' });

basket.initialize(context, { store, pricing, rules });
basket.registerChildContainer(day1);
basket.registerChildItem(itemA);
basket.applyMutation({ type: 'SET_CONTEXT', patch });
basket.aggregate();
basket.getProjection();
```

### Notes

- recursive
- explicit aggregation
- serializable projection

---

## 3.4 Item API

```js
const item = createItem({ definition, mode: 'basket' });

item.initialize(context, { pricing, rules });
item.applyMutation({ type: 'SET_OVERRIDE', key: 'pax', value: 40 });
item.computeQuantities();
item.computePricing();
item.evaluateRules();
item.getProjection();
```

### Notes

- all local
- deterministic
- no sibling awareness

---

## 3.5 Store API

```js
await store.initialize();
await store.getClient(id);
await store.getClients(filter);
await store.getItem(id);
await store.getFamily(id);
await store.getQuotation(id);
await store.searchQuotations(filter);
await store.persistQuotation(payload);
```

### Notes

- always explicit
- always serializable
- no whole-store dependency

---

## 4. Mapping Current Code Into The Redesign

## 4.1 What We Keep

- `Item` local computation model
- recursive container machine pattern
- persisted runtime wrapper pattern
- quotation lifecycle stage model

## 4.2 What We Rename / Regroup

### Current

- `createQuotationFlowComponent()`

### Target

- `AppShell` + concrete `View` instances

Meaning:

- split quotation-specific shell object into:
  - shell-level navigation/composition
  - quotation view orchestration

---

## 4.3 What We Introduce

- explicit `View` abstraction
- explicit `Container` abstraction
- explicit `Store` facade
- normalized signal vocabulary

---

## 5. Minimal Migration Strategy

## Phase A - Formalize, Don’t Rewrite

1. Introduce `Store` facade that wraps current resolver/persistence behavior.
2. Introduce `View` abstraction around current quotation flow without changing item/container internals.
3. Define normalized projection shape for `View`.

### Outcome

- current quotation flow still works
- shell/view separation becomes explicit

---

## Phase B - Normalize Recursive Containers

1. Extract shared `Container` contract from catalog/basket patterns.
2. Keep category/basket-day runtime logic, but expose through common container API.
3. Standardize child registration and aggregation behavior.

### Outcome

- recursion becomes an explicit architecture feature

---

## Phase C - Expand To Product Views

1. Implement additional views from `Vistas.md` using the same `View` abstraction.
2. Reuse shell/view contract across quotation, validator, and DB forms.

### Outcome

- final product surfaces share one outer-layer model

---

## 6. First Concrete Extraction

The first real extraction should be:

- build `QuotationEditorView` from the current `createQuotationFlowComponent()` responsibilities

Not:

- rewriting `Item`
- rewriting `Basket`
- rewriting `Catalog`

Why:

- lower layers are already structurally close to target
- outer layer is where the architecture is currently least explicit

---

## 7. Redesign Decision Summary

### Keep

- Alpine as projection layer
- XState where orchestration matters
- item-local pricing/rules
- recursive container composition

### Introduce

- `AppShell`
- reusable `View`
- reusable `Container` contract
- explicit `Store`

### Avoid

- framework-heavy routing assumptions
- hidden runtime discovery
- whole-store coupling
- upper-layer pricing logic

---

## 8. Final Statement

The clear redesign is:

```text
AppShell
  -> View
    -> Container
      -> Container and/or Item
```

with:

```text
Store / Persistence / Export as explicit side boundaries
Pricing / Rules as local computation boundaries
```

And with these rules preserved:

- Alpine projects
- XState orchestrates
- containers recurse and aggregate
- items compute locally
- store stays bounded
- GAS constraints dominate abstraction choices

This is the redesign that is both conceptually coherent and realistically deployable.
