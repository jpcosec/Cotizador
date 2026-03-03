# Item Component Architecture

## Overview

The **Item Component** is the flagship rebuilt component for the SF Lodge quotation system. It manages a single item (menu selection) across two visual modes: **CATALOG** (browse/select) and **BASKET** (order/adjust).

**Location:** `packages/components/item/`

---

## Item Concept

An **Item** represents a specific menu offering with:

- **Static properties:** Name, category, kind (menu, service, extra, setup)
- **Pricing:** Base neto, configurable by duration/quantity
- **Quantity dimensions:** Pax (guests), cantidad (units), duracionMin (minutes)
- **Defaults:** Category-driven defaults for each dimension
- **Rules:** Business rules (blocking, warnings, adjustments) per item scope
- **User overrides:** Track which fields user manually set

### Example Items

| Name | Kind | Category | Base Price | Duration | Pax |
|------|------|----------|-----------|----------|-----|
| Salon | menu | salón | $50/h | 60-480 min | 10-200 |
| Coffee | extra | extras | $2 | None | 1-50 |
| Setup | service | servicio | $1500 flat | 0 | N/A |

---

## Dual Modes

### CATALOG Mode

**Purpose:** Browse available items, see pricing formula

**Visual:**
```
┌─────────────────────────────────────┐
│ ☕ Coffee Service          [extras]  │
├─────────────────────────────────────┤
│ Formula: $2 per pax                 │
│ Policy: Minimum 10 pax, max 200     │
│                                     │
│ [Add to Order] [View Details]       │
└─────────────────────────────────────┘
```

**User actions:**
- View pricing formula
- See restrictions/policies
- Add to basket → switches to BASKET mode

### BASKET Mode

**Purpose:** Adjust quantities, review pricing, see applied rules

**Visual:**
```
┌─────────────────────────────────────┐
│ ☕ Coffee Service         [BASKET]   │
├─────────────────────────────────────┤
│ Guests (pax):     [50    ] override  │
│ Units (cantidad): [50    ] manual   │
│ Duration (min):   [45    ] auto     │
│                                     │
│ Subtotal:         $250.00           │
│ Rules applied:    [2]               │
│ Total:            $275.00           │
│                                     │
│ [Save] [Remove]                     │
└─────────────────────────────────────┘
```

**User actions:**
- Adjust pax, cantidad, duration
- See recalculated prices in real-time
- View applied rules and blockers
- Save or remove item

---

## Internal Architecture

### Class Hierarchy

```
Item
├── Properties
│   ├── definition (ItemDefinition)
│   ├── mode (CATALOG | BASKET)
│   ├── context (ItemContext)
│   └── state (ItemState)
├── Lifecycle
│   ├── initialize()
│   ├── setMode(newMode)
│   └── resetToDefaults()
├── Calculations
│   ├── calculate() ← main entry point
│   ├── #computeQuantity()
│   ├── #computePricing()
│   └── #evaluateRules()
└── Overrides
    ├── setOverride(field, value)
    ├── clearOverride(field)
    ├── clearAllOverrides()
    └── isUserSet(field)
```

### Context Flow

```
ItemDefinition (static)
├── name, kind, category
├── pricingProfile { basePax, baseNeto, durMin, durMax }
├── categoryDefaults { pax, cantidad, durMin }
└── rules []
     │
     ▼
ItemContext (mutable)
├── userOverrides { pax, cantidad, duracionMin }
├── userSetFields Set(['pax'])
├── appliedRules [ { ruleId, action, payload } ]
├── errors [ { message, ruleId } ]
└── warnings [ { message, ruleId } ]
     │
     ▼
ItemState (calculated)
├── quantities { pax, cantidad, duracionMin }
├── pricing { neto, subtotal, total }
├── available (true if no errors)
└── displayString (formatted for UI)
```

### Calculation Pipeline

```
┌─────────────────────────────────────────┐
│ 1. RESOLVE QUANTITIES                   │
│    Use: definition.categoryDefaults     │
│         context.userOverrides           │
│    Result: { pax, cantidad, duracionMin} │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. COMPUTE PRICING                      │
│    Use: pricingProfile, quantities      │
│    Result: { neto, subtotal }           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. EVALUATE RULES                       │
│    Use: definition.rules, snapshot      │
│    Result: {appliedRules, errors,       │
│             warnings, available}        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. FINAL STATE                          │
│    Combine all above                    │
│    Generate displayString               │
│    Return toDisplayObject()             │
└─────────────────────────────────────────┘
```

