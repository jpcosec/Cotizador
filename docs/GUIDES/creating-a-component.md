# Creating a New Component

Step-by-step guide to build a new component following the rebuild patterns.

---

## Prerequisites

- Understand [component-architecture.md](../ARCHITECTURE/component-architecture.md)
- Familiar with XState basics
- Know JavaScript (ES2020+) and Alpine.js
- Can write and run Vitest tests

---

## Step 1: Plan the Component

### Define the responsibility

What does this component do? Keep it **singular and focused**.

```
Good: "Display and manage quantity selection"
Bad:  "Display, manage, validate, save, and export quantity with analytics"
```

### Identify states

What states will the component occupy?

```
Example: QuantitySelector
- IDLE           (waiting for user input)
- VALIDATING     (checking bounds)
- CONFIRMED      (user accepted)
- ERROR          (invalid input)
```

### List events

What events trigger state changes?

```
- SET_VALUE
- INCREMENT
- DECREMENT
- RESET
- VALIDATE
```

### Define context

What data does the component hold?

```javascript
{
  definition: { min, max, step },
  value: number,
  prevValue: number,
  error: string | null,
}
```

---

## Step 2: Create Folder Structure

```bash
cd packages/components

mkdir my-component
cd my-component

mkdir machine logic ui domain tests
touch README.md MyComponent.js

cd machine && touch myMachine.js && cd ..
cd logic && touch createMyComponent.js && cd ..
cd ui && touch MyComponent.html && cd ..
cd domain && touch index.js && cd ..
cd tests && touch README.md MyComponent.test.js && cd ..
```

Result:
```
packages/components/my-component/
├── README.md
├── MyComponent.js
├── machine/myMachine.js
├── logic/createMyComponent.js
├── ui/MyComponent.html
├── domain/index.js
└── tests/
    ├── README.md
    └── MyComponent.test.js
```

---

## Step 3: Define the XState Machine

**File:** `machine/myMachine.js`

```javascript
import { setup } from 'xstate';

/**
 * Machine definition for MyComponent
 * Manages state transitions and context updates
 */
export const myMachine = setup({
  types: {
    context: {
      definition: { /* component config */ },
      value: 0,
      prevValue: 0,
      error: null,
    },
    events: {
      SET_VALUE: { value: 'number' },
      INCREMENT: {},
      DECREMENT: {},
      RESET: {},
      VALIDATE: {},
    },
  },
  actions: {
    initializeContext: ({ context }, params) => {
      // Initialize context from definition
      return {
        definition: params.definition,
        value: params.definition.initial ?? 0,
        prevValue: params.definition.initial ?? 0,
        error: null,
      };
    },
    setValue: ({ context }, params) => {
      return {
        ...context,
        prevValue: context.value,
        value: params.value,
      };
    },
    setError: ({ context }, params) => {
      return {
        ...context,
        error: params.message,
      };
    },
    clearError: ({ context }) => {
      return {
        ...context,
        error: null,
      };
    },
  },
  guards: {
    isValidValue: ({ context }, params) => {
      const { min = -Infinity, max = Infinity } = context.definition;
      return params.value >= min && params.value <= max;
    },
  },
}).createMachine({
  id: 'my-component',
  initial: 'uninitialized',
  context: {
    definition: {},
    value: 0,
    prevValue: 0,
    error: null,
  },
  states: {
    uninitialized: {
      on: {
        INITIALIZE: {
          target: 'idle',
          actions: 'initializeContext',
        },
      },
    },
    idle: {
      on: {
        SET_VALUE: {
          guard: 'isValidValue',
          target: 'validating',
          actions: 'setValue',
        },
        INCREMENT: {
          target: 'validating',
          actions: ({ context }) => ({
            ...context,
            value: context.value + (context.definition.step ?? 1),
          }),
        },
        DECREMENT: {
          target: 'validating',
          actions: ({ context }) => ({
            ...context,
            value: context.value - (context.definition.step ?? 1),
          }),
        },
        RESET: {
          actions: ({ context }) => ({
            ...context,
            value: context.definition.initial ?? 0,
            error: null,
          }),
        },
      },
    },
    validating: {
      entry: 'clearError',
      always: 'idle',
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'clearError',
        },
      },
    },
  },
});
```

