# Best Practices and Implementation Advice

This document provides implementation guidance for teams adopting the functional mixin composition pattern described in the system overview and design strategy documents. All examples are abstract and apply to any codebase using this pattern.

---

## 1. Canonical Component Structure

The following shows a complete Domain Leaf component — a priceable, ruleable unit with storage identity and actor integration. This is the reference implementation for any `ItemBase`-derived class.

```js
import { ItemBase } from '../common/base/domain/ItemBase.js';

export class ProductItem extends ItemBase {
  // ── Identity ─────────────────────────────────────────────────────────────
  // ID_Linea, ID_Item, ID_Categoria, ID_Cotizacion inherited from Storable

  // ── Own state ────────────────────────────────────────────────────────────
  Nombre = null;
  _profile = null;       // set via fromDefinition or fromSeed
  _category = null;      // denormalized for display

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Factory: create from a resolved database definition.
   * This is how a newly loaded item is wired up.
   */
  static fromDefinition(def, { pricingFn, evaluator }) {
    const item = new ProductItem();
    item.ID_Item       = def.ID_Item;
    item.ID_Categoria  = def.ID_Categoria;
    item.Nombre        = def.Nombre;
    item._profile      = def.pricingProfile;
    item._category     = def.categoria;

    // Default quantities from definition
    item._defaultPax      = def.defaultPax ?? null;
    item._defaultCantidad = def.defaultCantidad ?? 1;
    item._defaultDuracion = def.defaultDuracion ?? null;

    // Inject behavior (never hardcode algorithms inside the class)
    item._pricingFn = pricingFn;
    item._evaluator = evaluator;

    item.setRules(def.rules ?? []);

    return item;
  }

  /**
   * Factory: rehydrate from a persisted seed (e.g., from storage).
   */
  static fromSeed(seed, { pricingFn, evaluator }) {
    const item = ProductItem.fromDefinition(seed.def, { pricingFn, evaluator });

    // Restore user-set quantities
    if (seed.pax !== undefined)      { item.pax = seed.pax; item.paxIsUserSet = true; }
    if (seed.cantidad !== undefined)  { item.cantidad = seed.cantidad; item.cantidadIsUserSet = true; }
    if (seed.duracion !== undefined)  { item.duracion = seed.duracion; item.duracionIsUserSet = true; }

    // Restore storage identity
    item.ID_Linea      = seed.ID_Linea ?? null;
    item.ID_Cotizacion = seed.ID_Cotizacion ?? null;
    item.markClean();

    return item;
  }

  // ── Wiring (called after construction, from the owner/container) ──────────

  /**
   * Called by the parent container when an actor is available.
   * setActorRef is inherited from Actorlike.
   */
  wire(actorRef) {
    return this.setActorRef(actorRef);
  }

  // ── Required abstract method implementations ───────────────────────────────

  /**
   * Alpineable contract: flat snapshot for Alpine.js reactive rendering.
   * Return only what the template needs — never return internal state directly.
   */
  toDisplayObject() {
    return {
      id:          this.ID_Item,
      nombre:      this.Nombre,
      categoria:   this._category?.Nombre ?? null,

      // Quantities
      pax:         this.pax,
      cantidad:    this.cantidad,
      duracion:    this.duracion,
      paxIsUserSet:      this.paxIsUserSet,
      cantidadIsUserSet: this.cantidadIsUserSet,
      duracionIsUserSet: this.duracionIsUserSet,

      // Pricing
      price:        this.displayPrice,
      total:        this.total,

      // Rules
      appliedRules: this.getAppliedRules(),

      // Status
      isSaved:      this.isSaved(),
    };
  }

  /**
   * Storable contract: object suitable for writing to the database.
   * Include only fields the schema defines — do not leak internal fields.
   */
  toStorageObject() {
    return {
      ID_Linea:      this.ID_Linea,
      ID_Item:       this.ID_Item,
      ID_Categoria:  this.ID_Categoria,
      ID_Cotizacion: this.ID_Cotizacion,
      pax:           this.paxIsUserSet ? this.pax : null,
      cantidad:      this.cantidadIsUserSet ? this.cantidad : null,
      duracion:      this.duracionIsUserSet ? this.duracion : null,
    };
  }

  /**
   * Rulable hook: enrich the context passed to the rule evaluator.
   * Always call super._buildRuleContext() and spread it.
   */
  _buildRuleContext() {
    return {
      ...super._buildRuleContext(),   // includes _inheritedContext
      ID_Item:      this.ID_Item,
      ID_Categoria: this.ID_Categoria,
      profile:      this._profile,
      pax:          this.pax,
      cantidad:     this.cantidad,
      duracion:     this.duracion,
    };
  }

  // ── Convenience serialization for persistence ─────────────────────────────

  toSeed() {
    return {
      def: {
        ID_Item:        this.ID_Item,
        ID_Categoria:   this.ID_Categoria,
        Nombre:         this.Nombre,
        pricingProfile: this._profile,
        categoria:      this._category,
        defaultPax:     this._defaultPax,
        defaultCantidad: this._defaultCantidad,
        defaultDuracion: this._defaultDuracion,
        rules:          this._rules,
      },
      pax:           this.paxIsUserSet ? this.pax : undefined,
      cantidad:      this.cantidadIsUserSet ? this.cantidad : undefined,
      duracion:      this.duracionIsUserSet ? this.duracion : undefined,
      ID_Linea:      this.ID_Linea,
      ID_Cotizacion: this.ID_Cotizacion,
    };
  }
}
```

