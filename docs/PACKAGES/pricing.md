# Pricing Pipeline Package

**Location:** `packages/pricing/`
**Language:** JavaScript ES2020+ (pure functions)
**Tests:** 147 passing (100% coverage)
**Dependencies:** Zero (no external libraries)
**Status:** ✅ Complete and production-ready

---

## What This Package Does

Calculates quotation line item prices using a 5-stage pipeline. Pure functions with no side effects.

```
Input: (header, lineas, catalog, rules)
  ↓
Stage 1: Expand (look up item details)
  ↓
Stage 2: Apply Defaults (quantities, duration multipliers)
  ↓
Stage 3: Calculate Base Prices (catalog price × multipliers)
  ↓
Stage 4: Apply Rules (discounts, adjustments)
  ↓
Stage 5: Aggregate (sum, taxes, totals)
  ↓
Output: (pricedLineas, totals, appliedRules)
```

---

## Package Structure

```
packages/pricing/
├── src/
│   ├── Pricing/
│   │   ├── pipeline.js          ← Main 5-stage pipeline
│   │   ├── expand.js            ← Stage 1: Item expansion
│   │   ├── defaults.js          ← Stage 2: Default values
│   │   ├── pricing.js           ← Stage 3: Base pricing
│   │   ├── adjustments.js       ← Stage 4: Rules & adjustments
│   │   └── taxes.js             ← Stage 5: Tax calculation
│   │
│   └── RulesEngine/
│       ├── index.js             ← Rule evaluation
│       └── actions/             ← 9 rule action types
│           ├── discountByVolume.js
│           ├── discountByCategory.js
│           ├── earlyBirdDiscount.js
│           ├── adjustmentByDuration.js
│           └── ... (5 more)
│
└── tests/                       ← 147 tests
    ├── unit/                    ← Pipeline stage tests
    ├── integration/            ← Full pipeline tests
    └── rules_engine/           ← Rule action tests
```

---

## Core Concepts

### Pure Functions

**Principle:** Input → Output, no side effects

```javascript
// Pure: Same input always produces same output
function calculatePrice(catalogPrice, quantity, duration) {
  return catalogPrice * quantity * duration;
}

// NOT pure: Depends on external state
let basePrice = 220000;  // Global variable
function calculatePrice(quantity) {
  return basePrice * quantity;  // Depends on global
}
```

**Why it matters:**
- Testable without mocking
- Reusable in any context (backend, CLI, etc.)
- Deterministic (no random behavior)
- Parallelizable (can run multiple calculations in parallel)

### 5-Stage Pipeline

**Stage 1: Expand**
```javascript
// Input: { ID_Item: 'ITEM_CHINOOK', cantidad: 2 }
// Look up item in catalog
// Output: { ID_Item, Nombre, Precio_Base, ID_Categoria, ... }
```

**Stage 2: Defaults**
```javascript
// Input: linea with item details, quotation header
// Apply: paxGlobal, duracionDias, default multipliers
// Output: linea with all defaults applied
```

**Stage 3: Base Pricing**
```javascript
// Input: linea with defaults
// Calculate: Precio_Base × cantidad × duration × pax multiplier
// Output: linea.precioCalculado
```

**Stage 4: Rules & Adjustments**
```javascript
// Input: linea with base price, all rules
// Apply: volume discounts, category discounts, early bird, etc.
// Track: which rules applied
// Output: linea.precioFinal, appliedRules[]
```

**Stage 5: Aggregation & Taxes**
```javascript
// Input: all priced lineas
// Calculate: subtotal, IVA (19%), discounts, total
// Output: { subtotal, taxes, discounts, total }
```

### Business Rules Engine

**9 rule types (pluggable):**

1. **Discount by Volume** - Larger qty → larger discount
2. **Discount by Category** - Category-specific deals
3. **Early Bird Discount** - Events far in future
4. **Duration Adjustment** - Longer events cost different
5. **Pax Adjustment** - Larger groups get adjustments
6. **Minimum Price** - Enforce floor pricing
7. **Maximum Price** - Enforce ceiling (if needed)
8. **Special Client Pricing** - VIP rates
9. **Custom Adjustments** - Percentage or fixed

**Rule structure:**
```javascript
{
  ID_Regla: 'REGLA_VOL_001',
  Nombre: 'Volume Discount 20%',
  Tipo_Accion: 'discountByVolume',
  Activo: true,
  Condiciones: {
    cantidadMinima: 5,
    descuentoPorcentaje: 20
  }
}
```

**Rule evaluation:**
```javascript
const rule = {
  Tipo_Accion: 'discountByVolume',
  Condiciones: { cantidadMinima: 5, descuentoPorcentaje: 20 }
};

if (linea.cantidad >= rule.Condiciones.cantidadMinima) {
  const discount = linea.precio * (rule.Condiciones.descuentoPorcentaje / 100);
  linea.precioFinal -= discount;
  appliedRules.push(rule.ID_Regla);
}
```