### Domain Modules

**`domain/pricing.js`**
```javascript
export function detectKind(name, kind)                    // POS → MENU, SERVICE, EXTRA, SETUP
export function convertCantidad(pax, factor)             // Pax → units
export function calculateNeto(profile, quantities)       // Base → adjusted by duration/qty
export function applyMultiplier(neto, factor)            // Apply rule factor
export function calculateSubtotal(neto, adjustments)     // With rule adjustments
```

**`domain/quantity.js`**
```javascript
export function resolveQuantity(definition, overrides)   // Override precedence
export function getPaxDefault(definition)                // Category → default pax
export function getDurationDefault(definition)           // Category → default duration
export function isQuantityValid(qty, min, max)          // Bounds checking
```

**`domain/formatting.js`**
```javascript
export function formatItem(item, kind, mode)            // Full display string
export function formatPrice(neto, subtotal, total)      // Price formatting
export function formatQuantity(pax, cantidad, dur)      // Qty formatting
export function formatRuleDescription(rule)             // Human-readable rule
```

**`domain/rulesEngine/coordinator.js`**
```javascript
export class RulesCoordinator {
  constructor(componentType, rules)     // Filter rules by type
  evaluate(snapshot)                    // Evaluate all conditions
  isAvailable()                         // No blocking errors?
  getAppliedRules()                     // Which rules fired
  getErrors()                           // Blocking errors
  getWarnings()                         // Non-blocking warnings
}
```

---

## User Override Tracking

The Item tracks which fields users **manually set** vs. which are **auto-calculated**:

```javascript
// Private field: Set of field names user explicitly set
#userSetFields = new Set()

// Public methods:
setOverride(field, value) {
  context[field] = value
  #userSetFields.add(field)        // Mark as user-set
}

clearOverride(field) {
  delete context[field]
  #userSetFields.delete(field)     // Mark as auto
}

isUserSet(field) {
  return #userSetFields.has(field)
}

toDisplayObject() {
  return {
    ...currentState,
    isUserSetPax: this.isUserSet('pax'),
    isUserSetCantidad: this.isUserSet('cantidad'),
    isUserSetDuracion: this.isUserSet('duracionMin'),
    userSetFields: Array.from(#userSetFields),  // For serialization
  }
}
```

**Use case:** UI displays **orange borders** around user-set fields to signal overrides.

---

## Machine Definition (XState)

```javascript
// machine/itemMachine.js

const itemMachine = setup({
  types: {
    context: {
      itemId: string,
      definition: ItemDefinition,
      context: ItemContext,
      state: ItemState,
    },
    events: {
      INITIALIZE: { definition: ItemDefinition },
      SET_MODE: { mode: 'CATALOG' | 'BASKET' },
      SET_OVERRIDE: { field: string, value: any },
      CLEAR_OVERRIDE: { field: string },
      CALCULATE: {},
    },
  },
  actions: {
    initializeItem: assign(/* ... */),
    setMode: assign(/* ... */),
    applyOverride: assign(/* ... */),
    recalculate: assign(/* ... */),
  },
}).createMachine({
  id: 'item',
  initial: 'uninitialized',
  states: {
    uninitialized: {
      on: { INITIALIZE: 'idle' },
    },
    idle: {
      on: {
        SET_MODE: { actions: 'setMode' },
        SET_OVERRIDE: { actions: 'applyOverride', target: 'recalculating' },
        CLEAR_OVERRIDE: { actions: 'clearOverride', target: 'recalculating' },
      },
    },
    recalculating: {
      entry: 'recalculate',
      always: 'idle',
    },
  },
});
```

---

## HTML Structure (Standalone)

**Location:** `ui/ItemDisplay.html` (production view)