**Wiring pattern at call site:**

```js
// In the parent container (or mounting logic):
const item = ProductItem.fromDefinition(resolvedDef, { pricingFn, evaluator });

// Actor is wired separately — it may not exist at construction time
const actorRef = createActor(itemMachine, { input: { itemId: item.ID_Item } });
item.wire(actorRef);
actorRef.start();

// First update cycle
item
  .receiveContext(containerContext)
  .evaluateRules(evaluator)
  .resolveQuantities()
  .calculatePrice();
```

---

## 2. Multi-Actor Interaction

Each component is logically paired with an XState actor that manages its lifecycle, event handling, and asynchronous operations. The domain object holds the calculated state; the actor holds the machine state and triggers recalculation.

### Parent-to-Child Context Flow

```
ContainerActor ──[SET_CONTEXT event]──► ChildActor
                                           │
                                    child.receiveContext(ctx)
                                    child.evaluateRules(fn)
                                    child.resolveQuantities()
                                    child.calculatePrice()
```

The `SET_CONTEXT` event pattern:

```js
// In the parent container's actor machine (action):
function propagateContextToChildren(ctx) {
  const mergedContext = { ...ctx.inheritedContext, ...ctx.ruleOutputs };
  for (const childRef of ctx.childActors.values()) {
    childRef.send({ type: 'SET_CONTEXT', context: mergedContext });
  }
}

// In the child item's actor machine (event handler):
on: {
  SET_CONTEXT: {
    actions: assign(({ context, event }) => {
      context.domainItem
        .receiveContext(event.context)
        .evaluateRules(context.evaluator)
        .resolveQuantities()
        .calculatePrice();
      return {};
    })
  }
}
```

### Child-to-Parent Snapshot Bubbling

When a child's state changes, the parent needs to re-aggregate. Use subscriptions:

```js
// In parent container setup (actor action or service):
function subscribeToChild(childRef, parentRef) {
  const subscription = childRef.subscribe((snapshot) => {
    parentRef.send({ type: 'CHILD_UPDATED', childId: snapshot.context.itemId });
  });
  return subscription; // MUST be stored for cleanup
}
```

### Subscription Lifecycle and Cleanup

**The critical rule:** every call to `childRef.subscribe()` returns an unsubscribe function. It must be stored and called when the child is removed or the parent is torn down.

```js
// Correct: store subscriptions, clean up on removal
const subscriptions = new Map();

function addChild(id, childRef) {
  const sub = childRef.subscribe(handleChildUpdate);
  subscriptions.set(id, sub);
}

function removeChild(id) {
  const sub = subscriptions.get(id);
  sub?.unsubscribe();
  subscriptions.delete(id);
}

// Wrong: subscription leaked, no cleanup possible
childRef.subscribe(handleChildUpdate);
```

---

## 3. Environment Propagation

"Environment" refers to global contextual values that affect pricing and rule evaluation across the entire component tree: the event date, the hour block, the total guest count, venue capacity, or any other session-level parameters.

### Where Environment Lives

