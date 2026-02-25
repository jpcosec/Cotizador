# Component Architecture

## Overview

Components in this worktree follow a standardized pattern: **XState machine + Alpine.js + Pure domain logic**.

Each component has one clear responsibility and manages its own lifecycle through a finite state machine. This ensures predictable behavior, testability, and ease of debugging.

---

## Component Structure

```
packages/components/<component-name>/
├── <Component>.js               ← Main component class
├── machine/
│   └── <component>Machine.js   ← XState machine definition
├── logic/
│   └── create<Component>Component.js  ← Factory & mounting logic
├── domain/
│   ├── index.js                ← Export pure functions
│   ├── calculations.js         ← Domain-specific calculations
│   ├── formatting.js           ← Display string generation
│   └── rulesEngine/            ← Rule evaluation (if applicable)
├── ui/
│   └── <Component>.html        ← HTML template with Alpine bindings
└── tests/
    ├── <Component>.test.js     ← Unit + integration tests
    └── README.md               ← Test documentation
```

---

## Lifecycle Pattern

All components follow this pattern:

```
┌──────────────────┐
│  INITIALIZATION  │
│ - Load config    │
│ - Create machine │
│ - Mount HTML     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   READY/IDLE     │
│ - Listen events  │
│ - Sync UI        │
└────────┬─────────┘
         │
    ┌────┴─────┬──────────┬──────────┐<!-- This should be more generic for description of component-->
    │           │          │          │
    ▼           ▼          ▼          ▼
  USER      CALCULATE  EVALUATE    SAVE
  INPUT     CHANGES    RULES       STATE
    │           │          │          │
    └────────┬──┴──────┬───┴──────┬───┘
             │         │          │
             └────┬────┴────┬─────┘
                  │         │
                  ▼         ▼
          UPDATE CONTEXT   SYNC UI
```

### Key Phases

1. **INITIALIZATION** — Factory function creates DOM, mounts machine, initializes context
2. **IDLE** — Waiting for user interaction or external events
3. **HANDLING** — Processing events (user input, rule evaluation, calculations)
4. **SYNCING** — Pushing calculated state back to UI
5. **SAVING** — Persisting or exposing state to parent container

---

## Component Class Template

Every component follows this structure:

```javascript
// packages/components/<component>/MyComponent.js

export class MyComponent {
  #definition       // Private: component definition + rules
  #machine          // Private: XState actor
  #uiState          // Private: Alpine.js reactive state
  #userSetFields    // Private: track manual overrides

  constructor(definition, context = {}) {
    this.#definition = definition;
    // Initialize private fields
  }

  // Lifecycle methods
  async initialize() {
    // Setup machine, context, initial state
  }

  // State getters
  toDisplayObject() {
    // Return UI-friendly state snapshot
  }

  toSeed() {
    // Return serializable state for storage
  }

  static fromSeed(seed, definition) {
    // Load component from persisted state
  }

  // User-facing methods
  setMode(mode) {
    // Transition between display modes
  }

  setOverride(field, value) {
    // Mark field as user-set, update context
  }

  clearOverride(field) {
    // Clear user-set marker
  }

  // Internal: sync methods
  #syncCalculations() {
    // Recalculate domain values (pricing, quantity, rules, etc.)
  }

  #syncUI() {
    // Push changes to Alpine.js
  }
}
```

---

## State Management Pattern

### Machine Definition

```javascript
// machine/myComponentMachine.js

export const myComponentMachine = setup({
  types: {
    context: MyComponentContext,
    events: MyComponentEvents,
  },
  actions: {
    initializeContext: assign({ /* ... */ }),
    setMode: assign({ /* ... */ }),
    updateState: assign({ /* ... */ }),
    evaluateRules: assign({ /* ... */ }),
  },
  guards: {
    isValid: ({ context }, params) => { /* ... */ },
  },
}).createMachine({
  id: 'my-component',
  initial: 'uninitialized',
  states: {
    uninitialized: {
      on: { INITIALIZE: 'idle' },
    },
    idle: {
      on: {
        SET_MODE: { target: 'idle', actions: 'setMode' },
        UPDATE_STATE: { 
          target: 'recalculating',
          guard: 'isValid',
        },
      },
    },
    recalculating: {
      entry: 'evaluateRules',
      always: 'idle',
    },
  },
});
```

