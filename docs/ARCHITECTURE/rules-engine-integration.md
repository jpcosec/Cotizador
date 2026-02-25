# Rules Engine Integration

## Overview

The **Rules Engine** is a JSON-Logic-based system that applies business constraints and transformations to components at runtime. Rules are evaluated **per component instance** after calculations, without modifying component definition.

**Location:** `packages/components/item/domain/rulesEngine/`

---

## Rule Structure

Each rule is a JavaScript object with:

```javascript
{
  // Identification
  ruleId: 'R001_OVERFLOW',
  name: 'Salon overflow surcharge',

  // Scope: which component type(s) this rule applies to
  scope: 'ITEM',  // ITEM, CATEGORY, KIT, CONTAINER, BASKET

  // Condition: when does this rule fire?
  condition: { 
    "and": [
      { "===": [{ "var": "kind" }, "MENU"] },
      { ">": [{ "var": "pax" }, 150] }
    ]
  },

  // Action: what does the rule do?
  actionType: 'MULTIPLY',           // or ADD_FIXED, WARNING, ERROR, etc.
  payload: { factor: 1.15 },        // Action-specific parameters

  // Flags
  active: true,                     // Logical enable/disable
  priority: 10,                     // Execution order (lower = first)
  acumulable: false,                // Stop processing after this rule?

  // Metadata
  description: 'When pax exceeds 150, apply 15% surcharge',
}
```

---

## How Rules Are Evaluated

### 1. **Filter by Scope**

Only rules matching the component type are considered:

```javascript
const ruleCoordinator = new RulesCoordinator('ITEM', allRules);
// Keeps only rules where scope === 'ITEM'
// Ignores CATEGORY, KIT, CONTAINER, BASKET rules
```

### 2. **Evaluate Condition**

For each active rule, evaluate the **JsonLogic condition** against the component snapshot:

```javascript
const snapshot = {
  itemId: 'SALON_01',
  kind: 'MENU',
  category: 'salón',
  pax: 175,           // User set
  cantidad: 1,
  duracionMin: 120,
  neto: 5000,
};

// Does this condition pass?
const conditionPasses = jsonLogic.apply(rule.condition, snapshot);
// → true if pax > 150
```

**Supported JsonLogic operators:**
- Comparison: `===`, `!==`, `>`, `>=`, `<`, `<=`
- Logical: `and`, `or`, `!`
- Helpers: `in`, `var`

### 3. **Apply Action**

If condition passes, execute the action:

```javascript
switch (rule.actionType) {
  case 'MULTIPLY':      // Percentage increase/decrease
    return { delta: neto * (factor - 1), description: `×${factor} (${(factor-1)*100}%)` };
  
  case 'ADD_FIXED':     // Fixed amount
    return { delta: amount, description: `$${amount} flat` };
  
  case 'WARNING':       // Informational
    return { delta: 0, description: message };
  
  case 'ERROR':         // Blocking
    return { delta: 0, isBlocking: true, description: message };
  
  case 'SET_DEFAULT':   // Set a quantity field
    return { delta: 0, field: fieldName, value: defaultValue };
}
```

### 4. **Combine Results**

All matched rules contribute to final state:

```javascript
const result = coordinator.evaluate(snapshot);

// result = {
//   appliedRules: [ruleA, ruleB, ruleC],
//   isAvailable: true,              // No blocking errors?
//   errors: [ruleB],                // ERROR-type rules
//   warnings: [ruleC],              // WARNING-type rules
//   priceAdjustment: 750,           // Sum of all deltas
// }
```

---

## RulesCoordinator Class

Main entry point for rule evaluation:

```javascript
export class RulesCoordinator {
  // Constructor: filter rules by component type
  constructor(componentType, rules = []) {
    this.componentType = componentType;
    this.rules = rules.filter(r => r.scope === componentType);
  }

  // Main evaluation method
  evaluate(snapshot) {
    // snapshot = { itemId, kind, pax, cantidad, duracionMin, ... }
    // Returns { appliedRules, isAvailable, errors, warnings }
    
    const applied = [];
    
    // Sort by priority
    const sorted = [...this.rules].sort((a, b) => a.priority - b.priority);
    
    for (const rule of sorted) {
      if (!rule.active) continue;
      
      // Evaluate condition
      const condition = rule.condition ?? true;
      const matches = jsonLogic.apply(condition, snapshot);
      
      if (matches) {
        applied.push(rule);
        
        // If not acumulable, stop here
        if (!rule.acumulable) break;
      }
    }
    
    return {
      appliedRules: applied,
      isAvailable: !applied.some(r => r.actionType === 'ERROR'),
      errors: applied.filter(r => r.actionType === 'ERROR'),
      warnings: applied.filter(r => r.actionType === 'WARNING'),
    };
  }

  // Convenience getters
  getAppliedRules() { return this.lastResult?.appliedRules ?? []; }
  isAvailable() { return this.lastResult?.isAvailable ?? true; }
  getErrors() { return this.lastResult?.errors ?? []; }
  getWarnings() { return this.lastResult?.warnings ?? []; }
}
```