**Environment must not live inside any component.** A component that owned the event date would need to propagate it to all siblings — breaking the tree's parent-to-child flow. Instead, environment is owned by the application layer (an XState context field at the session/quotation machine level, or a plain object managed by the mounting code).

```js
// Application layer — not inside any component
const sessionEnvironment = {
  dia:       '2026-06-15',
  hora:      'noche',
  paxGlobal: 120,
};
```

### Entering the Tree

The root container is the environment's entry point. When the session environment changes, the root container's actor receives an `UPDATE_ENVIRONMENT` event:

```js
// Root container machine action:
function applyEnvironment(ctx, event) {
  const ruleOutputs = {};  // container evaluates its own rules here
  ctx.domainContainer.receiveContext(event.env);
  ctx.domainContainer.evaluateRules(ctx.evaluator);
  ctx.domainContainer.propagateContext(ruleOutputs); // pushes to all children
}
```

### Merge Semantics: Patch, Not Replace

`receiveContext(patch)` merges the patch into `_inheritedContext`. Existing keys survive unless the patch explicitly overwrites them:

```js
// Time 1: environment sets the date
container.receiveContext({ dia: '2026-06-15', paxGlobal: 120 });
// _inheritedContext = { dia: '2026-06-15', paxGlobal: 120 }

// Time 2: user changes pax — only paxGlobal changes, dia survives
container.receiveContext({ paxGlobal: 150 });
// _inheritedContext = { dia: '2026-06-15', paxGlobal: 150 }  ← correct
```

If `receiveContext` replaced instead of merged, the second call would lose `dia`.

### Mid-Session Environment Changes

When the user changes a session-level value, the flow is:

1. Application layer updates its environment object
2. Sends `UPDATE_ENVIRONMENT` event to root container actor
3. Root container: `receiveContext(patch)` → `evaluateRules()` → `propagateContext(ruleOutputs)`
4. Each child receives `receiveContext(merged)` via propagation
5. Each child re-evaluates its own rules, resolves quantities, recalculates price
6. Each child actor emits a snapshot change → parent re-aggregates

This is a full-tree recalculation triggered by a single event. The propagation model is designed for it.

---

## 4. Actor Composition Patterns

### Pattern A: Parent Owns Child Actors

The most common pattern. The parent container creates child actors when items are added, manages their lifecycle, and tears them down when items are removed.

```js
// In parent container machine:
ADD_ITEM: {
  actions: assign(({ context, event }) => {
    const childDomain = ProductItem.fromDefinition(event.definition, {
      pricingFn: context.pricingFn,
      evaluator: context.evaluator,
    });
    const childActor = createActor(itemMachine, {
      input: { definition: event.definition, evaluator: context.evaluator }
    });
    childDomain.setActorRef(childActor);

    const sub = childActor.subscribe(() => {
      // Will notify parent to re-aggregate
    });
    childActor.start();

    return {
      childActors:  new Map([...context.childActors,  [event.id, childActor]]),
      childDomains: new Map([...context.childDomains, [event.id, childDomain]]),
      subscriptions: new Map([...context.subscriptions, [event.id, sub]]),
    };
  })
},

REMOVE_ITEM: {
  actions: [
    ({ context, event }) => {
      context.subscriptions.get(event.id)?.unsubscribe();
      context.childActors.get(event.id)?.stop();
    },
    assign(({ context, event }) => {
      const childActors   = new Map(context.childActors);
      const childDomains  = new Map(context.childDomains);
      const subscriptions = new Map(context.subscriptions);
      childActors.delete(event.id);
      childDomains.delete(event.id);
      subscriptions.delete(event.id);
      return { childActors, childDomains, subscriptions };
    })
  ]
}
```

### Pattern B: Peer Actors Communicating Through a Shared Parent