---

## Usage

### Simple Price Calculation

```javascript
import { pricingPipeline } from '@claps/pricing';

const result = pricingPipeline({
  quotation: {
    clienteId: 'CLI_001',
    paxGlobal: 10,
    duracionDias: 2
  },
  lineas: [
    { ID_Item: 'ITEM_CHINOOK', cantidad: 1 }
  ],
  catalog: [
    { ID_Item: 'ITEM_CHINOOK', Precio_Base: 220000, ... }
  ],
  rules: [
    { ID_Regla: 'REGLA_VOL', Tipo_Accion: 'discountByVolume', ... }
  ],
  profiles: [...]
});

// Result:
// {
//   lineas: [
//     { ID_Item: 'ITEM_CHINOOK', precioFinal: 220000, ... }
//   ],
//   totals: {
//     subtotal: 220000,
//     taxes: [{ nombre: 'IVA', monto: 41800 }],
//     total: 261800
//   },
//   appliedRules: ['REGLA_VOL']
// }
```

### With Custom Rules

```javascript
const customRules = [
  {
    ID_Regla: 'CUSTOM_001',
    Tipo_Accion: 'discountByVolume',
    Condiciones: { cantidadMinima: 5, descuentoPorcentaje: 15 }
  },
  {
    ID_Regla: 'CUSTOM_002',
    Tipo_Accion: 'discountByCategory',
    Condiciones: { categoria: 'CAFES', descuentoPorcentaje: 10 }
  }
];

const result = pricingPipeline({
  quotation, lineas, catalog, rules: customRules, profiles
});
```

---

## Testing Strategy

**147 tests across 3 categories:**

### Unit Tests (60+)
- **Expand:** Item lookup, missing items, field mapping
- **Defaults:** Quantity application, duration multipliers, pax
- **Pricing:** Base calculations, rounding, edge cases
- **Rules:** Each rule type (9 rules × 5 test cases each)
- **Taxes:** IVA calculation, multiple tax rates

### Integration Tests (50+)
- **Full pipeline:** Real quotation data from Data_Historica.csv
- **Complex scenarios:** Multiple items, multiple rules, edge cases
- **Regressions:** Ensure changes don't break existing pricing

### Edge Cases (37+)
- Zero quantity items
- Very large quantities (1000+)
- Very small prices (< 100)
- No matching items in catalog
- No applicable rules
- Conflicting rules

---

## Performance

### Benchmarks
- Single item pricing: < 1ms
- 10-item quotation: < 10ms
- 100-item quotation: < 100ms
- 1000 rules evaluation: < 50ms

### Optimization Tips
- Cache rule evaluations for same quotation
- Don't re-run pipeline on every keystroke (debounce)
- Use pricing profiles to avoid rule re-evaluation

---

## Key Files

| File | Purpose | Impact |
|------|---------|--------|
| pipeline.js | Stage orchestration | Core: add new stages here |
| expand.js | Item lookup | Change: item field mapping |
| pricing.js | Base calculations | Change: pricing algorithm |
| adjustments.js | Rule application | Change: rule evaluation order |
| RulesEngine/index.js | Rule dispatch | Change: add new rule types here |

---

## Adding a New Rule Type

1. **Create action:** `RulesEngine/actions/newRuleType.js`
   ```javascript
   export const newRuleType = (linea, rule) => {
     if (/* condition met */) {
       return { ...linea, precioFinal: /* adjusted */ };
     }
     return linea;
   };
   ```

2. **Register:** `RulesEngine/index.js`
   ```javascript
   import { newRuleType } from './actions/newRuleType';
   const handlers = { ..., newRuleType };
   ```

3. **Test:** `tests/rules_engine/newRuleType.test.js`
   ```javascript
   test('newRuleType applies correctly', () => {
     const result = newRuleType(linea, rule);
     expect(result.precioFinal).toBe(expectedPrice);
   });
   ```

4. **Use:** Add to REGLAS_NEGOCIO with `Tipo_Accion: 'newRuleType'`

---

## Real-World Data

**Data file:** `Data/Data_Historica.csv`
- 50+ real quotations from SF Lodge
- Used to validate pricing against actual results
- Can be replayed to verify no regression

---

## Production Checklist

- [x] 147 tests passing (100% coverage)
- [x] All pipeline stages tested
- [x] All 9 rule types implemented and tested
- [x] Real-world data validated
- [x] Performance benchmarks met
- [x] Edge cases covered
- [x] Pure functions (no side effects)
- [x] Zero external dependencies
- [x] Deterministic (reproducible results)

