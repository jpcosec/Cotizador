# Components Package

**Location:** `packages/components/`

## Overview

Collection of reusable UI components built with XState v5.28.0 + Alpine.js v3.12.0. Each component is independent, self-contained, and testable in isolation.

---

## Component Catalog

### 1. Counter (Basic)

**Location:** `packages/components/counter-basic/`

Simple numeric counter with increment/decrement and reset.

**Files:**
- `CounterBasic.html` — HTML template with Alpine bindings
- `machine/counterMachine.js` — XState machine definition
- `logic/createCounterBasicComponent.js` — Factory and mounting
- `tests/README.md` — Test documentation

**States:**
```
IDLE → (INCREMENT | DECREMENT | RESET) → IDLE
```

**Features:**
- Increment/decrement by 1
- Reset to initial value
- Display current count
- Max/min bounds (configurable)

**Usage:**
```javascript
const counter = createCounterBasicComponent(
  { initial: 0, min: 0, max: 100 },
  'container-id'
);

counter.on('change', (newCount) => console.log(newCount));
```

---

### 2. Counter (Composed)

**Location:** `packages/components/counter-composed/`

Two-level counter system: **global** counter (managed by parent) + **local** counter (per-item).

**Files:**
- `CounterComposed.html` — HTML with global + local displays
- `machine/composedCounterMachine.js` — Hierarchical XState machine
- `logic/createCounterComposedComponent.js` — Factory
- `tests/README.md` — Test documentation

**States:**
```
IDLE → (SET_GLOBAL | ADJUST_LOCAL) → IDLE
```

**Features:**
- Parent sets global count
- Children add/subtract local adjustments
- Computed total = global + local

**Usage:**
```javascript
const composed = createCounterComposedComponent(
  { global: 50, local: 0 },
  'container-id'
);

composed.setGlobal(75);      // Parent updates global
composed.adjustLocal(+5);     // Child adjusts local
console.log(composed.total()); // → 80
```

---

### 3. Item Component

**Location:** `packages/components/item/`

Full-featured item selection component with catalog/basket modes, pricing, quantity dimensions, and rule evaluation.

See [`../ARCHITECTURE/item-component.md`](../ARCHITECTURE/item-component.md) for detailed documentation.

**Quick facts:**
- Two visual modes: **CATALOG** (browse) and **BASKET** (order)
- Tracks user overrides (fields manually set vs. auto-calculated)
- Evaluates business rules (blocking errors, warnings, adjustments)
- 363 tests (88 Item + 82 pricing + 80 quantity + 69 formatting + 44 rules)

**Usage:**
```javascript
const item = new Item(itemDefinition);
await item.initialize();

item.setMode('BASKET');
item.setOverride('pax', 50);

const state = item.toDisplayObject();
// → { mode, quantities, pricing, appliedRules, available, ... }
```

---

## Component Anatomy

Every component follows this structure:

```
counter-basic/
├── README.md                           ← Component description
├── CounterBasic.html                  ← UI template
├── ui/
│   └── <Component>.html                ← May be split into multiple
├── machine/
│   └── counterMachine.js              ← XState definition
├── logic/
│   └── createCounterBasicComponent.js ← Factory function
├── tests/
│   ├── README.md                      ← Test guide
│   ├── <Component>.test.js            ← Vitest suite
│   └── integration.test.js            ← Optional integration tests
└── domain/ (if complex)
    ├── index.js                       ← Export pure functions
    ├── pricing.js                     ← Calculations
    ├── quantity.js                    ← Qty logic
    └── ...
```

---

## Common Files

### HTML Template

**Location:** `ui/<Component>.html`

```html
<div id="<component>-container" x-data="<component>State()">
  <!-- Alpine.js bindings here -->
  <button @click="increment()">+</button>
  <span x-text="count"></span>
  <button @click="decrement()">-</button>
</div>

<script>
window.<component>State = function() {
  return {
    count: 0,
    increment() { /* ... */ },
    decrement() { /* ... */ },
  };
};
</script>
```

### Machine Definition

**Location:** `machine/<component>Machine.js`

```javascript
export const <component>Machine = setup({
  types: {
    context: { /* TypeScript-like context shape */ },
    events: { /* Event definitions */ },
  },
  actions: { /* Named actions */ },
  guards: { /* Named guards */ },
}).createMachine({
  id: '<component>',
  initial: 'idle',
  states: {
    idle: {
      on: { /* transitions */ },
    },
    // ... more states
  },
});
```