---

## Step 4: Create the Component Class

**File:** `MyComponent.js`

```javascript
import { createActor } from 'xstate';
import { myMachine } from './machine/myMachine.js';

/**
 * MyComponent - manages the component lifecycle and public API
 */
export class MyComponent {
  #definition;      // Component configuration
  #actor;           // XState actor
  #state;           // Current state

  constructor(definition = {}) {
    this.#definition = definition;
  }

  /**
   * Initialize the component (async setup)
   */
  async initialize() {
    // Create actor from machine
    this.#actor = createActor(myMachine);
    this.#actor.start();

    // Send initialization event
    this.#actor.send({
      type: 'INITIALIZE',
      definition: this.#definition,
    });

    // Store current state
    this.#state = this.#actor.getSnapshot();
  }

  /**
   * Get current state as display object (UI-friendly)
   */
  toDisplayObject() {
    const snapshot = this.#actor?.getSnapshot();
    if (!snapshot) return {};

    return {
      value: snapshot.context.value,
      error: snapshot.context.error,
      isValid: !snapshot.context.error,
      state: snapshot.status,
    };
  }

  /**
   * Load state from seed (serialized state)
   */
  loadFromSeed(seed) {
    if (seed.value !== undefined) {
      this.#actor.send({
        type: 'SET_VALUE',
        value: seed.value,
      });
    }
  }

  /**
   * Serialize component state
   */
  toSeed() {
    return {
      value: this.#state.context.value,
    };
  }

  // === Public API ===

  setValue(value) {
    this.#actor.send({
      type: 'SET_VALUE',
      value,
    });
    this.#state = this.#actor.getSnapshot();
  }

  increment() {
    this.#actor.send({ type: 'INCREMENT' });
    this.#state = this.#actor.getSnapshot();
  }

  decrement() {
    this.#actor.send({ type: 'DECREMENT' });
    this.#state = this.#actor.getSnapshot();
  }

  reset() {
    this.#actor.send({ type: 'RESET' });
    this.#state = this.#actor.getSnapshot();
  }

  // === Introspection ===

  getValue() {
    return this.#state.context.value;
  }

  getError() {
    return this.#state.context.error;
  }

  isValid() {
    return !this.#state.context.error;
  }

  // === Event handling ===

  on(eventName, handler) {
    if (!this.#actor.subscribe) return;
    
    const unsubscribe = this.#actor.subscribe((snapshot) => {
      if (snapshot.status === eventName) {
        handler(snapshot);
      }
    });

    return unsubscribe;
  }
}
```

---

## Step 5: Write Pure Domain Logic

**File:** `domain/index.js`

```javascript
/**
 * Pure functions for MyComponent calculations
 * No side effects, no I/O, no machine access
 */

export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function validateValue(value, definition) {
  const { min = -Infinity, max = Infinity } = definition;
  
  if (value < min) {
    return {
      valid: false,
      error: `Value must be at least ${min}`,
    };
  }
  
  if (value > max) {
    return {
      valid: false,
      error: `Value must be at most ${max}`,
    };
  }
  
  return { valid: true, error: null };
}

export function formatValue(value, definition) {
  const { prefix = '', suffix = '' } = definition;
  return `${prefix}${value}${suffix}`;
}
```

---

## Step 6: Create HTML Template

**File:** `ui/MyComponent.html`