---

## Integration with Item Component

### Initialization

```javascript
// Item.js constructor
export class Item {
  #rulesCoordinator;

  constructor(definition, context = {}) {
    this.#definition = definition;
    
    // Create coordinator for ITEM scope rules
    this.#rulesCoordinator = new RulesCoordinator(
      'ITEM',
      definition.rules || []
    );
  }
}
```

### Evaluation (in calculate())

```javascript
// Item.js calculate() method
calculate() {
  // ... compute quantities and pricing ...
  
  // Create snapshot for rule evaluation
  const snapshot = {
    itemId: this.#definition.itemId,
    kind: this.#definition.kind,
    category: this.#definition.category,
    pax: this.state.quantities.pax,
    cantidad: this.state.quantities.cantidad,
    duracionMin: this.state.quantities.duracionMin,
    neto: this.state.pricing.neto,
  };
  
  // Evaluate rules
  const ruleResult = this.#rulesCoordinator.evaluate(snapshot);
  
  // Store results in state
  this.state.appliedRules = ruleResult.appliedRules;
  this.state.available = ruleResult.isAvailable;
  this.state.errors = ruleResult.errors;
  this.state.warnings = ruleResult.warnings;
}
```

### Exposure in API

```javascript
// Item.js toDisplayObject()
toDisplayObject() {
  return {
    // ... other state ...
    appliedRules: this.state.appliedRules.map(r => ({
      ruleId: r.ruleId,
      name: r.name,
      description: r.description,
    })),
    available: this.state.available,
    errors: this.state.errors.map(r => ({ message: r.description })),
    warnings: this.state.warnings.map(r => ({ message: r.description })),
  };
}
```

---

## Rule Examples

### Example 1: Overflow Surcharge (Percentage Multiplier)

**Scenario:** Salons with >150 pax incur 15% surcharge

```javascript
{
  ruleId: 'R001_SALON_OVERFLOW',
  name: 'Salon overflow surcharge',
  scope: 'ITEM',
  
  condition: {
    "and": [
      { "===": [{ "var": "kind" }, "MENU"] },
      { ">": [{ "var": "pax" }, 150] }
    ]
  },
  
  actionType: 'MULTIPLY',
  payload: { factor: 1.15 },
  
  priority: 10,
  acumulable: false,  // Stop after this rule
  active: true,
}
```

**Trigger:** When `kind === 'MENU'` AND `pax > 150`
**Effect:** Price multiplied by 1.15 (+15%)

### Example 2: Minimum Pax Validation (Blocking)

**Scenario:** Coffee service requires minimum 10 pax

```javascript
{
  ruleId: 'R002_COFFEE_MIN_PAX',
  name: 'Coffee minimum pax',
  scope: 'ITEM',
  
  condition: {
    "and": [
      { "===": [{ "var": "kind" }, "EXTRA"] },
      { "<": [{ "var": "pax" }, 10] }
    ]
  },
  
  actionType: 'ERROR',
  payload: { message: 'Coffee requires minimum 10 pax' },
  
  priority: 5,
  acumulable: true,   // Continue checking other rules
  active: true,
}
```

**Trigger:** When `kind === 'EXTRA'` AND `pax < 10`
**Effect:** Item becomes unavailable (`.available = false`)

### Example 3: Warning (Non-Blocking)

**Scenario:** Alert if pax exceeds typical capacity

```javascript
{
  ruleId: 'R003_HIGH_PAX_WARNING',
  name: 'High pax warning',
  scope: 'ITEM',
  
  condition: {
    ">": [{ "var": "pax" }, 500]
  },
  
  actionType: 'WARNING',
  payload: { message: 'Pax count exceeds typical venue capacity. Contact manager.' },
  
  priority: 100,
  acumulable: true,
  active: true,
}
```

**Trigger:** When `pax > 500`
**Effect:** Added to `.warnings` array, but item remains available

### Example 4: Fixed Discount

**Scenario:** Military discount: flat $500 off

```javascript
{
  ruleId: 'R004_MILITARY_DISCOUNT',
  name: 'Military discount',
  scope: 'ITEM',
  
  condition: {
    "===": [{ "var": "discountCode" }, "MILITARY"]
  },
  
  actionType: 'ADD_FIXED',
  payload: { amount: -500 },
  
  priority: 50,
  acumulable: true,
  active: true,
}
```

