# Testing Components

Comprehensive guide to testing components with Vitest, Alpine.js, and Puppeteer.

---

## Test Pyramid

```
        ╱╲           E2E / Puppeteer
       ╱  ╲          (Browser automation)
      ╱    ╲         
     ╱──────╲        Integration Tests
    ╱        ╲       (Component + Machine)
   ╱──────────╲      
  ╱            ╲     Unit Tests
 ╱──────────────╲    (Pure functions, Class methods)
```

---

## Unit Tests

Test **pure functions and class methods** in isolation.

### Setup

**Location:** `tests/<Component>.test.js`

```javascript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { MyComponent } from '../MyComponent.js';
```

### Pattern: Arrange-Act-Assert (AAA)

```javascript
test('should calculate price correctly', () => {
  // ARRANGE: Set up initial state
  const component = new MyComponent({ price: 100, tax: 0.19 });
  
  // ACT: Perform action
  const result = component.calculateTotal();
  
  // ASSERT: Check result
  expect(result).toBe(119);
});
```

### Example: Testing Pure Domain Functions

```javascript
import { clampValue, validateValue } from '../domain/index.js';

describe('Domain Functions', () => {
  test('clampValue should constrain to min/max', () => {
    expect(clampValue(5, 0, 10)).toBe(5);    // Within range
    expect(clampValue(-5, 0, 10)).toBe(0);   // Below min
    expect(clampValue(15, 0, 10)).toBe(10);  // Above max
  });

  test('validateValue should return error for invalid input', () => {
    const definition = { min: 0, max: 100 };
    
    const valid = validateValue(50, definition);
    expect(valid.valid).toBe(true);
    expect(valid.error).toBeNull();
    
    const invalid = validateValue(150, definition);
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toBeTruthy();
  });
});
```

### Example: Testing Component Class

```javascript
describe('MyComponent', () => {
  let component;

  beforeEach(async () => {
    component = new MyComponent({ initial: 0, min: -10, max: 100 });
    await component.initialize();
  });

  test('should initialize with given definition', () => {
    const state = component.toDisplayObject();
    expect(state.value).toBe(0);
  });

  test('should increment value', () => {
    component.increment();
    const state = component.toDisplayObject();
    expect(state.value).toBe(1);
  });

  test('should reject invalid values', () => {
    component.setValue(150); // Beyond max
    const state = component.toDisplayObject();
    expect(state.error).toBeTruthy();
  });

  test('should track previous value', () => {
    component.setValue(50);
    component.setValue(60);
    // Verify state includes prevValue
    expect(component.toSeed().previousValue).toBe(50);
  });
});
```

---

## Integration Tests

Test **component class + machine + domain logic** together.

### Example: Complex Calculation Flow

```javascript
describe('MyComponent - Integration', () => {
  let component;

  beforeEach(async () => {
    component = new MyComponent({
      initial: 0,
      min: 0,
      max: 100,
      step: 5,
      rules: [
        { condition: val => val > 80, action: 'warn', message: 'High value' },
        { condition: val => val > 95, action: 'error', message: 'Value too high' },
      ],
    });
    await component.initialize();
  });

  test('should apply warning rule', () => {
    component.setValue(85);
    const state = component.toDisplayObject();
    expect(state.warnings).toHaveLength(1);
    expect(state.available).toBe(true); // Warning doesn't block
  });

  test('should apply blocking error rule', () => {
    component.setValue(97);
    const state = component.toDisplayObject();
    expect(state.errors).toHaveLength(1);
    expect(state.available).toBe(false); // ERROR blocks
  });

  test('should serialize and restore full state', () => {
    component.setValue(50);
    component.increment();
    
    const seed = component.toSeed();
    
    const component2 = new MyComponent(component.definition);
    await component2.initialize();
    component2.loadFromSeed(seed);
    
    expect(component2.toDisplayObject().value).toBe(55);
  });
});
```

---

## End-to-End Tests (Puppeteer)

Test **HTML + Alpine.js + Machine** in a real browser environment.

### Setup

**File:** `tests/MyComponent.e2e.test.js`

