# Rules Engine - Item Level (Step 3.3)

Rules for Item components follow the real CSV structure from `claps_codelab/data/init/REGLAS_NEGOCIO.csv`.

## Rule Structure (from REGLAS_NEGOCIO.csv)

```javascript
{
  ID_Regla: string,              // Unique identifier (e.g. 'R_AUT_0001')
  Nombre: string,                // Human-readable name
  Etapa: string,                 // RESTRICCION_UI, CANTIDAD_DEFAULT, etc. (not used in Step 3.3)
  Scope: string,                 // Component type: ITEM, CATEGORY, KIT, CONTAINER, BASKET
  Tipo_Accion: string,           // Action type (see Action Types below)
  Hook: string,                  // Optional hook identifier (empty for most)
  Condicion_JSON: string|object, // JSON-Logic expression
  Payload_JSON: string|object,   // Action-specific payload
  Prioridad: number,             // Sort order (lower first)
  Acumulable: boolean,           // Whether multiple instances can apply
  Activo: boolean,               // Whether rule is enabled
  Updated_At: string,            // ISO timestamp
}
```

## Filtering Strategy: (Scope, Component ID)

**Key insight:** Component ID matching belongs in the **filter**, not the condition.

### Current CSV (ID Match in Condition)
```javascript
// Redundant: item ID check inside condition
{
  "and": [
    { "===": [{ "var": "item.id" }, "ITEM_SALON_CHINOOK_..." ] },
    { ">": [{ "var": "item.pax" }, 320] }
  ]
}
```

### Step 3.3+ Approach (Pre-Filter by ID)
```javascript
// At RulesCoordinator construction:
const itemRules = allRules.filter(r =>
  r.Scope === 'ITEM' &&     // Only ITEM-scoped rules
  r.Activo === true &&       // Only active rules
  r.id === itemId       // Only for THIS item (pre-filtered!)
);

// Condition only contains business logic:
{
  ">": [{ "var": "item.pax" }, 320]
}
// Variables in condition: pax, cantidad, duracionMin, hora, dia (no ID matching)
```

### Extensibility
Later components follow same pattern:
- **CATEGORY:** Filter by `r.Scope === 'CATEGORY' && r.ID_Category === categoryId`
- **KIT:** Filter by `r.Scope === 'KIT' && r.ID_Kit === kitId`
- **CONTAINER:** Filter by `r.Scope === 'CONTAINER' && r.ID_Container === containerId`
- **BASKET:** Filter by `r.Scope === 'BASKET'` (no ID, single quotation)

Same condition format everywhere — conditions reference component-local variables only.

## Action Types (9 total)

All action handlers exist in `claps_codelab/packages/pricing/src/RulesEngine/actions/`:

| Action | Handler | Payload | Effect | Step 3.3 |
|--------|---------|---------|--------|----------|
| **ERROR** | `error.js` | `{ message }` | Blocking error | ✅ Will support |
| **WARNING** | `warning.js` | `{ message }` | Non-blocking warning | ✅ Will support |
| **MULTIPLY** | `multiply.js` | `{ factor }` | Price multiplier | ⏳ No effect yet |
| **ADD_FIXED** | `add_fixed.js` | `{ amount }` | Flat fee | ⏳ No effect yet |
| **SET_VALUE** | `set_value.js` | `{ value }` | Override price | ⏳ No effect yet |
| **SET_TAX** | `set_tax.js` | `{ name, rate }` | Apply tax | ⏳ No effect yet |
| **SET_DEFAULT** | `set_default.js` | `{ field, value }` | Set default quantity | ⏳ No effect yet |
| **ADD_ITEM** | `add_item.js` | `{ itemId }` | Auto-add item | ⏳ No effect yet |
| **INVALIDATE_BASKET** | `invalidate_basket.js` | `{ message }` | Block entire basket | ⏳ No effect yet |

## Condition Format (JSON-Logic)

All conditions use `json-logic-js` syntax. Examples from real CSV:

```javascript
// Simple comparison
{ ">": [{ "var": "item.pax" }, 320] }
// Meaning: pax > 320

// Logical AND
{
  "and": [
    { "===": [{ "var": "item.id" }, "ITEM_SALON_CHINOOK_..."] },
    { ">": [{ "var": "item.pax" }, 320] }
  ]
}
// Meaning: Item matches AND pax > 320

// Complex OR
{
  "or": [
    { "<": [{ "var": "item.pax" }, 10] },
    { ">": [{ "var": "item.pax" }, 320] }
  ]
}
// Meaning: pax < 10 OR pax > 320
```

### JSON-Logic Operators

```javascript
// Comparison
"===", "!==", ">", ">=", "<", "<="

// Logical
"and", "or", "!"

// Other
"in"      // value in array
"var"     // variable reference (with dot notation)
```

## Humanization (Reading JSON-Logic)

**File:** `humanize.js` (copied from pricing/src/RulesEngine)

Convert machine-readable JSON-Logic to human text:

```javascript
import { humanizeCondition, humanizePayload, humanizeRule } from './humanize.js';

const rule = {
  Condicion_JSON: { ">": [{ "var": "pax" }, 320] },
  Tipo_Accion: "ERROR",
  Payload_JSON: { message: "Too many pax" },
  Nombre: "Max 320 pax"
};

humanizeCondition(rule.Condicion_JSON)
// → "pax > 320"

humanizePayload(rule.Tipo_Accion, rule.Payload_JSON)
// → "Too many pax"

humanizeRule(rule)
// → "When pax > 320, ERROR Too many pax"
```

## Real CSV Data Statistics

- **64 rules total**
- **All RESTRICCION_UI stage** (100%) → not used in Step 3.3
- **All ITEM scope** (100%) → only filtering by componentType
- **Action types:**
  - ERROR: 16 rules (blocking constraints)
  - WARNING: 48 rules (informational)
- **Priorities:** range from 10-30
- **All have JSON-Logic conditions** (no hardcoded rule types)

## Step 3.3 Implementation Plan

1. ✅ Copy `humanize.js` for condition/payload readable formatting
2. ⏳ Create RulesCoordinator class that:
   - Filters rules by `Scope` (componentType)
   - Evaluates `Condicion_JSON` using `json-logic-js`
   - Executes action via `Tipo_Accion` handler
   - Caches result (no re-evaluation on quantity changes)
   - Returns `{ appliedRules, errors, warnings, available }`
3. ⏳ Integrate with Item.js at construction time
4. ⏳ Tests for coordination logic

## What We're NOT Doing Yet

- ❌ Database integration (rules come as parameter)
- ❌ Etapa/Hook filtering (only Scope)
- ❌ MULTIPLY, ADD_FIXED, SET_VALUE, etc. effects (ERROR/WARNING only)
- ❌ Rule updates/invalidation
- ❌ Inheritance to parent containers (Step 3.4)

---

**Reference:** `claps_codelab/packages/pricing/src/RulesEngine/`
