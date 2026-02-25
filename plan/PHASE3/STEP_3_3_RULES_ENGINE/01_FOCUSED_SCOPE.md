# Step 3.3 - Focused Scope: Item-Level Rules Engine

## What We're Doing

**One focused objective:** Make rules engine **testable at Item level**

- ✅ Create RulesCoordinator class
- ✅ Integrate with Item.js
- ✅ Test thoroughly
- ✅ Make sure 363 tests still pass

## What We're NOT Doing (Yet)

- ❌ Inheritance mechanism (that's Step 3.4)
- ❌ Database integration (that's Step 3.5+)
- ❌ Basket/Container rules logic (that's Step 3.6+)
- ❌ Complex rule composition (keep it simple)

---

## Architecture at Item Level Only

```
┌─────────────────────────────────────────┐
│ Item Constructor                        │
├─────────────────────────────────────────┤
│                                         │
│  constructor(itemData, componentRules) │
│    ↓                                    │
│    this.rulesCoordinator =              │
│      new RulesCoordinator('ITEM',       │
│                           componentRules)
│    ↓                                    │
│    this.ruleResult =                    │
│      rulesCoordinator.evaluate({        │
│        itemId,                          │
│        pax,                             │
│        duration,                        │
│        ...                              │
│      })                                 │
│    ↓                                    │
│    // Store result for toDisplayObject()│
│    // That's it!                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Plan

### File Structure
```
packages/components/item/domain/rulesEngine/
├── coordinator.js          ← Core class
└── coordinator.test.js     ← Tests

packages/components/item/Item.js           ← Add rulesCoordinator
packages/components/item/tests/Item.test.js ← Add rule integration tests
```

### Phase 3.3a: RulesCoordinator (1 hour)

**Create:** `packages/components/item/domain/rulesEngine/coordinator.js`

```javascript
class RulesCoordinator {
  constructor(componentType, allRules = []) {
    this.componentType = componentType;

    // Filter ONCE at construction
    this.rules = allRules
      .filter(r =>
        r.componentType === componentType &&
        r.active !== false
      )
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    this.cached = null;
  }

  evaluate(snapshot) {
    // Return cached if already evaluated
    if (this.cached !== null) {
      return this.cached;
    }

    const result = {
      appliedRules: [],
      errors: [],
      warnings: [],
      available: true,
    };

    for (const rule of this.rules) {
      // Skip if condition doesn't match
      if (!this.evaluateCondition(rule.conditionJson, snapshot)) {
        continue;
      }

      // Execute action
      const actionResult = this.executeAction(
        rule.actionType,
        rule.payloadJson
      );

      // Record applied rule
      result.appliedRules.push({
        id: rule.id,
        type: rule.actionType,
        priority: rule.priority,
        human: this.humanizeRule(rule),
        ...actionResult,
      });

      // Handle blocking
      if (actionResult.type === 'ERROR') {
        result.errors.push(actionResult);
        if (rule.blocking !== false) {
          result.available = false;
        }
      }

      // Handle warnings
      if (actionResult.type === 'WARNING') {
        result.warnings.push(actionResult);
      }

      // Stop if not accumulative
      if (!rule.accumulative && result.errors.length > 0) {
        break;
      }
    }

    this.cached = result;
    return result;
  }

  evaluateCondition(conditionJson, data) {
    if (!conditionJson) return true;

    const logic = typeof conditionJson === 'string'
      ? JSON.parse(conditionJson)
      : conditionJson;

    // Use json-logic-js
    const jsonLogic = require('json-logic-js');
    return jsonLogic.apply(logic, data);
  }

  executeAction(actionType, payloadJson) {
    const payload = typeof payloadJson === 'string'
      ? JSON.parse(payloadJson)
      : payloadJson;

    // Action handlers
    const handlers = {
      ERROR: (p) => ({
        type: 'ERROR',
        message: p.message || 'Invalid',
        blocking: true,
      }),
      WARNING: (p) => ({
        type: 'WARNING',
        message: p.message || 'Warning',
      }),
    };

    const handler = handlers[actionType];
    if (!handler) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    return handler(payload);
  }

  humanizeRule(rule) {
    const condition = this.humanizeCondition(rule.conditionJson);
    const action = this.humanizePayload(rule.actionType, rule.payloadJson);
    return `${condition} → ${action}`;
  }

  humanizeCondition(conditionJson) {
    const logic = typeof conditionJson === 'string'
      ? JSON.parse(conditionJson)
      : conditionJson;

    if (logic === true) return 'always';
    if (logic === false) return 'never';
    if (!logic) return 'no condition';

    return JSON.stringify(logic);
  }

  humanizePayload(actionType, payloadJson) {
    const payload = typeof payloadJson === 'string'
      ? JSON.parse(payloadJson)
      : payloadJson;

    if (actionType === 'ERROR') return `❌ ${payload.message}`;
    if (actionType === 'WARNING') return `⚠️ ${payload.message}`;

    return actionType;
  }

  getAppliedRules() { return this.cached?.appliedRules || []; }
  isAvailable() { return this.cached?.available ?? true; }
  getErrors() { return this.cached?.errors || []; }
  getWarnings() { return this.cached?.warnings || []; }
}

export { RulesCoordinator };
```

### Phase 3.3b: Item Integration (45 min)

**Update:** `packages/components/item/Item.js`

```javascript
import { RulesCoordinator } from './domain/rulesEngine/coordinator.js';

class Item {
  constructor(itemData, context = {}) {
    this.data = itemData;
    this.context = context;

    // Initialize pricing
    this.quantities = {
      pax: context.pax || 1,
      cantidad: context.cantidad || 1,
      duracionMin: context.duracionMin || 0,
    };

    // NEW: Initialize rules coordinator
    const componentRules = context.componentRules || [];
    this.rulesCoordinator = new RulesCoordinator('ITEM', componentRules);

    // NEW: Evaluate rules once at construction
    this.ruleResult = this.rulesCoordinator.evaluate({
      itemId: this.data.ID_Item,
      pax: this.quantities.pax,
      duration: this.quantities.duracionMin,
      cantidad: this.quantities.cantidad,
    });
  }

  calculate(context) {
    // ... existing pricing logic ...
    const pricing = this.compute(context);

    return {
      ...pricing,
      // NEW: Include rule results
      appliedRules: this.ruleResult.appliedRules,
      available: this.ruleResult.available,
      errors: this.ruleResult.errors,
      warnings: this.ruleResult.warnings,
    };
  }

  toDisplayObject() {
    return {
      // ... existing fields ...
      appliedRules: this.ruleResult?.appliedRules || [],
      available: this.ruleResult?.available ?? true,
      ruleErrors: this.ruleResult?.errors || [],
      ruleWarnings: this.ruleResult?.warnings || [],
    };
  }
}
```

### Phase 3.3c: Testing (45 min)

**Create:** `packages/components/item/domain/rulesEngine/coordinator.test.js`

```javascript
describe('RulesCoordinator', () => {
  describe('constructor', () => {
    it('filters rules by componentType', () => {
      const allRules = [
        { id: 'R1', componentType: 'ITEM', active: true, priority: 1 },
        { id: 'R2', componentType: 'CATEGORY', active: true, priority: 1 },
      ];
      const coord = new RulesCoordinator('ITEM', allRules);
      expect(coord.rules).toHaveLength(1);
      expect(coord.rules[0].id).toBe('R1');
    });

    it('sorts by priority', () => {
      const allRules = [
        { id: 'R1', componentType: 'ITEM', priority: 20 },
        { id: 'R2', componentType: 'ITEM', priority: 10 },
      ];
      const coord = new RulesCoordinator('ITEM', allRules);
      expect(coord.rules[0].id).toBe('R2');
      expect(coord.rules[1].id).toBe('R1');
    });

    it('skips inactive rules', () => {
      const allRules = [
        { id: 'R1', componentType: 'ITEM', active: true },
        { id: 'R2', componentType: 'ITEM', active: false },
      ];
      const coord = new RulesCoordinator('ITEM', allRules);
      expect(coord.rules).toHaveLength(1);
    });
  });

  describe('evaluate', () => {
    it('evaluates condition and returns result', () => {
      const rules = [
        {
          id: 'R_MAX_PAX',
          componentType: 'ITEM',
          active: true,
          conditionJson: { '>': [{ 'var': 'pax' }, 320] },
          actionType: 'ERROR',
          payloadJson: { message: 'Too many pax' },
          priority: 10,
        },
      ];
      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({ itemId: 'X', pax: 350 });

      expect(result.available).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.appliedRules).toHaveLength(1);
    });

    it('caches result on second evaluation', () => {
      const rules = [
        {
          id: 'R1',
          componentType: 'ITEM',
          conditionJson: true,
          actionType: 'WARNING',
          payloadJson: { message: 'test' },
          priority: 1,
        },
      ];
      const coord = new RulesCoordinator('ITEM', rules);
      const result1 = coord.evaluate({ pax: 10 });
      const result2 = coord.evaluate({ pax: 20 });

      expect(result1).toBe(result2); // Same object (cached)
    });

    it('skips rules with unmatched conditions', () => {
      const rules = [
        {
          id: 'R1',
          componentType: 'ITEM',
          conditionJson: { '===': [{ 'var': 'pax' }, 999] },
          actionType: 'ERROR',
          payloadJson: { message: 'Not matched' },
          priority: 1,
        },
      ];
      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({ pax: 50 });

      expect(result.appliedRules).toHaveLength(0);
      expect(result.available).toBe(true);
    });
  });

  describe('action handlers', () => {
    it('handles ERROR action', () => {
      const coord = new RulesCoordinator('ITEM', []);
      const result = coord.executeAction('ERROR', { message: 'Test error' });
      expect(result.type).toBe('ERROR');
      expect(result.message).toBe('Test error');
    });

    it('handles WARNING action', () => {
      const coord = new RulesCoordinator('ITEM', []);
      const result = coord.executeAction('WARNING', { message: 'Test warning' });
      expect(result.type).toBe('WARNING');
      expect(result.message).toBe('Test warning');
    });

    it('throws on unknown action type', () => {
      const coord = new RulesCoordinator('ITEM', []);
      expect(() => coord.executeAction('UNKNOWN', {})).toThrow();
    });
  });
});
```

**Add to:** `packages/components/item/tests/Item.test.js`

```javascript
describe('Item with Rules', () => {
  it('creates RulesCoordinator in constructor', () => {
    const item = new Item(
      { ID_Item: 'TEST', ... },
      { componentRules: [] }
    );
    expect(item.rulesCoordinator).toBeDefined();
  });

  it('evaluates rules at construction', () => {
    const rules = [
      {
        id: 'R1',
        componentType: 'ITEM',
        conditionJson: { '>': [{ 'var': 'pax' }, 100] },
        actionType: 'ERROR',
        payloadJson: { message: 'Too many' },
        priority: 1,
      },
    ];
    const item = new Item(
      { ID_Item: 'TEST', ... },
      { componentRules: rules, pax: 150 }
    );
    expect(item.ruleResult.errors).toHaveLength(1);
  });

  it('includes rules in toDisplayObject', () => {
    const item = new Item({ ID_Item: 'TEST', ... }, { componentRules: [] });
    const display = item.toDisplayObject();
    expect(display.appliedRules).toBeDefined();
    expect(display.available).toBeDefined();
  });
});
```

---

## Implementation Checklist

- [ ] Create `packages/components/item/domain/rulesEngine/coordinator.js`
- [ ] Import json-logic-js properly
- [ ] Implement RulesCoordinator class with all methods
- [ ] Add evaluate() method with caching
- [ ] Add action handlers (ERROR, WARNING)
- [ ] Add humanization methods
- [ ] Update Item.js constructor (add rulesCoordinator)
- [ ] Update Item.calculate() (include rule results)
- [ ] Update Item.toDisplayObject() (expose appliedRules, available)
- [ ] Create coordinator.test.js with 15-20 tests
- [ ] Add Item integration tests (3-5 tests)
- [ ] Verify 363 existing tests still pass
- [ ] Run full test suite
- [ ] Code review and approval

---

## Success Criteria

✅ RulesCoordinator filters by componentType
✅ Rules evaluated once, result cached
✅ Caching prevents re-evaluation
✅ evaluateCondition() uses json-logic-js
✅ executeAction() dispatches to handlers
✅ Humanization works for display
✅ Item integration seamless
✅ toDisplayObject() includes rule results
✅ 363 existing tests pass
✅ 15-20 new coordinator tests pass
✅ 3-5 new Item integration tests pass

---

## Not in Scope (Step 3.3)

- Inheritance mechanism
- Database integration
- Multiple component types (just ITEM for now)
- Complex action types (just ERROR, WARNING for now)
- Rule updates/invalidation