### Context Structure

```javascript
// Machine context contains:
{
  definition: { /* component config */ },
  
  // Display mode
  mode: 'DISPLAY_MODE_1' | 'DISPLAY_MODE_2',
  
  // Component-specific calculated values
  // (varies by component type; examples: quantities, pricing, aggregates)
  calculations: { /* domain-specific data */ },
  appliedRules: [ /* rules that matched */ ],
  
  // Tracking
  userSetFields: Set(['fieldName']),  // Fields manually set by user
  errors: [ /* blocking errors */ ],
  warnings: [ /* non-blocking warnings */ ],
}
```

---

## Domain Logic Layer

Pure functions isolated from state machine and UI:

```javascript
// domain/calculations.js
export function calculateComponentValues(definition, state, rules) {
  // No side effects, no machine access
  // Returns component-specific calculated values
}

// domain/formatting.js
export function formatDisplayString(component, format) {
  // Convert component state to human-readable string
  // Returns string suitable for UI display
}

// domain/index.js
// Re-export domain functions for clean public API
export { calculateComponentValues, formatDisplayString };
```

**Benefits:**
- ✅ Testable without mocking
- ✅ Reusable in different contexts
- ✅ Easy to understand (no state machine complexity)
- ✅ Fast (no async, no I/O)

---

## Rules Engine Integration

Rules are evaluated **per component instance** in the domain layer:

```javascript
// packages/components/<component>/domain/rulesEngine/coordinator.js

export class RulesCoordinator {
  constructor(componentType, rules) {
    this.componentType = componentType;  // ITEM, CATEGORY, KIT, CONTAINER, etc.
    this.rules = rules.filter(r => r.scope === componentType);
  }

  evaluate(snapshot) {
    // snapshot = { componentId, state fields, ... }
    // Returns { appliedRules, isAvailable, errors, warnings }
    
    const applied = [];
    for (const rule of this.rules) {
      if (this.#conditionMatches(rule, snapshot)) {
        applied.push(rule);
      }
    }
    return {
      appliedRules: applied,
      isAvailable: !applied.some(r => r.actionType === 'ERROR'),
      errors: applied.filter(r => r.actionType === 'ERROR'),
      warnings: applied.filter(r => r.actionType === 'WARNING'),
    };
  }
}
```

**Key properties:**
- Rules are **component-scoped** (filtered by component type)
- Conditions evaluated with **JSON-Logic** (`jsonLogic.apply()`)
- Results cached and **invalidated** when rules/definition change
- Errors **block** availability, warnings are **informational**

---

## UI Synchronization

Alpine.js binds to component state via a reactive proxy:

```javascript
// ui/MyComponent.html
<div x-data="componentState()" x-effect="syncState()">
  <!-- Mode-specific rendering -->
  <template x-if="mode === 'MODE_1'">
    <div class="component-view-1">
      <h3 x-text="title"></h3>
      <p x-text="description"></p>
    </div>
  </template>

  <!-- Alternative mode -->
  <template x-if="mode === 'MODE_2'">
    <div class="component-view-2">
      <input 
        x-model="state.field" 
        @change="updateField('field', $el.value)"
      />
      <span x-text="`Result: ${displayValue}`"></span>
    </div>
  </template>

  <!-- Errors & Warnings -->
  <template x-if="errors.length">
    <div class="alert alert-danger">
      <template x-for="error in errors">
        <div x-text="error.message"></div>
      </template>
    </div>
  </template>
</div>

<script>
window.componentState = function() {
  return {
    // Mirror component state
    mode: 'MODE_1',
    state: { /* component-specific fields */ },
    errors: [],
    warnings: [],
    
    // Sync updates
    syncState() {
      const display = component.toDisplayObject();
      Object.assign(this, display);
    },
    
    // Handle events
    updateField(fieldName, value) {
      component.setOverride(fieldName, value);
      this.syncState();
    },
  };
};
</script>
```

