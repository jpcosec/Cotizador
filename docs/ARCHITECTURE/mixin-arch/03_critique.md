# Architectural Critique

## Functional Mixin Composition as a Strategy in JavaScript

This document evaluates functional mixin composition as a pure architectural decision. No references to specific implementations or project state are made.

---

## What the Pattern Correctly Solves

**Avoids the diamond problem.** Multiple inheritance in class-based languages creates ambiguity when two superclasses define the same method. Functional mixins sidestep this entirely: each mixin is applied in a declared order, each extends the one below it, and method resolution is always unambiguous (the outermost definition wins).

**Capability declaration at the definition site.** Reading `class Foo extends Alpineable(Storable(Rulable(Prizable(Actorlike(class {})))))` conveys the full capability set without reading any implementation. This is a significant readability advantage over patterns where capabilities are accumulated via decorators, composition objects, or manual property assignment.

**Independent mixin testability.** Each mixin can be applied to a hand-crafted empty class and tested in isolation. No domain setup, no actor, no real rules engine. The test surface is small and the failure surface is narrow.

**No framework dependency.** The pattern uses plain ES2022 class fields and prototype chain mechanics. It works in any JavaScript environment — browser, Node, Deno, GAS — without a runtime library, bundler plugin, or transpiler step beyond what the project already requires.

**Role taxonomy decouples "what kind of thing" from "what it can do."** Categorizing components by role (leaf, container, modal, view) before assigning capabilities prevents ad hoc composition — where each component accumulates whatever mixins seem useful in the moment.

---

## Prototype Chain Depth and Its Costs

Each mixin application creates one additional link in the prototype chain. Five mixins applied to an empty class produces a six-level chain before `Object.prototype`. Modern JS engines (V8, SpiderMonkey, JavaScriptCore) optimize long chains well, so runtime performance is not a meaningful concern. The costs are tooling and debugging costs.

**`instanceof` is unreliable across module boundaries.** If a mixin is imported from two different module instances (e.g., two bundled copies of the same package), `instanceof` checks against the anonymous inner class return false even when the object was created with the "same" mixin. Anonymous inner classes make this especially hard to diagnose.

**Stack traces show anonymous class names.** Each `(Base) => class extends Base { ... }` produces an anonymous class. When an error originates in a mixin method, the stack trace shows the anonymous wrapper name (often an empty string or the variable name at the assignment site), not the component's name. Debugging across a five-deep chain of anonymous classes is tedious.

**`constructor.name` is not reliable.** The concrete class has a name, but intermediate anonymous classes do not. Tooling that uses constructor names for display or serialization may behave unexpectedly on mixin-composed objects.

---

## Implicit Inter-Mixin Dependencies: The Hidden Coupling Problem

This is the most serious structural risk in the pattern.

**The Prizable → Rulable dependency.** A pricing mixin's quantity resolution reads an inherited context field that is initialized and managed by a separate rules mixin. There is no declaration of this dependency anywhere in the pricing mixin's interface. If an engineer applies the pricing mixin without the rules mixin, the missing field resolves to a safe default — and the component behaves incorrectly in a way that produces no error and may not be detected until runtime.

**The container propagation dependency.** A rules mixin's propagation method iterates a children collection that is initialized and managed by a separate aggregation mixin. On a leaf (no aggregation mixin), the optional chain produces `undefined` and the loop is silently skipped — correct behavior on a leaf, but the absence of a runtime error means the dependency is invisible. If propagation were expected on the leaf for some reason, there would be no diagnostic output.

The system works correctly today because the base class compositions happen to always pair the right mixins. This is a convention, not a contract. Future developers composing new base classes — or applying mixins directly to concrete classes — have no mechanical guardrail to prevent silent miscomposition.

---

## The Composition Order Problem

The order `Outer(Middle(Inner(Base)))` determines which class is higher in the prototype chain. In most cases, order does not affect observable behavior — each mixin adds distinct fields and methods. But it matters when:

- Two mixins both initialize a field with the same name (last one applied wins at prototype level, but instance-field initialization in class bodies runs at construction time, so the innermost constructor runs first — the opposite of what the wrapping order implies)
- Method resolution falls through the chain: if a method is defined in both an inner and an outer mixin, the outer definition (higher in the chain) shadows the inner one

The composition order is specified once in the base class definition and never verified thereafter. Swapping two mixin positions may produce subtly wrong behavior with no error. Without a documented rationale for each position in each base class, engineers cannot safely reorder compositions when adding new mixins.

---

## State Field Namespace Collisions

All mixin-added fields exist directly on the instance. There is no encapsulation between mixin-owned state. A subclass that accidentally declares a field with the same name as a mixin field — or a mixin that adds a field with the same name as an existing mixin — silently shadows the original.