```javascript
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

describe('MyComponent - E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should render and interact with UI', async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:8090/step-my-component');
    
    // Wait for component to mount
    await page.waitForSelector('[x-data*="myComponent"]');
    
    // Check initial state
    const value = await page.$eval('.value-display', el => el.textContent);
    expect(value).toContain('0');
    
    // Click increment button
    await page.click('.btn-increment');
    await page.waitForTimeout(100); // Wait for Alpine update
    
    // Check updated value
    const newValue = await page.$eval('.value-display', el => el.textContent);
    expect(newValue).toContain('1');
  });

  test('should show error for invalid input', async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:8090/step-my-component');
    
    // Set invalid value
    await page.type('.input-value', '200', { delay: 50 });
    await page.keyboard.press('Enter');
    
    // Check error message appears
    const errorVisible = await page.waitForSelector('.alert-error');
    expect(errorVisible).toBeTruthy();
  });
});
```

### Running E2E Tests

```bash
# Start dev server
npm run serve:sandbox &

# Run E2E tests
npm run test:e2e

# Or with watch
npm run test:watch -- MyComponent.e2e.test.js
```

---

## Testing Rules Engine

### Unit: RulesCoordinator

```javascript
import { describe, test, expect } from 'vitest';
import { RulesCoordinator } from '../domain/rulesEngine/coordinator.js';

describe('RulesCoordinator', () => {
  test('should filter by component scope', () => {
    const rules = [
      { ruleId: 'R1', scope: 'ITEM', /* ... */ },
      { ruleId: 'R2', scope: 'CATEGORY', /* ... */ },
      { ruleId: 'R3', scope: 'BASKET', /* ... */ },
    ];

    const coordinator = new RulesCoordinator('ITEM', rules);
    // Only R1 should be evaluated
    const applied = coordinator.getAppliedRules();
    expect(applied).toHaveLength(0); // No matches yet
  });

  test('should evaluate JSON-Logic conditions', () => {
    const rule = {
      ruleId: 'R1',
      scope: 'ITEM',
      condition: { ">": [{ "var": "pax" }, 100] },
      actionType: 'WARNING',
      payload: { message: 'High pax' },
      priority: 10,
      acumulable: true,
      active: true,
    };

    const coordinator = new RulesCoordinator('ITEM', [rule]);

    const result = coordinator.evaluate({ pax: 150 });
    expect(result.appliedRules).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  test('should stop at non-acumulable rule', () => {
    const rules = [
      {
        ruleId: 'R1',
        scope: 'ITEM',
        condition: true,
        actionType: 'MULTIPLY',
        payload: { factor: 1.1 },
        priority: 5,
        acumulable: false,  // ← STOPS HERE
        active: true,
      },
      {
        ruleId: 'R2',
        scope: 'ITEM',
        condition: true,
        actionType: 'ADD_FIXED',
        payload: { amount: 100 },
        priority: 10,
        acumulable: true,
        active: true,
      },
    ];

    const coordinator = new RulesCoordinator('ITEM', rules);
    const result = coordinator.evaluate({});
    
    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0].ruleId).toBe('R1');
    // R2 was skipped due to acumulable: false on R1
  });
});
```

### Integration: Item + Rules

```javascript
import { Item } from '../Item.js';

describe('Item - Rules Integration', () => {
  test('should block when rule error applies', async () => {
    const definition = {
      itemId: 'COFFEE_01',
      kind: 'EXTRA',
      category: 'extras',
      rules: [
        {
          ruleId: 'MIN_PAX',
          scope: 'ITEM',
          condition: { "<": [{ "var": "pax" }, 10] },
          actionType: 'ERROR',
          payload: { message: 'Minimum 10 pax' },
          priority: 5,
          acumulable: true,
          active: true,
        },
      ],
    };

    const item = new Item(definition);
    await item.initialize();

    // Set pax below minimum
    item.setOverride('pax', 5);

    // Check state
    const state = item.toDisplayObject();
    expect(state.available).toBe(false);
    expect(state.errors).toHaveLength(1);
    expect(state.errors[0].message).toBe('Minimum 10 pax');
  });

  test('should apply multiple rules', async () => {
    const definition = {
      itemId: 'SALON_01',
      kind: 'MENU',
      category: 'salón',
      rules: [
        {
          ruleId: 'OVERFLOW',
          scope: 'ITEM',
          condition: { ">": [{ "var": "pax" }, 150] },
          actionType: 'MULTIPLY',
          payload: { factor: 1.15 },
          priority: 10,
          acumulable: true,
          active: true,
        },
        {
          ruleId: 'EXTREME',
          scope: 'ITEM',
          condition: { ">": [{ "var": "pax" }, 500] },
          actionType: 'WARNING',
          payload: { message: 'Capacity concern' },
          priority: 20,
          acumulable: true,
          active: true,
        },
      ],
    };

    const item = new Item(definition);
    await item.initialize();
    item.setOverride('pax', 600);

    const state = item.toDisplayObject();
    expect(state.appliedRules).toHaveLength(2);
    expect(state.warnings).toHaveLength(1);
    expect(state.available).toBe(true); // Warnings don't block
  });
});
```