---

## Factory Pattern

Components are created via factory functions to encapsulate setup:

```javascript
// logic/createMyComponentComponent.js

export function createMyComponentComponent(definition, containerId, context = {}) {
  // 1. Create component instance
  const component = new MyComponent(definition, context);
  
  // 2. Initialize (sets up machine, domain logic)
  await component.initialize();
  
  // 3. Mount HTML
  const container = document.getElementById(containerId);
  container.innerHTML = MyComponentHTML;
  
  // 4. Connect Alpine.js
  Alpine.data('myComponentState', () => ({
    ...component.toDisplayObject(),
    updateField: (field, value) => {
      component.setOverride(field, value);
    },
  }));
  Alpine.initTree(container);
  
  // 5. Return public API
  return {
    getState: () => component.toDisplayObject(),
    setState: (newState) => MyComponent.fromSeed(newState, definition),
    setMode: (mode) => component.setMode(mode),
    on: (event, handler) => component.on(event, handler),
  };
}
```

---

## Component API (Public Surface)

Every component exposes this interface:

```typescript
interface ComponentAPI {
  // State access
  getState(): Object                    // Current display state
  setState(seed: Object): void          // Load persisted state
  
  // Mode & overrides
  setMode(mode: string): void
  setOverride(field: string, value: any): void
  clearOverride(field: string): void
  clearAllOverrides(): void
  
  // Events
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  
  // Introspection
  isUserSet(field: string): boolean
  getErrors(): Array<{message: string}>
  getWarnings(): Array<{message: string}>
}
```

---

## Testing Pattern

Tests follow the **Arrange-Act-Assert** pattern:

```javascript
describe('MyComponent', () => {
  let component;

  beforeEach(async () => {
    // ARRANGE: Create and initialize component
    component = new MyComponent(testDefinition);
    await component.initialize();
  });

  test('should calculate values correctly', () => {
    // ACT: Trigger calculation
    component.setOverride('field', testValue);
    
    // ASSERT: Verify result
    const state = component.toDisplayObject();
    expect(state.calculations).toMatchObject(expectedResult);
  });

  test('should block when rule error applies', async () => {
    // ARRANGE: Component with blocking rule
    component = new MyComponent({
      ...testDefinition,
      rules: [{ actionType: 'ERROR', condition: /* ... */ }]
    });
    await component.initialize();

    // ACT: Trigger condition
    component.setOverride('field', blockedValue);

    // ASSERT: Check blocking
    const state = component.toDisplayObject();
    expect(state.available).toBe(false);
    expect(state.errors).toHaveLength(1);
  });
});
```

---

## Key Constraints

### ✅ DO

- Keep domain functions pure (no side effects, no I/O)
- Use XState for state transitions and lifecycle
- Define all component-scoped rules in the definition
- Test pure functions independently
- Use Alpine.js for reactive UI binding only
- Cache rule evaluation results

### ❌ DON'T

- Access database from domain functions
- Modify component definition after initialization
- Call machine methods directly (use public API)
- Store derived state (recalculate on access)
- Mix async operations into domain logic
- Hardcode business rules (use JSON-Logic)

---

## Next Steps

- See [`item-component.md`](./item-component.md) for Item-specific architecture
- See [`GUIDES/creating-a-component.md`](../GUIDES/creating-a-component.md) to build a new component
- See [`rules-engine-integration.md`](./rules-engine-integration.md) for rule evaluation