Example scenario: an engineer adds `_rules = []` in a concrete component's constructor body, intending it as a local array for a different purpose. This re-declares the field initialized by the rules mixin on the instance. The rules mixin's `evaluateRules` will now iterate the empty array even after `setRules()` was called, because the instance-level field shadows the prototype-level one. No error is thrown. The component appears to evaluate no rules.

Prefixing mixin-private fields (e.g., `_Rulable_rules`) would eliminate collision risk at the cost of readability. The current pattern accepts the collision risk in exchange for clean field names.

---

## The `toDisplayObject()` Contract Hole

`Alpineable` enforces its abstract method by throwing at runtime. The enforcement happens when Alpine attempts to render the component — not at construction time or initialization time. A component that is constructed and tested without ever calling `toDisplayObject()` will pass all its tests and fail only in a browser rendering context.

This creates a false sense of confidence. A component can have a full passing test suite and still break at the only moment that matters to a user. A construction-time assertion (e.g., checking that `toDisplayObject` has been overridden during the base class constructor) would catch the omission earlier. JavaScript does not have abstract methods or static abstract method proposals at the language level (as of current stage), but a runtime check in the constructor is straightforward.

---

## Actorlike Creates Structurally Valid but Functionally Empty States

`sendEvent()` silently no-ops when `_actorRef` is null. This is a pragmatic defensive choice — it prevents crashes during construction, testing without an actor, or teardown. But it means a component that has never had an actor set can be "used" as if it works: state changes are made, methods are called, and no error surfaces. The component simply never communicates.

Any component whose correct behavior depends on actor communication has no safety net. If `setActorRef` is accidentally omitted during wiring, the component will appear to function — forms can be filled, rules can be evaluated, prices can be calculated — but no state transitions happen and no events reach the machine.

A `requireActorRef()` method that throws when `_actorRef` is null would let components opt into strict wiring assertions.

---

## Testing Granularity Problem

The pattern enables testing at three layers:

1. **Mixin tests** — isolated, minimal base, mock injected functions. These work well.
2. **Base class tests** — verify that the correct methods exist and that simple chains produce correct results. Typically use a thin test subclass.
3. **Component integration tests** — use real injected functions, real rules, possibly a real actor.

The gap is between layers 2 and 3. A component can pass all mixin tests and all base class tests, yet fail when assembled with real injected functions and a real actor — because the integration path, specifically the sequencing of `setRules`, `setActorRef`, `receiveContext`, `evaluateRules`, `resolveQuantities`, and `calculatePrice`, was never exercised together.

There is no test layer that covers "mixin composition + real injected functions + actor lifecycle." The architecture does not prevent this layer from being written, but it does not encourage it either.

---

## Scalability Cliff

Ten mixins and five base classes is manageable. The architecture begins to strain at larger scales because:

**Discovery cost increases.** A new developer must read every mixin's implementation to understand which fields it initializes, which fields it reads from siblings, and which order constraints exist. There is no manifest or index.

**Role taxonomy growth.** Each new component type either fits an existing base class or requires a new one. With fifteen or more concrete component types, the probability of a component that partially fits an existing role increases — and the temptation to add "just one more mixin" to an existing base class rather than create a new one leads to base classes with capabilities that most of their subclasses never use.

**Cross-cutting concerns cannot be mixins without broad changes.** Adding logging, instrumentation, or caching as a mixin requires modifying every base class definition where it is needed. There is no post-hoc injection point for cross-cutting behavior that applies uniformly to all components.

---

## What a Better Implementation Would Look Like

These improvements address the specific structural weaknesses described above without changing the pattern's fundamental approach:

**Explicit dependency declarations.** Each mixin exports a `requires` array: `Prizable.requires = ['Rulable']`. A composition validator — run at module load time — checks that every base class satisfies all required mixin dependencies.

**Named inner classes.** `(Base) => class PrizableExtension extends Base { ... }` gives the inner class a stable name in stack traces and debugger output without changing any behavior.

**A composition validator.** A function like `assertComposition(BaseClass, [Prizable, Rulable, ...])` that runs at module load time and throws descriptively if a required mixin is absent from the prototype chain.

**Construction-time abstract method check.** The `Alpineable` constructor checks whether `this.toDisplayObject === Alpineable.prototype.toDisplayObject` and throws if so. Same for `Storable.toStorageObject` and `Formable.validate`. This catches missing implementations at construction rather than rendering.

**Documented composition order rationale.** Each base class definition includes a comment specifying why each mixin appears in its position — particularly for cases where order matters.

**Utility extraction as an alternative.** Cross-cutting, framework-agnostic behavior can be extracted into plain utility modules when mixin composition depth becomes hard to reason about. This improves discoverability, but trades away declarative capability composition at class definition sites.
