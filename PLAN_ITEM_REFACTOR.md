# Plan: Refactor Item — One Actor Per Item

## Context

Step 3 (`item` standalone) in the rebuild roadmap needs deeper development before moving to containers (steps 6-10). The current `ItemLogic` is a 775-line god class combining pricing, rules, formatting, overrides, and projections. The XState machine is a single-state context reducer. The Alpine component leaks business method names.

## Benchmark Results (2026-02-22)

Benchmarked XState v5.28.0 actor overhead with the counter-composed pattern:

| Metric | 100 actors | 1,000 actors | 5,000 actors |
|--------|------------|--------------|--------------|
| Create + start | 2.7ms | 29ms | 68ms |
| Memory (heap) | 0.6 MB | 3.7 MB | 13.7 MB |
| Send to all (no subs) | 1.5ms | 11ms | 17ms |
| Send to all (with subs) | 1.8ms | 10ms | 276ms |
| Single event | 0.02ms | 0.06ms | 0.07ms |

**Conclusion:** At 1,000 actors the numbers are acceptable (29ms creation, 10ms cascade, 3.7MB). The O(N²) cascade at 5,000 was caused by a flat parent-subscribes-to-all aggregation pattern, not by XState itself. With containers owning subsets of items (20-30 per category), the fan-out per subscription stays small.

**Decision:** Each Item is its own XState actor. If performance bites at scale, the fix is in the subscription/aggregation pattern, not in removing actors.

## Architecture

```
Item = XState actor wrapping ItemLogic domain class
  - Each item owns its own actor
  - Actor context = ItemLogic.toMachineContext() projection
  - Machine has catalog/basket states with semantic events

Standalone sandbox (step-03-item)
  - Creates one item actor for interactive testing
  - Same pattern as counter-basic: actor.send() → subscription → Alpine sync

Future containers (steps 6-10)
  - Container actor coordinates N child item actors
  - Same pattern as counter-composed: container subscribes to children
  - Fan-out is per-category (20-30 items), not global (1000)
```

## File Plan

### Phase A: Extract domain functions from ItemLogic (no behavior change)

**1. `packages/components/item/domain/pricing.js`** (~70 lines)
Extract from `ItemLogic.js`:
- `PricingKind` enum, `InitializationMode` enum
- `toNumber()`, `toInteger()` utilities
- `normalizeProfile()`, `detectPricingKind()`, `detectInitializationMode()`
- `rateForKind()`, `overrideFieldForKind()`, `fixedAmountForKind()`

**2. `packages/components/item/domain/quantity.js`** (~70 lines)
Extract from `ItemLogic.js`:
- `resolveContextQuantity()`
- `resolveBasketQuantity()` → returns `{ quantity, isOverridden, overrideField }`
- `applyExclusiveDefaultMode()`

**3. `packages/components/item/domain/rules.js`** (~40 lines)
Extract from `ItemLogic.js`:
- `evaluateRules(rules, snapshot)` → returns `{ appliedRules, available }`
- Supports MAX_PAX, MIN_PAX, ONLY_HOUR_RANGE

**4. `packages/components/item/domain/formatting.js`** (~80 lines)
Extract from `ItemLogic.js`:
- `money(value)` — Chilean peso formatting
- `formatCatalogTerms(base, kind, mode, rate, defaults)` — disaggregated formula
- `legendForBasket(base, kind, quantity, rate, total)` — basket breakdown
- `policyHint(kind, mode, defaults)` — initialization hint
- `profileHumanText(base, kind, rate)` — profile summary
- `lineRateLabel(kind)` — 'Pax'|'Unidades'|'Duracion'|'Cantidad'

**5. `packages/components/item/domain/schedule.js`** (~10 lines)
Extract from `ItemLogic.js`:
- `resolveSchedule(externalContext, overrides)` → `{ dia, hora }`

**6. `packages/components/item/domain/index.js`** (~10 lines)
Barrel re-export of all domain modules.

**7. Tests for Phase A:** `tests/domain/` — one test file per module

