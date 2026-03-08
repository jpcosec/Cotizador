# Design Strategy

## The Core Design Intent

The mixin system is built around *role taxonomy*. Before implementing a component, you declare its role. The role determines which capabilities the component needs. This is the opposite of deciding capabilities bottom-up per component — it ensures that components of the same role have identical structural contracts.

---

## Role Taxonomy

| Role | Description | Base class |
|------|-------------|------------|
| Domain leaf | A single priceable, ruleable, storable unit | `ItemBase` |
| Domain container | A collection manager that aggregates children and propagates context | `ContainerBase` |
| Modal controller | A dialog/wizard with form state, service access, and emitted events | `ModalControllerBase` |
| UI container | A stateful view that bridges an XState actor to Alpine rendering | `UIContainerBase` |
| Presentational view | A display-only component that emits events but holds no domain state | `ViewBase` |

Choosing the wrong role creates structural problems. A component that acts as a container but extends `ItemBase` will have pricing machinery with no children. A component that acts as a leaf but extends `ContainerBase` will have child management with no pricing.

---

## Composition as Declaration

The base class definition is the capability specification. Reading:

```js
class Item extends ItemBase { ... }
```

immediately tells you: this class can price, evaluate rules, receive inherited context, store to a database, bridge an actor, and sync to Alpine. You do not need to read the implementation to understand the contract.

This is the primary ergonomic benefit of pre-composed base classes over per-class mixin application. When a developer opens an unknown component file, the `extends XxxBase` line is the entire capability summary.

---

## The Injected-Function Design

Domain mixins define *slots* for behavior, not the behavior itself:

| Mixin | Slot | Type |
|-------|------|------|
| `Prizable` | `_pricingFn` | `(profile, pax, cantidad, duracion) => number` |
| `Rulable` | `_evaluator` | `(rule, context) => object | null` |
| `Actorlike` | `_actorRef` | XState actor reference |

This has three consequences:

1. **Testability** — Mixin tests use mock functions. The mixin's logic is tested in isolation without a domain setup, a running actor, or real rules.

2. **Substitutability** — The pricing algorithm can change without touching the `Item` class. The rule evaluator can be swapped for a different implementation per environment.

3. **Explicit wiring** — Nothing happens automatically. A component that has not received its pricing function calculates `null`. This is intentional: a component that fails silently is harder to debug than one that produces null and makes the missing dependency visible.

---

## The Propagation Model

Context flows down the tree. This is the primary data distribution mechanism.

```
ContainerBase.receiveContext(externalPatch)   ← environment enters here
ContainerBase.evaluateRules(evaluator)        ← container evaluates its own rules
ContainerBase.propagateContext(ruleOutputs)   ← merged context pushed to children
  → child.receiveContext(merged)              ← each child receives the patch
  → child.evaluateRules(evaluator)            ← each child evaluates its own rules
```

Key semantics:
- `receiveContext` is a **patch merge**, not a replacement. Existing keys in `_inheritedContext` survive unless the patch explicitly overwrites them.
- `propagateContext` merges the container's own `_inheritedContext` with the freshly computed `ruleOutputs` before pushing to children. Children therefore receive: base environment + container's rule results.
- Children apply their own rules on top of the received context, adding or overriding further.

This model means environment data (e.g., global pax count, date) set once at the root container automatically reaches all leaf items without any leaf needing to query for it.

---

## Chainable API Contract

All mutation methods return `this`. This is a load-bearing convention, not a style preference. It enables fluent construction and update sequences:

```js
item
  .setRules(rules)
  .receiveContext(globalContext)
  .evaluateRules(evaluator)
  .resolveQuantities(containerContext)
  .calculatePrice();
```

Without chaining, each of these would require a separate statement with no structural benefit. The pattern also makes the mutation order explicit and readable.

---

## What Subclasses Must Implement

Three methods throw at runtime if not overridden:

| Method | Required by | Error timing |
|--------|-------------|--------------|
| `toDisplayObject()` | `Alpineable` | When Alpine tries to render |
| `toStorageObject()` | `Storable` | When persistence is attempted |
| `validate()` | `Formable` | When form submission is attempted |

One method has a default implementation that subclasses *should* override:

| Method | Provided by | Default behavior |
|--------|-------------|-----------------|
| `_buildRuleContext()` | `Rulable` | Returns `{ ...this._inheritedContext }` |

Subclasses override `_buildRuleContext()` to enrich the evaluation context with their own state fields (e.g., the item's `_profile`, its own IDs, current quantities). The richer the context, the more conditional the rules can be.

---

## When to Add a New Mixin

Add a new mixin when:
- A capability is genuinely orthogonal — it could be meaningful on both domain and UI roles
- The capability has its own state fields that no existing mixin owns
- The capability is needed on 3 or more concrete components

Do not add a mixin for:
- Logic specific to a single component (put it in the component class)
- A helper utility with no instance state (use a plain function)
- A composition of two existing mixins (define a new base class instead)

---

## When to Add a New Base Class

Add a new base class when:
- A cluster of components shares a mixin composition that does not match any existing base
- You find yourself applying the same 3+ mixins in the same order in multiple concrete classes

Keep base classes thin — they should only contain the `extends` line. No methods, no fields, no logic.