```html
<div id="my-component" x-data="myComponentState()" class="my-component">
  <!-- Display current value -->
  <div class="value-display">
    <span class="label">Value:</span>
    <span class="value" x-text="formatValue(value)"></span>
  </div>

  <!-- Controls -->
  <div class="controls">
    <button @click="decrement()" class="btn btn-decrement">-</button>
    <input 
      x-model.number="value" 
      @change="setValue($el.value)"
      type="number"
      class="input-value"
    />
    <button @click="increment()" class="btn btn-increment">+</button>
    <button @click="reset()" class="btn btn-reset">Reset</button>
  </div>

  <!-- Error message -->
  <template x-if="error">
    <div class="alert alert-error" x-text="error"></div>
  </template>
</div>

<script>
window.myComponentState = function() {
  return {
    value: 0,
    error: null,

    formatValue(val) {
      return `${val}`;
    },

    setValue(val) {
      this.value = parseInt(val, 10);
      // In real component, would send event to machine
    },

    increment() {
      this.value += 1;
    },

    decrement() {
      this.value -= 1;
    },

    reset() {
      this.value = 0;
      this.error = null;
    },
  };
};
</script>
```

---

## Step 7: Create Factory Function

**File:** `logic/createMyComponent.js`

```javascript
import { MyComponent } from '../MyComponent.js';
import templateHtml from '../ui/MyComponent.html?raw';

/**
 * Factory function to create and mount MyComponent
 * 
 * @param {Object} definition - Component configuration
 * @param {string} containerId - DOM element ID where to mount
 * @returns {Object} Public API for the mounted component
 */
export async function createMyComponent(definition = {}, containerId) {
  // 1. Create component instance
  const component = new MyComponent(definition);

  // 2. Initialize (async setup)
  await component.initialize();

  // 3. Mount DOM
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container #${containerId} not found`);
  }
  container.innerHTML = templateHtml;

  // 4. Connect Alpine.js
  const displayObject = component.toDisplayObject();
  
  Alpine.data('myComponentState', () => ({
    ...displayObject,

    // Public methods
    setValue(value) {
      component.setValue(value);
      Object.assign(this, component.toDisplayObject());
    },

    increment() {
      component.increment();
      Object.assign(this, component.toDisplayObject());
    },

    decrement() {
      component.decrement();
      Object.assign(this, component.toDisplayObject());
    },

    reset() {
      component.reset();
      Object.assign(this, component.toDisplayObject());
    },

    formatValue(val) {
      return val; // Or use domain logic here
    },
  }));

  Alpine.initTree(container);

  // 5. Return public API
  return {
    getState: () => component.toDisplayObject(),
    setState: (state) => component.loadFromSeed(state),
    getValue: () => component.getValue(),
    setValue: (val) => component.setValue(val),
    increment: () => component.increment(),
    decrement: () => component.decrement(),
    reset: () => component.reset(),
    on: (event, handler) => component.on(event, handler),
  };
}
```

---

## Step 8: Write Tests

**File:** `tests/MyComponent.test.js`

```javascript
import { describe, test, expect, beforeEach } from 'vitest';
import { MyComponent } from '../MyComponent.js';

describe('MyComponent', () => {
  let component;

  beforeEach(async () => {
    // ARRANGE: Create and initialize
    component = new MyComponent({
      initial: 0,
      min: -10,
      max: 100,
      step: 1,
    });
    await component.initialize();
  });

  test('should initialize with given value', () => {
    // ASSERT
    expect(component.getValue()).toBe(0);
    expect(component.isValid()).toBe(true);
  });

  test('should increment value', () => {
    // ACT
    component.increment();

    // ASSERT
    expect(component.getValue()).toBe(1);
  });

  test('should decrement value', () => {
    // ACT
    component.decrement();

    // ASSERT
    expect(component.getValue()).toBe(-1);
  });

  test('should validate bounds (max)', () => {
    // ACT
    component.setValue(150);

    // ASSERT (invalid because > max)
    expect(component.isValid()).toBe(false);
    expect(component.getError()).toBeTruthy();
  });

  test('should validate bounds (min)', () => {
    // ACT
    component.setValue(-20);

    // ASSERT (invalid because < min)
    expect(component.isValid()).toBe(false);
  });

  test('should reset to initial value', () => {
    // ARRANGE
    component.setValue(50);

    // ACT
    component.reset();

    // ASSERT
    expect(component.getValue()).toBe(0);
    expect(component.isValid()).toBe(true);
  });

  test('should serialize and restore state', () => {
    // ARRANGE
    component.setValue(42);
    const seed = component.toSeed();

    // Create new instance
    const component2 = new MyComponent({ initial: 0, min: 0, max: 100 });
    await component2.initialize();

    // ACT
    component2.loadFromSeed(seed);

    // ASSERT
    expect(component2.getValue()).toBe(42);
  });
});
```

---

## Step 9: Document the Component

**File:** `README.md`

```markdown
# MyComponent

