# Mixin System Overview

## What Is a Functional Mixin?

A functional mixin is a higher-order function that accepts a base class and returns a new class that extends it with additional methods and fields. Unlike classical inheritance (`extends SomeConcreteClass`), mixins add capabilities orthogonally — any class can receive any mixin regardless of its existing ancestry. The mixin owns its fields and methods; the base it wraps is irrelevant to its logic.

```js
// Pattern
const WithCapability = (Base) => class extends Base {
  /* methods and fields */
};

// Composition (applied innermost first)
class MyClass extends WithCapabilityC(WithCapabilityB(WithCapabilityA(class {}))) {}
```

---

## The Two Capability Layers

| Layer  | Mixins                                                  | Concern                                                                  |
|--------|---------------------------------------------------------|--------------------------------------------------------------------------|
| Domain | `Prizable`, `Aggregable`, `Rulable`, `Storable`         | Business calculations, quantity resolution, rule evaluation, persistence |
| UI     | `Actorlike`, `Alpineable`, `Eventable`, `Formable`, `Modalable`, `Serviceable` | Actor wiring, view sync, DOM events, form state, dialogs, service injection |

---

## How Each Mixin Works

### Domain Mixins

**`Prizable(Base)`**
Adds three user-settable quantity fields — `pax`, `cantidad`, `duracion` — each with a corresponding `IsUserSet` flag and a `_default*` fallback. Provides:
- `resolveQuantities(containerContext)` — resolves each quantity using the precedence chain: user value → container-provided value → `_inheritedContext` value → item default
- `calculatePrice()` — calls the injected `_pricingFn(profile, pax, cantidad, duracion)` and stores the result in `_price`
- `setUserQuantity(field, value)` — sets a quantity as user-specified and immediately recalculates price
- `displayPrice` getter — price divided by pax (per-person view)
- `total` getter — raw `_price` value (used by `Aggregable`)

Depends on `this._inheritedContext` being present. This field is provided by `Rulable`. If composed without `Rulable`, `resolveQuantities` falls back to `{}` silently.

`Prizable` is item/leaf-oriented. Day, basket, and future kit pricing should be derived through aggregation layers, not by reusing leaf quantity semantics directly.

---

**`Aggregable(Base)`**
Adds `_children` as a `Map` keyed by child id. Provides:
- `addChild(id, child)` / `removeChild(id)` / `getChild(id)` / `getChildren()`
- `aggregate()` — iterates children, resolves each child's total (via `.aggregate().subtotal` for nested containers, `.total` for leaves, `._price` as fallback), and stores `{ subtotal, breakdown }` in `_aggregateResult`
- `subtotal` getter — last aggregated subtotal

`Rulable.propagateContext()` iterates `this._children` — so `Aggregable` must appear below `Rulable` in the composition chain for propagation to work on containers.

Flow model summary:

- Downward flow: context and rule effects travel parent -> child (`Rulable.propagateContext`).
- Upward flow: totals, warnings, and errors travel child -> parent (`Aggregable.aggregate`).

---

**`Rulable(Base)`**
Adds rule state (`_rules`, `_appliedRules`) and the inherited context bag (`_inheritedContext`). Provides:
- `setRules(rules)` — stores the rule array for later evaluation
- `receiveContext(patch)` — merges a patch into `_inheritedContext` (non-destructive; existing keys survive unless overwritten)
- `evaluateRules(evaluator?)` — iterates `_rules`, calls `evaluator(rule, context)` for each active rule, accumulates `_appliedRules`. Non-accumulating rules (`Acumulable === false`) stop evaluation after the first match.
- `propagateContext(ruleOutputs)` — merges `_inheritedContext` with `ruleOutputs`, then calls `receiveContext(merged)` on each child in `this._children`
- `getAppliedRules()` — returns a shallow copy of applied rules
- `_buildRuleContext()` — returns `{ ...this._inheritedContext }` by default; subclasses override to add their own fields to the evaluation context

The evaluator is passed at call time, not stored. This keeps the rule evaluation algorithm external and swappable.

---

**`Storable(Base)`**
Adds database identity fields: `ID_Linea`, `ID_Item`, `ID_Categoria`, `ID_Cotizacion`. Provides:
- `toStorageObject()` — throws until implemented by the concrete class
- `fromStorageObject(...)` — expected as a concrete class-level constructor/factory counterpart
- `markDirty()` / `markClean()` — dirty tracking via `_isDirty`
- `hasStorageIdentity()` — true if any ID field is non-null
- `isSaved()` — true if not dirty and has identity

