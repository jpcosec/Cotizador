# Pricing Pipeline Orchestration

The `src/Pricing/pipeline.js` module provides orchestration for recalculation at two distinct levels, with proper rule integration at each stage.

## Overview

```
LEVEL 1 (Item-level, basket mutations)
  expandItemCompositions()
    ↓
  resolveItemDefaults()        [CANTIDAD_DEFAULT rules]
    ↓
  recalculateItemPrice()
    ↓
  applyItemRules()             [RESTRICCION_UI, AJUSTE_LINEA rules]
    ↓
  aggregateBasketTotals()      [AJUSTE_GLOBAL, IMPUESTO rules + manual adjustments]

LEVEL 2 (Full basket, validation/resume)
  fullRecalculateBasket()      [All steps above in sequence]
```

## Functions

### LEVEL 1: Item-level (for basket mutations)

#### `expandItemCompositions(linea, store)`
Expands a line if it's a composition parent. Otherwise returns `[linea]`.
- Used by: `ADD_ITEM`
- Returns: `[linea, ...children]`

#### `resolveItemDefaults(linea, paxGlobal, store)`
Resolves Q/T/P (Quantity, Time, Pax) defaults using category definitions.
- Uses: `CANTIDAD_DEFAULT` rules (if applicable)
- Modifies: `linea._pax`, `linea._duracionMin`, `linea._cantidad`

#### `recalculateItemPrice(linea, store)`
Calculates base price using the pricing profile formula.
- Formula: `Neto = Base + (P×Cp) + (T×Ct) + (Q×Cq)`
- Modifies: `linea._netoBase`

#### `applyItemRules(linea, store)`
Applies item-level rules and returns errors/adjustments.
- Rules stages: `RESTRICCION_UI`, `AJUSTE_LINEA`
- Returns: `{ linea, errors: [], adjustments: [] }`
- Modifies: `linea._ajustes`, `linea._netoAjustado`

#### `aggregateBasketTotals(lineas, ajustesManuales, store)`
Aggregates all lines and applies global rules and manual adjustments.
- Rules stages: `AJUSTE_GLOBAL`, `IMPUESTO`
- Applies: Manual global discounts/surcharges
- Returns: `{ totals: { subtotal, taxes, total }, messages }`

### LEVEL 2: Full Basket

#### `fullRecalculateBasket(lineas, quotation, store)`
Complete recalculation from scratch. Used during validation and when resuming from database changes.

**Steps:**
1. Strip computed fields (preserve structural metadata)
2. For each line: resolve defaults → calculate price → apply rules
3. Aggregate and apply global rules/manual/taxes
4. Check basket-level validation rules

**Returns:**
```js
{
  lineas: [...],           // recalculated lines
  totals: { ... },         // subtotal, taxes, total
  messages: [...],         // rule messages
  errors: [...]            // blocking errors
}
```

## Rule Stages

The pipeline ensures rules are applied at the correct stages:

| Stage | Level | Usage | When |
|-------|-------|-------|------|
| `CANTIDAD_DEFAULT` | 1 | Modify Q/T/P during defaults | Item-level recalc |
| `RESTRICCION_UI` | 1 & 2 | Validate item constraints | When adding/updating items |
| `AJUSTE_LINEA` | 1 & 2 | Auto-adjust line prices | After pricing, per item |
| `AJUSTE_GLOBAL` | 1 & 2 | Auto-adjust global prices | After all items priced |
| `IMPUESTO` | 1 & 2 | Calculate taxes | Final step |

## Usage Examples

### After ADD_ITEM (basket mutation)
```js
import { expandItemCompositions, resolveItemDefaults, recalculateItemPrice, applyItemRules, aggregateBasketTotals } from './pipeline.js';

// 1. Expand if composition
const expanded = expandItemCompositions(newLine, store);

// 2-4. For each expanded line
for (const linea of expanded) {
  resolveItemDefaults(linea, quotation.paxGlobal, store);
  recalculateItemPrice(linea, store);
  const result = applyItemRules(linea, store);
  if (result.errors.length > 0) {
    // Handle errors (e.g., rule violation)
  }
}

// 5. Update global totals
const { totals, messages } = aggregateBasketTotals(lineas, quotation.ajustesManuales, store);
```

### During validation (LEVEL 2)
```js
import { fullRecalculateBasket } from './pipeline.js';

const result = fullRecalculateBasket(lineas, quotation, store);

if (result.errors.length > 0) {
  // Show validation errors
} else {
  // Save quotation with final totals
  saveQuotation({ ...quotation, lineas: result.lineas, totals: result.totals });
}
```

## Design Notes

- **Pure functions**: All functions are pure — they don't mutate the store or have side effects
- **Rule integration**: Rules are called at the correct stages via `getRulesForStageAndHook()`
- **Determinism**: `fullRecalculateBasket()` produces the same result given the same inputs
- **Traceability**: All rule applications and adjustments are logged in `_ajustes` and `messages`
- **Soft deletes**: Removed items stay in history for event-sourcing replay

## Relationship to XState

The state machine adapters (`claps_codelab_xstate`) call these pipeline functions:
- **Basket mutations** (ADD_ITEM, UPDATE_ITEM, etc.): Call LEVEL 1 functions
- **Validation** (checkout): Calls `fullRecalculateBasket()` (LEVEL 2)
- **Resume from database**: Calls `fullRecalculateBasket()` (LEVEL 2) to catch price changes