**Trigger:** When `discountCode === 'MILITARY'`
**Effect:** Price reduced by $500 (negative amount = discount)

---

## Testing Rules

### Unit Test Pattern

```javascript
import { RulesCoordinator } from '../coordinator.js';

describe('RulesCoordinator', () => {
  test('should apply MULTIPLY rule when condition matches', () => {
    // ARRANGE
    const rule = {
      ruleId: 'R001',
      scope: 'ITEM',
      actionType: 'MULTIPLY',
      condition: { ">": [{ "var": "pax" }, 150] },
      payload: { factor: 1.15 },
      priority: 10,
      acumulable: false,
      active: true,
    };

    const coordinator = new RulesCoordinator('ITEM', [rule]);

    // ACT
    const snapshot = { pax: 175 };
    const result = coordinator.evaluate(snapshot);

    // ASSERT
    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0].ruleId).toBe('R001');
    expect(result.isAvailable).toBe(true);  // Not blocking
  });

  test('should block when ERROR action matches', () => {
    const rule = {
      ruleId: 'R002',
      scope: 'ITEM',
      actionType: 'ERROR',
      condition: { "<": [{ "var": "pax" }, 10] },
      payload: { message: 'Min 10 pax' },
      priority: 5,
      acumulable: true,
      active: true,
    };

    const coordinator = new RulesCoordinator('ITEM', [rule]);

    const snapshot = { pax: 5 };
    const result = coordinator.evaluate(snapshot);

    expect(result.appliedRules).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.isAvailable).toBe(false);  // BLOCKED!
  });
});
```

### Integration Test Pattern

```javascript
import { Item } from '../Item.js';

test('item should become unavailable when blocking rule applies', async () => {
  // ARRANGE: Item with blocking rule
  const definition = {
    itemId: 'COFFEE_01',
    kind: 'EXTRA',
    rules: [
      {
        ruleId: 'R001',
        scope: 'ITEM',
        actionType: 'ERROR',
        condition: { "<": [{ "var": "pax" }, 10] },
        payload: { message: 'Min 10 pax for coffee' },
        priority: 5,
        acumulable: true,
        active: true,
      }
    ]
  };

  const item = new Item(definition);
  await item.initialize();

  // ACT: Set pax to 5 (below minimum)
  item.setOverride('pax', 5);

  // ASSERT
  const state = item.toDisplayObject();
  expect(state.available).toBe(false);
  expect(state.errors).toHaveLength(1);
  expect(state.errors[0].message).toBe('Min 10 pax for coffee');
});
```

---

## Key Properties

### Scope Filtering

Rules are scoped to component types. A rule only fires if scope matches:

```javascript
const itemRules = [
  { ruleId: 'R1', scope: 'ITEM', ... },      // ✅ Included
  { ruleId: 'R2', scope: 'CATEGORY', ... },  // ❌ Filtered out
  { ruleId: 'R3', scope: 'BASKET', ... },    // ❌ Filtered out
];

const coordinator = new RulesCoordinator('ITEM', itemRules);
// Only R1 will be evaluated
```

### Priority & Acumulable

Control execution order and early termination:

```javascript
// Sorted by priority (lower = earlier)
[
  { priority: 5, acumulable: true },   // Runs first, continues
  { priority: 10, acumulable: false }, // Runs if P5 matched, stops here
  { priority: 20, acumulable: true },  // Skipped if P10 matched
]
```

### Active Flag

Disable rules without deletion:

```javascript
const inactiveRule = {
  ruleId: 'R001',
  active: false,  // ← Skipped during evaluation
  // ... rest of rule ...
};
```

### Caching

Results are cached after first evaluation:

```javascript
coordinator.evaluate(snapshot1);  // Computes all rules
coordinator.evaluate(snapshot2);  // Recomputes (new snapshot)

// Cache invalidated when:
coordinator.defineRules(newRules);  // Update rule set
```

---

## Performance Considerations

- **No I/O:** Rules use JSON-Logic only, no database access
- **Fast condition evaluation:** JsonLogic is O(n) where n = operators in condition
- **Caching:** Results cached per snapshot; invalidated on rule changes
- **Early termination:** `acumulable: false` stops loop after first match

---

## Next Steps

- See `packages/components/item/domain/rulesEngine/coordinator.test.js` for 28 test examples
- See `Item.test.js` for integration tests with rules
- See [`item-component.md`](./item-component.md) for how rules fit in Item architecture