### Phase B: Create Item domain class

**8. `packages/components/item/Item.js`** (~200 lines)
Refactored ItemLogic with private fields. Same calculation pipeline, cleaner API.

```javascript
export class Item {
  #mode = 'catalog';
  #definition = {};
  #externalContext = {};
  #overrides = {};
  #derived = {};

  static fromDefinition(definition, options = {}) { ... }
  static fromSeed({ mode, definition, externalContext, overrides }) { ... }

  initialize(seed) { ... return this.calculate(); }
  calculate() { /* same pipeline as ItemLogic.recalculate() */ return this; }

  // Semantic mutations (each calls calculate())
  setMode(mode) { ... }
  receiveContext(patch) { ... }
  setOverride(key, value) { ... }
  clearOverride(key) { ... }
  resetOverrides() { ... }
  setProfileValue(key, value) { ... }
  setDefaultQuantity(key, value) { ... }
  clearDefaultQuantity(key) { ... }

  // Getters
  get mode() { ... }
  get total() { ... }
  get isAvailable() { ... }

  // Projections
  get catalogCard() { ... }
  get basketLine() { ... }
  toDisplayObject() { ... }
  toSeed() { ... }
}
```

**9. `packages/components/item/seeds.js`** (~30 lines)
Move `defaultItemDefinition` and `createDefaultItemSeed()` from ItemLogic.

**10. Tests for Phase B:** `tests/Item.test.js`

### Phase C: Item actor machine

Each item gets its own actor. The machine has two states (`catalog` and `basket`) with semantic events. The `Item` instance lives as a mutable object alongside the machine — no reconstruction per event.

**11. `packages/components/item/machine/itemMachine.js`** (REWRITE)

```javascript
import { assign, createActor, createMachine } from 'xstate';
import { Item } from '../Item.js';
import { createDefaultItemSeed } from '../seeds.js';

export function createItemMachine(seed = createDefaultItemSeed()) {
  const item = Item.fromSeed(seed);

  const reduce = assign(() => item.toDisplayObject());

  return createMachine({
    id: 'item',
    initial: seed.mode || 'catalog',
    context: item.toDisplayObject(),
    states: {
      catalog: {
        on: {
          ADD_TO_BASKET:    { target: 'basket', actions: assign(() => { item.setMode('basket'); return item.toDisplayObject(); }) },
          SET_CONTEXT:      { actions: assign(({ event }) => { item.receiveContext(event.patch); return item.toDisplayObject(); }) },
          SET_PROFILE_VALUE: { actions: assign(({ event }) => { item.setProfileValue(event.key, event.value); return item.toDisplayObject(); }) },
          SET_DEFAULT_QUANTITY: { actions: assign(({ event }) => { item.setDefaultQuantity(event.key, event.value); return item.toDisplayObject(); }) },
        }
      },
      basket: {
        on: {
          REMOVE_FROM_BASKET: { target: 'catalog', actions: assign(() => { item.setMode('catalog'); return item.toDisplayObject(); }) },
          SET_OVERRIDE:     { actions: assign(({ event }) => { item.setOverride(event.key, event.value); return item.toDisplayObject(); }) },
          CLEAR_OVERRIDE:   { actions: assign(({ event }) => { item.clearOverride(event.key); return item.toDisplayObject(); }) },
          RESET_OVERRIDES:  { actions: assign(() => { item.resetOverrides(); return item.toDisplayObject(); }) },
          SET_CONTEXT:      { actions: assign(({ event }) => { item.receiveContext(event.patch); return item.toDisplayObject(); }) },
        }
      }
    }
  });
}

export function createItemActor(seed) {
  const actor = createActor(createItemMachine(seed));
  actor.start();
  return actor;
}
```

Key design points:
- **Two states:** `catalog` and `basket` — state machine actually models the lifecycle
- **Mutable Item singleton:** The `item` instance is captured in closure, mutated by events, then projected to context via `toDisplayObject()`
- **No reconstruction:** Unlike current `ItemXStateInteraction.reduce()` which creates a new `ItemLogic` from context on every event, this mutates the existing instance
- **Container contract:** Containers send `SET_CONTEXT` to push global context (pax, duration, schedule) to child item actors