Brief description of what this component does.

## Features

- Feature 1
- Feature 2
- Feature 3

## States

- **IDLE** — Waiting for user input
- **VALIDATING** — Checking bounds
- **ERROR** — Invalid input

## Usage

\`\`\`javascript
import { createMyComponent } from './logic/createMyComponent.js';

const component = await createMyComponent(
  { initial: 0, min: -10, max: 100 },
  'container-id'
);

component.setValue(50);
component.increment();

const state = component.getState();
console.log(state.value);  // 51
\`\`\`

## API

### Methods

- `getValue()` — Get current value
- `setValue(value)` — Set value (with validation)
- `increment()` — Add 1
- `decrement()` — Subtract 1
- `reset()` — Reset to initial value
- `isValid()` — Check if current state is valid
- `getError()` — Get error message if invalid

### Events

- `change` — Fired when value changes
- `error` — Fired when validation fails

## Tests

\`\`\`bash
npm test -- MyComponent.test.js
\`\`\`

All tests passing: ✅

## Files

- `MyComponent.js` — Component class
- `machine/myMachine.js` — XState machine definition
- `domain/index.js` — Pure calculation functions
- `ui/MyComponent.html` — HTML template
- `logic/createMyComponent.js` — Factory & mounting
- `tests/MyComponent.test.js` — Unit tests
```

---

## Step 10: Test and Validate

```bash
# Run tests
npm test -- MyComponent.test.js

# Watch mode during development
npm run test:watch -- MyComponent.test.js

# Check that all tests pass
npm test
```

---

## Checklist

- ✅ Folder structure created
- ✅ Machine defined (`machine/myMachine.js`)
- ✅ Component class created (`MyComponent.js`)
- ✅ Pure domain logic written (`domain/index.js`)
- ✅ HTML template built (`ui/MyComponent.html`)
- ✅ Factory function created (`logic/createMyComponent.js`)
- ✅ Tests written (`tests/MyComponent.test.js`)
- ✅ Documentation complete (`README.md`)
- ✅ All tests passing
- ✅ No external dependencies added
- ✅ Component is self-contained

---

## Common Mistakes to Avoid

❌ **DON'T:** Access the machine directly in UI code
```javascript
// Bad
const actor = component._actor.send(...);
```
✅ **DO:** Use public component API
```javascript
// Good
component.setValue(value);
```

❌ **DON'T:** Put I/O or async in domain functions
```javascript
// Bad
export function fetchData() { return fetch(...); }
```
✅ **DO:** Keep domain pure
```javascript
// Good
export function processData(data) { return transformed; }
```

❌ **DON'T:** Hardcode configuration
```javascript
// Bad
const MAX = 100;
```
✅ **DO:** Use definition parameter
```javascript
// Good
const { max = 100 } = definition;
```

---

## Next Steps

- Review [`../ARCHITECTURE/component-architecture.md`](../ARCHITECTURE/component-architecture.md)
- Check existing components: `counter-basic/`, `item/`
- Run: `npm test` to see tests in action
- Deploy to sandbox: `npm run serve:sandbox`