### Factory Function

**Location:** `logic/create<Component>Component.js`

```javascript
export function create<Component>Component(config, containerId) {
  // 1. Instantiate component class
  const component = new <Component>(config);
  
  // 2. Initialize
  component.initialize();
  
  // 3. Mount DOM
  const container = document.getElementById(containerId);
  container.innerHTML = template;
  
  // 4. Connect Alpine.js
  Alpine.data('<component>State', () => ({
    ...component.toDisplayObject(),
    // Event handlers
  }));
  Alpine.initTree(container);
  
  // 5. Return public API
  return {
    getState: () => component.toDisplayObject(),
    setState: (s) => component.loadFromSeed(s),
    // ... public methods
  };
}
```

---

## Shared Styles

**Location:** `packages/components/common/styles/`

Global CSS for all components:

```
claps-global.css     ← Base styles, colors, typography
```

**Included in:** Every component's HTML template

---

## Testing

All components use **Vitest** + **Puppeteer** for testing:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Single component
npm test -- Item.test.js
```

**Test patterns:**
- Unit tests: Pure domain functions
- Integration tests: Component class + machine
- End-to-end: HTML + Alpine.js + machine (Puppeteer)

---

## Alpine.js Integration

Each component exposes a **data function** for Alpine.js:

```javascript
// In component HTML
<div x-data="itemComponent()" ...>

// In window (mounted by factory)
window.itemComponent = function() {
  return {
    // State
    mode: 'CATALOG',
    quantities: { pax: 0 },
    pricing: { total: 0 },

    // Methods
    setMode(newMode) { /* ... */ },
    updateQuantity(field, value) { /* ... */ },

    // Computed (via x-effect or x-compute)
    get displayString() { /* ... */ },
  };
};
```

---

## Component Dependencies

### External Libraries
- **XState v5.28.0** — State machine framework
- **Alpine.js v3.12.0** — Reactive DOM bindings
- **vitest** — Unit testing framework
- **@testing-library/dom** — Testing utilities
- **puppeteer** — E2E browser automation

### Internal Dependencies
- No cross-component dependencies (each is standalone)
- May import from `packages/pricing/` for calculations
- May import from `packages/xstate/` for machine patterns

### Development Dependencies
- Node 18+
- npm 9+

---

## Adding a New Component

1. **Create folder structure:**
   ```bash
   packages/components/my-component/
   ├── README.md
   ├── MyComponent.js
   ├── machine/myMachine.js
   ├── logic/createMyComponent.js
   ├── ui/MyComponent.html
   ├── domain/index.js
   └── tests/MyComponent.test.js
   ```

2. **Define machine** (`machine/myMachine.js`)
3. **Create component class** (`MyComponent.js`)
4. **Write pure logic** (`domain/*.js`)
5. **Build HTML template** (`ui/MyComponent.html`)
6. **Create factory** (`logic/createMyComponent.js`)
7. **Write tests** (`tests/MyComponent.test.js`)
8. **Document** (`README.md`)

See [`../GUIDES/creating-a-component.md`](../GUIDES/creating-a-component.md) for detailed walkthrough.

---

## File Size Reference

| Component | Minified | Gzipped |
|-----------|----------|---------|
| counter-basic | 2.1 KB | 0.8 KB |
| counter-composed | 2.8 KB | 1.0 KB |
| item | 18 KB | 5.2 KB |
| **Total** | **23 KB** | **7 KB** |

---

## Performance Tips

- **Lazy load components** — Only mount when needed
- **Reuse Alpine data** — Don't recreate on every render
- **Memoize calculations** — Cache expensive domain functions
- **Batch updates** — Group state changes before syncing UI

---

## Quick Navigation

| I want to... | File |
|--------------|------|
| See example component | `counter-basic/CounterBasic.html` |
| Understand machine pattern | `counter-basic/machine/counterMachine.js` |
| See test examples | `item/tests/Item.test.js` |
| Create new component | See `../GUIDES/creating-a-component.md` |
| Understand Item specifically | See `../ARCHITECTURE/item-component.md` |

---

**Last Updated:** 2026-02-24
**Total Tests:** 363 passing ✅