```html
<div id="item-container" x-data="itemComponent()" class="item">
  <!-- CATALOG MODE -->
  <template x-if="mode === 'CATALOG'">
    <div class="item-catalog-card">
      <div class="card-header">
        <h3 x-text="name"></h3>
        <span class="category-badge" x-text="category"></span>
      </div>
      <div class="card-body">
        <p class="formula" x-text="priceFormula"></p>
        <p class="policy" x-text="policy"></p>
        <button @click="addToBasket()">Add to Order</button>
      </div>
    </div>
  </template>

  <!-- BASKET MODE -->
  <template x-if="mode === 'BASKET'">
    <div class="item-basket-container">
      <h4 x-text="name"></h4>
      
      <!-- Quantity Controls -->
      <div class="quantity-controls">
        <label>Pax:</label>
        <input x-model.number="quantities.pax" 
               :class="{ 'user-set': isUserSetPax }"
               @change="setOverride('pax', $el.value)" />
        <span x-show="isUserSetPax" class="badge">manual</span>
      </div>

      <div class="quantity-controls">
        <label>Units:</label>
        <input x-model.number="quantities.cantidad" 
               :class="{ 'user-set': isUserSetCantidad }"
               @change="setOverride('cantidad', $el.value)" />
        <span x-show="isUserSetCantidad" class="badge">manual</span>
      </div>

      <!-- Price Display -->
      <div class="pricing-display">
        <span>Subtotal: <strong x-text="`$${pricing.subtotal}`"></strong></span>
        <span>Total: <strong x-text="`$${pricing.total}`"></strong></span>
      </div>

      <!-- Rules Display -->
      <div x-show="appliedRules.length">
        <h6>Applied Rules</h6>
        <template x-for="rule in appliedRules">
          <div class="rule-item">
            <span x-text="rule.description"></span>
          </div>
        </template>
      </div>

      <!-- Errors/Warnings -->
      <div x-show="errors.length" class="alert alert-danger">
        <template x-for="error in errors">
          <div x-text="error.message"></div>
        </template>
      </div>

      <button @click="remove()">Remove Item</button>
    </div>
  </template>
</div>
```

---

## Test Coverage

**File:** `tests/Item.test.js` (88 tests)

Categories:
1. **Factories & Initialization** — Create items, set modes, reset defaults
2. **Quantity Calculations** — Override precedence, bounds, context resolution
3. **Pricing Calculations** — Neto, subtotal, total with adjustments
4. **Rule Evaluation** — Conditions, errors, warnings, blocking
5. **Serialization** — toSeed(), loadFromSeed(), toDisplayObject()
6. **User Overrides** — setOverride(), clearOverride(), isUserSet()

Example test:
```javascript
test('should mark pax as user-set when overridden', async () => {
  const item = new Item(testDefinition);
  await item.initialize();

  // ACT
  item.setOverride('pax', 75);

  // ASSERT
  const state = item.toDisplayObject();
  expect(state.isUserSetPax).toBe(true);
  expect(state.userSetFields).toContain('pax');
});
```

---

## Integration Points

### With Basket Container
Items are added to a basket and sync pricing totals:

```javascript
// In parent container
const basket = new Basket();
const item = new Item(definition);

item.on('priceChange', () => {
  basket.recalculateTotals();  // Parent observes changes
});
```

### With Database
Item definitions come from database, rules too:

```javascript
const catalog = await store.getCatalog();
const itemDef = catalog.find(i => i.itemId === 'SALON_01');
const item = new Item(itemDef, { rules: itemDef.rules });
```

### With Rules Engine
Rules are evaluated by the embedded `RulesCoordinator`:

```javascript
const coordinator = new RulesCoordinator('ITEM', rules);
const result = coordinator.evaluate({
  itemId: this.itemId,
  pax: this.quantities.pax,
  cantidad: this.quantities.cantidad,
  duracionMin: this.quantities.duracionMin,
});
```

---

## Performance Notes

- **Caching:** Rule evaluation results cached; invalidated only on definition/rule changes
- **Pure functions:** Pricing calculations have no I/O or async operations
- **Lazy evaluation:** Display strings computed only on request
- **No polling:** State changes propagated via XState, not polling loops

---

## Next Steps

- See [`rules-engine-integration.md`](./rules-engine-integration.md) for detailed rule architecture
- See [`GUIDES/creating-a-component.md`](../GUIDES/creating-a-component.md) to build similar components
- See `packages/components/item/tests/Item.test.js` for implementation examples