### Phase D: Alpine adapter (standalone sandbox)

**12. `packages/components/item/logic/createItemStandaloneComponent.js`** (SIMPLIFY)

Follows counter-basic pattern exactly:

```javascript
import { createItemActor } from '../machine/itemMachine.js';

export async function mountItemStandalone(root) {
  if (!root) return;
  const html = await fetch('/packages/components/item/ui/ItemStandalone.html').then(r => r.text());
  const actor = createItemActor();

  window.itemStandaloneComponent = function() {
    return {
      // Reactive state from actor
      state: actor.getSnapshot().context,
      _subscription: null,

      // UI-only state
      expanded: true,
      lastAction: '',

      init() {
        this._subscription = actor.subscribe(snap => {
          this.state = snap.context;
        });
      },

      // Semantic methods → actor.send()
      addToBasket()    { actor.send({ type: 'ADD_TO_BASKET' }); },
      removeFromBasket() { actor.send({ type: 'REMOVE_FROM_BASKET' }); },
      setOverride(key, value) { actor.send({ type: 'SET_OVERRIDE', key, value }); },
      clearOverride(key) { actor.send({ type: 'CLEAR_OVERRIDE', key }); },
      resetOverrides() { actor.send({ type: 'RESET_OVERRIDES' }); },
      setContext(key, value) { actor.send({ type: 'SET_CONTEXT', patch: { [key]: value } }); },
      setProfileValue(key, value) { actor.send({ type: 'SET_PROFILE_VALUE', key, value }); },
      setDefaultQuantity(key, value) { actor.send({ type: 'SET_DEFAULT_QUANTITY', key, value }); },

      prettyState() { return JSON.stringify(this.state, null, 2); }
    };
  };

  root.innerHTML = html;
  if (window.Alpine?.initTree) window.Alpine.initTree(root);
}
```

**13. `packages/components/item/ui/ItemStandalone.html`** (MINIMAL changes)
Update event handler names to match new Alpine adapter API.

### Phase E: Cleanup

**14.** Delete `packages/xstate/src/interactions/ItemXStateInteraction.js`
**15.** Delete `packages/xstate/src/interactions/XStateInteractionBase.js` (no longer needed — each component owns its actor directly)
**16.** Keep `packages/pricing/src/ItemLogic.js` as reference until all tests pass, then delete
**17.** Update `ROADMAP.md`

## Files Summary

| Action | File | Lines |
|--------|------|-------|
| NEW | `item/domain/pricing.js` | ~70 |
| NEW | `item/domain/quantity.js` | ~70 |
| NEW | `item/domain/rules.js` | ~40 |
| NEW | `item/domain/formatting.js` | ~80 |
| NEW | `item/domain/schedule.js` | ~10 |
| NEW | `item/domain/index.js` | ~10 |
| NEW | `item/Item.js` | ~200 |
| NEW | `item/seeds.js` | ~30 |
| REWRITE | `item/machine/itemMachine.js` | ~60 |
| SIMPLIFY | `item/logic/createItemStandaloneComponent.js` | ~40 |
| MODIFY | `item/ui/ItemStandalone.html` | minimal |
| NEW | `tests/domain/*.test.js` | ~270 |
| NEW | `tests/Item.test.js` | ~120 |
| DELETE | `xstate/interactions/ItemXStateInteraction.js` | - |
| DELETE | `xstate/interactions/XStateInteractionBase.js` | - |
| DEPRECATE | `pricing/src/ItemLogic.js` | - |

## Verification

1. **Unit tests:** Domain functions + Item class — identical output to current ItemLogic
2. **Sandbox:** `http://localhost:8090/step-03-item` — behaves identically to current version
3. **Counter steps unchanged:** `step-01-counter` and `step-02-counter-composed` still work
4. **Actor overhead:** ~29ms creation + ~3.7MB for 1000 item actors (validated by benchmark)