---

## Test Data & Fixtures

### Create Test Fixtures

**File:** `tests/fixtures.js`

```javascript
export const defaultItemDefinition = {
  itemId: 'TEST_ITEM',
  kind: 'MENU',
  category: 'salón',
  pricingProfile: {
    basePax: 10,
    baseNeto: 5000,
    durMin: 60,
    durMax: 480,
  },
  categoryDefaults: {
    pax: 50,
    cantidad: 1,
    durMin: 120,
  },
  rules: [],
};

export const rulesFixture = {
  blocking: {
    ruleId: 'MIN_PAX',
    scope: 'ITEM',
    condition: { "<": [{ "var": "pax" }, 10] },
    actionType: 'ERROR',
    payload: { message: 'Min 10 pax' },
    priority: 5,
    acumulable: true,
    active: true,
  },
  surcharge: {
    ruleId: 'OVERFLOW',
    scope: 'ITEM',
    condition: { ">": [{ "var": "pax" }, 150] },
    actionType: 'MULTIPLY',
    payload: { factor: 1.15 },
    priority: 10,
    acumulable: false,
    active: true,
  },
};
```

### Use in Tests

```javascript
import { defaultItemDefinition, rulesFixture } from './fixtures.js';

test('should apply surcharge rule', async () => {
  const definition = {
    ...defaultItemDefinition,
    rules: [rulesFixture.surcharge],
  };
  
  const item = new Item(definition);
  await item.initialize();
  // ... test
});
```

---

## Coverage Goals

Aim for coverage in this order:

1. **Critical paths** → 100% (core business logic)
2. **Happy paths** → 90%+ (normal user workflows)
3. **Edge cases** → 80%+ (boundaries, errors)
4. **Error handling** → 75%+ (error states)

Check coverage:

```bash
npm test -- --coverage
```

---

## Best Practices

### ✅ DO

- ✅ Test one thing per test (single responsibility)
- ✅ Use descriptive test names: `should do X when Y`
- ✅ Arrange-Act-Assert structure
- ✅ Create reusable fixtures
- ✅ Mock external dependencies
- ✅ Test both success and failure paths
- ✅ Use before/afterEach for setup/cleanup
- ✅ Keep tests independent (no shared state)

### ❌ DON'T

- ❌ Test implementation details (test behavior)
- ❌ Multiple assertions with different purposes in one test
- ❌ Hardcoded values (use constants/fixtures)
- ❌ Skip error cases
- ❌ Rely on execution order
- ❌ Test external libraries (trust them)
- ❌ Mock everything (only external dependencies)
- ❌ Write tests that are flaky/timing-dependent

---

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific file
npm test -- Item.test.js

# Run with grep filter
npm test -- --grep "should calculate price"

# Run with coverage
npm test -- --coverage

# Run E2E only
npm test -- MyComponent.e2e.test.js
```

---

## Debugging Tests

### Add Debug Output

```javascript
test('my test', () => {
  const result = component.calculate();
  console.log('Result:', result);  // Visible with npm run test:watch
  expect(result).toBe(expected);
});
```

### Use Debugger

```javascript
test('my test', () => {
  debugger;  // Will pause when running with Node debugging
  const result = component.calculate();
  expect(result).toBe(expected);
});
```

```bash
node --inspect-brk node_modules/vitest/vitest.mjs run tests/MyComponent.test.js
# Then open chrome://inspect in Chrome
```

### Browser Debugging (Puppeteer)

```javascript
const browser = await puppeteer.launch({
  headless: false,  // ← See the browser!
  slowMo: 100,      // ← Slow down operations
});
```

---

## Next Steps

- See existing test examples: `packages/components/item/tests/`
- Run the test suite: `npm test`
- Check coverage: `npm test -- --coverage`
- Create a new component test: Follow [`creating-a-component.md`](./creating-a-component.md)