---

### UI Mixins

**`Actorlike(Base)`**
Wraps an XState actor reference (`_actorRef`). Provides:
- `setActorRef(ref)` — stores the actor; accepts `null` to detach
- `sendEvent(type, payload)` — calls `_actorRef.send({ type, ...payload })`; no-ops silently if no actor is set
- `getSnapshot()` — delegates to `_actorRef.getSnapshot()`
- `subscribe(callback)` — delegates to `_actorRef.subscribe(callback)`; returns the subscription (caller owns cleanup)
- `hasActorRef` getter

All methods fail safe when `_actorRef` is null.

---

**`Alpineable(Base)`**
A single-method contract. Provides:
- `toDisplayObject()` — throws at runtime until implemented by the concrete class

This is the Alpine.js synchronization boundary. Alpine templates call `toDisplayObject()` to get a flat snapshot of all state needed for rendering.

---

**`Eventable(Base)`** 
Observer/emitter. Provides:
- `on(eventName, callback)` — registers a listener
- `emit(eventName, data)` — calls all registered listeners for the event
- `off(eventName, callback)` — removes a specific listener by reference

Backed by `_listeners = {}`, a plain object keyed by event name.

---

**`Formable(Base)`**
Form state and validation scaffold. Provides:
- `setField(name, value)` — updates `_formState`, clears any existing error for that field
- `getField(name)` / `getFormState()`
- `validate()` — throws until implemented by the concrete class
- `setFieldError(name, error)` / `getFieldError(name)` / `getFormErrors()`
- `hasErrors()` / `clearFormErrors()`

---

**`Modalable(Base)`**
Dialog lifecycle. Provides:
- `open()` / `close()` / `isOpen()`
- `setLoading(value)` / `isLoading()`
- `addError(message)` / `getErrors()` / `clearErrors()`

---

**`Serviceable(Base)`**
Service locator. Provides:
- `injectService(name, service)` — registers a named service
- `getService(name)` — retrieves by name; `undefined` if absent
- `hasService(name)` — presence check

Backed by `_services = {}`.

---

## The Five Base Classes

These are the pre-composed entry points. Concrete components extend exactly one.

```js
// Domain
ItemBase      = Alpineable(Storable(Rulable(Prizable(Actorlike(class {})))))
ContainerBase = Alpineable(Storable(Rulable(Aggregable(Actorlike(class {})))))

// UI
ModalControllerBase = Alpineable(Eventable(Serviceable(Formable(Modalable(class {})))))
UIContainerBase     = Alpineable(Eventable(Actorlike(class {})))
ViewBase            = Alpineable(Eventable(class {}))
```

Each base class is a fixed composition. Concrete classes only need to extend the appropriate base and implement the abstract methods (`toDisplayObject`, `toStorageObject`, `validate`).

Current usage reality:

- `ModalControllerBase`, `UIContainerBase`, and `ViewBase` are used by quotation modal/view classes.
- The `Item` runtime class follows a standalone pattern and does not currently extend `ItemBase`.
- Container runtimes (`category`, `catalog`, `basket-day`, `basket`) are actor-first modules and do not currently rely on `ContainerBase`.

---

## Composition Order and Implicit Dependencies

The order in which mixins appear matters — innermost is applied first, outermost is applied last and sits highest in the prototype chain.

```
Alpineable              ← outermost (highest in prototype chain)
  Storable
    Rulable             ← provides _inheritedContext read by Prizable
      Prizable          ← reads _inheritedContext (initialized by Rulable)
        Actorlike       ← innermost
          class {}      ← empty root
```

Two implicit dependencies exist between domain mixins:

1. **Prizable → Rulable**: `resolveQuantities()` reads `this._inheritedContext`. This field is initialized to `{}` by `Rulable`. Without `Rulable` in the chain, `_inheritedContext` is `undefined` and falls back via `?? {}` — correct behavior, but only by accident.

2. **Rulable → Aggregable** (containers only): `propagateContext()` iterates `this._children?.values?.()`. `_children` is a `Map` initialized by `Aggregable`. On an item (no `Aggregable`), `this._children` is `undefined`, the optional chain returns `undefined`, and the loop is skipped — again, correct by accident, not by design.

These dependencies are **not enforced** at composition time. The base classes pair the right mixins by convention.