Two sibling items need to coordinate (e.g., one item's availability depends on another being selected). They do not communicate directly — they communicate via the parent.

```js
// Item A signals a state change upward
itemActorA.send({ type: 'SELECTION_CHANGED', selected: true, source: 'I-A' });

// Parent machine handles it:
SELECTION_CHANGED: {
  actions: ({ context, event }) => {
    const conflictId = findConflict(context.childDomains, event.source);
    if (conflictId) {
      context.childActors.get(conflictId)?.send({
        type: 'SET_CONTEXT',
        context: { conflictsWith: event.source }
      });
    }
  }
}
```

Direct peer-to-peer actor references are permitted only if the peers are truly independent and the parent does not need to coordinate them.

### Pattern C: Lazy Initialization

For expensive components (a detailed breakdown panel, a modal form), the actor is created only when first needed and torn down when dismissed:

```js
// In container machine:
OPEN_DETAIL_PANEL: {
  actions: assign(({ context, event }) => {
    if (!context.detailActor) {
      const detailActor = createActor(detailMachine, {
        input: { itemId: event.itemId }
      });
      detailActor.start();
      return { detailActor };
    }
    return {};
  })
},

CLOSE_DETAIL_PANEL: {
  actions: assign(({ context }) => {
    context.detailActor?.stop();
    return { detailActor: null };
  })
}
```

Lazy actors must be stopped on teardown — a stopped actor releases its subscriptions and timers.

---

## 5. Testing Strategy

The mixin pattern enables testing at five distinct layers. Each layer tests a different scope. **Write tests for every layer** — passing mixin tests do not guarantee a working component.

### Layer 1: Mixin Unit Tests

**Purpose:** Verify that a single mixin's methods do exactly what they document, with no dependencies on other mixins.

**What to test:**
- Each method's return value and side effects in isolation
- Chaining (every mutation method returns `this`)
- Edge cases: empty inputs, null values, boundary values

**What NOT to test:**
- Interaction with other mixins (that's Layer 2)
- Real pricing functions or business logic (that's Layer 3)

**Good test:**
```js
describe('Rulable', () => {
  const makeBase = () => new (class extends Rulable(class {}) {})();

  it('receiveContext merges patch without replacing existing keys', () => {
    const b = makeBase();
    b.receiveContext({ a: 1 });
    b.receiveContext({ b: 2 });
    expect(b._inheritedContext).toEqual({ a: 1, b: 2 });
  });

  it('evaluateRules stops at first non-accumulating rule', () => {
    const b = makeBase();
    b.setRules([
      { ID_Regla: 'R1', Activo: true, Acumulable: false },
      { ID_Regla: 'R2', Activo: true, Acumulable: true },
    ]);
    b.evaluateRules(() => ({ tipo: 'MATCH' }));
    expect(b.getAppliedRules()).toHaveLength(1);
    expect(b.getAppliedRules()[0].ruleId).toBe('R1');
  });
});
```

### Layer 2: Base Class Composition Tests

**Purpose:** Verify that the specified mixin composition produces the correct merged API, and that implicit inter-mixin dependencies work.

**What to test:**
- All expected methods exist on a base class instance
- Chaining works across mixin boundaries
- Implicit dependencies (`_inheritedContext` from Rulable visible to Prizable)
- Abstract methods throw until overridden

**What NOT to test:**
- Business logic, real pricing, real rules

**Good test:**
```js
describe('ItemBase composition', () => {
  class TestItem extends ItemBase {
    toDisplayObject() { return {}; }
    toStorageObject() { return {}; }
  }

  it('has all expected methods from all five mixins', () => {
    const item = new TestItem();
    expect(item.setActorRef).toBeTypeOf('function');   // Actorlike
    expect(item.resolveQuantities).toBeTypeOf('function'); // Prizable
    expect(item.receiveContext).toBeTypeOf('function');    // Rulable
    expect(item.markDirty).toBeTypeOf('function');         // Storable
    expect(item.toDisplayObject).toBeTypeOf('function');   // Alpineable
  });

  it('Prizable.resolveQuantities reads _inheritedContext set by Rulable', () => {
    const item = new TestItem();
    item.receiveContext({ pax: 50 });
    item.resolveQuantities();
    expect(item.pax).toBe(50);
  });

  it('chaining works across mixin boundaries', () => {
    const item = new TestItem();
    const result = item.receiveContext({}).evaluateRules(() => null).resolveQuantities().calculatePrice();
    expect(result).toBe(item);
  });
});
```

### Layer 3: Component Integration Tests

**Purpose:** Verify the concrete component class works correctly with real injected functions in the full domain lifecycle.

**What to test:**
- `fromDefinition` creates a correctly wired instance
- `fromSeed` / `toSeed` round-trip correctly
- `_buildRuleContext` returns the expected enriched context
- Full update cycle produces correct `total`
- User quantity overrides take precedence over context values

**What NOT to test:**
- Actor lifecycle (that's Layer 4)
- Alpine rendering (that's Layer 5)

**Good test:**
```js
describe('ProductItem integration', () => {
  const pricingFn = (profile, pax, cantidad) =>
    profile.porPersona * (pax ?? 0) * (cantidad ?? 1);

  const def = {
    ID_Item: 'I1', ID_Categoria: 'C1', Nombre: 'Cena',
    pricingProfile: { porPersona: 100 },
    categoria: { Nombre: 'Alimentos' },
    defaultPax: null, defaultCantidad: 1, defaultDuracion: null,
    rules: []
  };

  it('calculates price from received context', () => {
    const item = ProductItem.fromDefinition(def, { pricingFn, evaluator: () => null });
    item.receiveContext({ pax: 80 }).evaluateRules(() => null).resolveQuantities().calculatePrice();
    expect(item.total).toBe(8000);  // 100 × 80 × 1
  });

  it('user pax overrides context pax', () => {
    const item = ProductItem.fromDefinition(def, { pricingFn, evaluator: () => null });
    item.setUserQuantity('pax', 50);
    item.receiveContext({ pax: 80 }).resolveQuantities().calculatePrice();
    expect(item.pax).toBe(50);
    expect(item.total).toBe(5000);
  });

  it('toSeed / fromSeed round-trips user overrides', () => {
    const item = ProductItem.fromDefinition(def, { pricingFn, evaluator: () => null });
    item.setUserQuantity('pax', 30);
    const restored = ProductItem.fromSeed(item.toSeed(), { pricingFn, evaluator: () => null });
    expect(restored.pax).toBe(30);
    expect(restored.paxIsUserSet).toBe(true);
  });
});
```

### Layer 4: Container Integration Tests

**Purpose:** Verify the full tree — container + children — with context propagation and aggregation working end-to-end.

**What to test:**
- Container correctly propagates context to all children
- `aggregate()` sums child totals correctly
- Adding/removing children updates the aggregate
- Children that don't match container rules still receive base context

**What NOT to test:**
- Actor wiring (test domain objects directly without actors)
- Alpine rendering

**Good test:**
```js
describe('Container + children propagation', () => {
  it('propagates environment context to all children', () => {
    const container = new ProductContainer();
    const child1 = ProductItem.fromDefinition(def1, deps);
    const child2 = ProductItem.fromDefinition(def2, deps);

    container.addChild('c1', child1);
    container.addChild('c2', child2);

    container.receiveContext({ pax: 100, dia: '2026-06-15' });
    container.propagateContext({});

    expect(child1._inheritedContext.pax).toBe(100);
    expect(child2._inheritedContext.pax).toBe(100);
    expect(child1._inheritedContext.dia).toBe('2026-06-15');
  });

  it('aggregate() sums all child totals after full cycle', () => {
    const container = new ProductContainer();
    // Two items with known totals
    child1.receiveContext({ pax: 10 }).resolveQuantities().calculatePrice();
    child2.receiveContext({ pax: 20 }).resolveQuantities().calculatePrice();
    container.addChild('c1', child1).addChild('c2', child2);
    const result = container.aggregate();
    expect(result.subtotal).toBe(child1.total + child2.total);
  });
});
```

### Layer 5: E2E / Acceptance Tests

**Purpose:** Verify the full stack — actor lifecycle, Alpine reactive binding, user gestures — in a browser-like environment.

**Tools:** Playwright, Cypress, or a JSDOM-based Alpine test helper.

**What to test:**
- User clicks "add item" → item appears in DOM with correct price
- User changes a quantity → price updates reactively in the DOM
- Container total updates when a child changes
- Removing an item removes it from the DOM and updates the total
- Session environment change propagates to all visible items

**What NOT to test:**
- Internal domain calculations (tested in Layers 1-4)
- Machine state transitions in isolation (tested separately)

**Good test (Playwright):**
```js
test('adding an item renders it with correct price', async ({ page }) => {
  await page.goto('/quotation-sandbox');
  await page.click('[data-action="add-item"][data-item-id="I1"]');
  const priceCell = page.locator('[data-item-id="I1"] [data-field="price"]');
  await expect(priceCell).toHaveText('$100');
});

test('changing pax updates item price reactively', async ({ page }) => {
  await page.goto('/quotation-sandbox');
  await page.click('[data-action="add-item"][data-item-id="I1"]');
  await page.fill('[data-item-id="I1"] [data-field="pax-input"]', '50');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-item-id="I1"] [data-field="total"]')).toHaveText('$5000');
});
```

---

## 6. Folder Structure Proposal

```
packages/components/product/
│
├── ProductItem.js                       ← Concrete class (extends ItemBase)
│                                          Implements: toDisplayObject, toStorageObject,
│                                          _buildRuleContext, fromDefinition, fromSeed, toSeed
│
├── STATE_CONTRACT.md                    ← Input/output contract (read before editing)
│                                          Documents: what fields enter via receiveContext,
│                                          what toDisplayObject() returns, what actor events exist
│
├── machine/
│   └── productMachine.js                ← XState machine definition
│                                          Contains: states, transitions, guards, actions
│                                          Does NOT import ProductItem directly
│
├── domain/
│   ├── index.js                         ← Re-exports all pure functions
│   ├── pricing.js                       ← pricingFn(profile, pax, cantidad, duracion) → number
│   ├── quantity.js                      ← resolveDefaultQuantities(def) → {pax, cantidad, duracion}
│   └── formatting.js                    ← formatPrice(cents) → string
│
├── ui/
│   └── Product.html                     ← Alpine.js template
│                                          Reads only from toDisplayObject() output keys
│
├── db/
│   └── resolveProductDefinition.js      ← Database join: item + category + rules → normalized def
│                                          Only file that knows raw DB field names
│
└── tests/
    ├── ProductItem.base.test.js          ← Layer 2: base class composition
    ├── ProductItem.integration.test.js   ← Layer 3: real pricingFn + evaluator, no actor
    ├── ProductContainer.integration.test.js ← Layer 4: container + children propagation
    └── product.e2e.test.js               ← Layer 5: Playwright/browser tests
```

> Note: Layer 1 mixin unit tests live in `packages/components/common/mixins/` alongside the mixin source files, not inside each component folder — they test the mixin in isolation, not the component.

### Rationale

**`ProductItem.js` at root** — The class is the component's public API. Placing it at the top level makes imports clean: `import { ProductItem } from '../product/ProductItem.js'`.

**`machine/`** — The XState machine is separate from the domain class because the machine can be tested without DOM or Alpine, and machine definitions may be inspected by visualization tools. Keeping them separate also prevents circular imports: the machine should receive the domain object via actor context input, not import it directly.

**`domain/`** — Pure functions importable anywhere: tests, the machine, other components. No classes, no state, no I/O. Each file exports one function family. `index.js` re-exports all of them for convenience.

**`ui/`** — Alpine templates are static HTML files. Separating them from JS enables design tools to open them without a build step. The template references only keys that `toDisplayObject()` returns — never internal class fields.

**`db/`** — The database join is isolated here because it is the only code that knows the raw schema field names (e.g., `ID_Item`, `Def_Precio_PP`, `Nombre`). Everything else uses the normalized definition shape. Schema migrations are a one-file change.

**`STATE_CONTRACT.md`** — The most important file for maintainability. Documents what inputs the component accepts (via `receiveContext`), what it outputs (via `toDisplayObject`), and what actor events exist. Any developer should read this before editing any other file in the folder.

**`tests/`** — One file per test layer. This makes it immediately clear which kind of test you're reading, and gives each layer an independent pass/fail signal in CI.

---

## 7. Common Mistakes and How to Avoid Them

### Mistake 1: Composing Mixins Directly on a Concrete Class

**Problem:** Instead of extending a pre-composed base class, developers apply mixins directly on the concrete class to "get just what they need" — skipping mixins they consider unnecessary.

**Before:**
```js
// Skips Actorlike — actor wiring will silently fail
export class SpecialItem extends Alpineable(Storable(Rulable(Prizable(class {})))) {
  toDisplayObject() { return {}; }
  toStorageObject() { return {}; }
}
```

**After:**
```js
// Always extend the canonical base class for your role
export class SpecialItem extends ItemBase {
  toDisplayObject() { return {}; }
  toStorageObject() { return {}; }
}
```

**Why:** The base classes encode approved composition orders and dependency pairs. Ad-hoc composition risks omitting a required mixin and getting silent failures. If a component genuinely needs fewer capabilities, discuss adding a new base class — don't compose ad-hoc.

---

### Mistake 2: Redeclaring Mixin-Owned Fields in a Subclass

**Problem:** A subclass redeclares a field that a mixin already initializes as a class field, shadowing the mixin's version at the instance level.

**Before:**
```js
export class ProductItem extends ItemBase {
  _rules = [];  // Shadows Rulable._rules on the instance.
                // setRules() sets the prototype-level field;
                // evaluateRules() reads the instance-level [] → always empty.
}
```

**After:**
```js
export class ProductItem extends ItemBase {
  // Only declare fields that no mixin owns.
  Nombre = null;
  _profile = null;
  _category = null;
}
```

**Why:** Mixin-owned fields (`_rules`, `_children`, `_actorRef`, `_services`, `_listeners`, `_formState`, `_formErrors`, `_isDirty`, `pax`, `cantidad`, `duracion`, etc.) must not appear as field declarations in any subclass. Treat them as a reserved namespace.

---

### Mistake 3: Calling `toDisplayObject()` Before the Full Update Cycle

**Problem:** Alpine calls `toDisplayObject()` reactively, but the component hasn't completed the full update cycle — returning stale or partially calculated state.

**Before:**
```js
// Only received context — rules not evaluated, price not calculated
item.receiveContext(env);
renderAlpine(item.toDisplayObject());  // price: 0, applied rules: []
```

**After:**
```js
// Always complete the full cycle before exposing display state
item
  .receiveContext(env)
  .evaluateRules(evaluator)
  .resolveQuantities()
  .calculatePrice();
renderAlpine(item.toDisplayObject());
```

**Why:** The domain update methods form a pipeline where each step depends on the previous. Skipping `calculatePrice()` leaves `_price` at `null`. `toDisplayObject()` faithfully returns `total: 0`. The full cycle must complete before reading display state.

---

### Mistake 4: Not Cleaning Up Actor Subscriptions

**Problem:** When a child component is removed, its actor subscription is not cancelled. The callback fires on subsequent actor state changes, operating on a domain object that no longer belongs to the tree.

**Before:**
```js
function addChild(def, childActor) {
  childActor.subscribe(() => container.aggregate()); // never cleaned up
  childActor.start();
}
// No removeChild that cancels the subscription
```

**After:**
```js
const subscriptions = new Map();

function addChild(id, childActor) {
  const sub = childActor.subscribe(() => container.aggregate());
  subscriptions.set(id, sub);
  childActor.start();
}

function removeChild(id) {
  subscriptions.get(id)?.unsubscribe();
  subscriptions.delete(id);
  childActors.get(id)?.stop();
}
```

**Why:** XState subscriptions hold a reference to the callback, which may close over domain objects, containers, or Alpine store references. A leaked subscription prevents garbage collection and causes phantom updates after the child is removed.

---

### Mistake 5: Putting Business Logic Inside `toDisplayObject()`

**Problem:** `toDisplayObject()` accumulates derived computations, conditional formatting, and business logic — making it a second calculation layer that can diverge from the domain object's actual state.

**Before:**
```js
toDisplayObject() {
  // Business logic here — wrong layer
  const effectivePax = this.paxIsUserSet ? this.pax : (this._inheritedContext.pax ?? 0);
  const adjustedPrice = this._profile?.tieneDescuento
    ? this._price * 0.9
    : this._price;
  return {
    pax:   effectivePax,
    price: adjustedPrice / effectivePax,
  };
}
```

**After:**
```js
// Business logic in domain methods:
// - resolveQuantities() determines effective pax
// - calculatePrice() applies pricing profile (via _pricingFn)
// toDisplayObject() only reads already-computed fields

toDisplayObject() {
  return {
    pax:   this.pax,           // resolved by resolveQuantities()
    price: this.displayPrice,  // computed by calculatePrice()
    total: this.total,
  };
}
```

**Why:** `toDisplayObject()` is called by Alpine on every render cycle — potentially dozens of times per user gesture. Business logic inside it runs redundantly, cannot be unit-tested independently of Alpine, and creates divergence between what the domain object "knows" and what Alpine "shows." All calculations belong in the domain update cycle; `toDisplayObject()` is a read-only projection.
