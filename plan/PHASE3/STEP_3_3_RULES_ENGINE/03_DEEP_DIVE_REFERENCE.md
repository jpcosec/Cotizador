# Deep Dive: Rules Engine Reference

This document provides detailed technical reference about the rules engine. Read this if you want to understand the **why** behind the architecture.

## Current State: Real CSV Data

**Location:** `/home/jp/CotizadorLodge/claps_codelab/data/init/REGLAS_NEGOCIO.csv`

### Statistics
- **64 rules total**
- **All RESTRICCION_UI stage** (100%)
- **All ITEM scope** (100%)
- **2 action types**: ERROR (25 rules), WARNING (39 rules)

### Pattern Analysis

**Pattern 1: Item Constraints (25 rules)**
```
ID_Regla: R_AUT_0001
Nombre: Maximo 320 pax - Salon Chinook
Etapa: RESTRICCION_UI
Scope: ITEM
Tipo_Accion: ERROR
Condicion_JSON: { "and": [{ "===": [{ "var": "linea.ID_Item" }, "ITEM_SALON_CHINOOK_..." ] }, { ">": [{ "var": "linea._pax" }, 320] }] }
Payload_JSON: { "message": "Este item permite maximo 320 pax." }
```

**Pattern 2: Pricing Warnings (39 rules)**
```
ID_Regla: R_AUT_0025
Nombre: Precio hibrido detectado - Caminata
Etapa: RESTRICCION_UI
Scope: ITEM
Tipo_Accion: WARNING
Condicion_JSON: { "===": [{ "var": "linea.ID_Item" }, "ITEM_CAMINATA_..." ] }
Payload_JSON: { "message": "Precio base + pax detectado y migrado a perfil de precio", "base": 300, "perPax": 10 }
```

### Key Insight
All rules are:
- **Per-item validation** (check specific item IDs)
- **Pax-dependent** (max/min pax constraints)
- **At load time** (when item is added to quotation)
- **One-time evaluation** (results don't change on pax updates)

This proves the architecture choice: evaluate at construction, cache.

---

## Legacy Rules Engine (For Reference)

**Location:** `claps_codelab/packages/pricing/src/RulesEngine/`

### Architecture (Not Using This Approach)

**5 Stages:**
1. CANTIDAD_DEFAULT - Set default quantities before pricing
2. AJUSTE_LINEA - Per-item price adjustments
3. AJUSTE_GLOBAL - Basket-level adjustments
4. RESTRICCION_UI - Blocking/warning rules
5. IMPUESTO - Tax calculations

**9 Action Types:**
- MULTIPLY (price surcharge)
- ADD_FIXED (flat fee)
- SET_VALUE (override price)
- SET_TAX (apply tax rate)
- SET_DEFAULT (set default quantity)
- ADD_ITEM (auto-add item)
- WARNING (non-blocking alert)
- ERROR (blocking error)
- INVALIDATE_BASKET (basket invalid)

### Why We're NOT Using This

1. **Too complex for Item level** - Only need ERROR and WARNING
2. **Stage-based not suitable** - All real rules are RESTRICCION_UI
3. **Runtime re-evaluation waste** - Real rules should eval once
4. **Inheritance designed wrong** - Stages don't map to component hierarchy

### What We ARE Taking From It

- ✅ Registry pattern (self-registering actions)
- ✅ JSON-Logic integration (condition evaluation)
- ✅ Action handler pattern (pluggable actions)
- ✅ Humanization (condition/action formatting)
- ✅ Testing approach (comprehensive unit tests)

---

## JSON-Logic Usage

### Operators in Real Rules

**Equality check:**
```json
{ "===": [{ "var": "linea.ID_Item" }, "ITEM_SALON_CHINOOK_..." ] }
```

**Comparison operators:**
```json
{ ">": [{ "var": "linea._pax" }, 320] }    // greater than
{ "<": [{ "var": "linea._pax" }, 10] }     // less than
{ ">=": [{ "var": "linea._pax" }, 30] }    // greater or equal
{ "<=": [{ "var": "linea._pax" }, 100] }   // less or equal
```

**Logical operators:**
```json
{ "and": [condition1, condition2] }        // both must be true
{ "or": [condition1, condition2] }         // at least one true
{ "!": [condition] }                       // negation
```

**Variable reference:**
```json
{ "var": "linea.ID_Item" }                 // access property
{ "var": "linea._pax" }                    // access nested property
```

### Complex Example

```json
{
  "and": [
    { "===": [{ "var": "itemId" }, "ITEM_SALON_CHINOOK_..." ] },
    { "or": [
      { ">": [{ "var": "pax" }, 320] },
      { "<": [{ "var": "pax" }, 10] }
    ]}
  ]
}
```

**Meaning:** Item matches AND (pax > 320 OR pax < 10)

---

## Bundle Size Analysis

### json-logic-js Size

**Package:** json-logic-js@2.0.5
- Uncompressed: ~24 KB
- Gzipped: ~8 KB
- Already in project: YES

### Current Bundle

**claps_codelab/dist/quotation-engine.iife.js**
- Size: ~50 KB total
- Dependencies: XState, Alpine.js, json-logic-js

### Impact of Including json-logic-js

```
Before: 50 KB (already included)
After:  50 KB (no change - it's already there!)

If we REMOVED it:
  Before:  50 KB
  After:   42 KB (save 8 KB)

  Cost: Can't use JSON-Logic, must hardcode rules
  Problem: Can't add new rules without code changes
```

**Conclusion:** json-logic-js is already in the project, so no cost to use it. The flexibility gained is worth it.

---

## CSV → Component Rules Flow

```
┌─ REGLAS_NEGOCIO.csv
├─ ID_Regla: 'R_AUT_0001'
├─ Nombre: 'Maximo 320 pax...'
├─ Etapa: 'RESTRICCION_UI'        → (ignore, filter by componentType instead)
├─ Scope: 'ITEM'                  → (keep, rename to componentType)
├─ Tipo_Accion: 'ERROR'           → (action type)
├─ Condicion_JSON: { ... }        → (JSON-Logic expression)
├─ Payload_JSON: { ... }          → (action parameters)
├─ Prioridad: 20                  → (execution order)
├─ Acumulable: false              → (can combine with other rules)
└─ Activo: true                   → (skip if false)
    ↓
RulesCoordinator('ITEM', [rulesFromCsv])
    ↓ Filters by componentType === 'ITEM'
    ↓ Sorts by Prioridad
    ↓
Item.constructor()
    ↓
evaluateRules()
    ↓ Check each rule's Condicion_JSON
    ↓ Execute Tipo_Accion handlers
    ↓
Store result in Item.ruleResult
    ↓
Item.toDisplayObject()
    ↓ Include appliedRules for UI display
```

---

## Humanization Example

**Rule:**
```json
{
  "id": "R_AUT_0001",
  "name": "Maximo 320 pax",
  "conditionJson": {
    "and": [
      { "===": [{ "var": "itemId" }, "ITEM_SALON_CHINOOK_..." ] },
      { ">": [{ "var": "pax" }, 320] }
    ]
  },
  "actionType": "ERROR",
  "payloadJson": { "message": "Este item permite maximo 320 pax." }
}
```

**Humanized Output:**
```
"itemId === ITEM_SALON_CHINOOK_... AND pax > 320 → ❌ Este item permite maximo 320 pax."
```

**For UI Display:**
- Condition: "itemId === ITEM_SALON_CHINOOK_... AND pax > 320"
- Action: "❌ Este item permite maximo 320 pax."

---

## Why Component-Scoped Over Stage-Based

### Stage-Based Pipeline (Legacy)

```
┌─────────────────────────────┐
│ ADD_ITEM to Basket          │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ CANTIDAD_DEFAULT Stage      │ ← Check ALL 64 rules
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ AJUSTE_LINEA Stage          │ ← Check ALL 64 rules
└──────────────┬──────────────┘
               ↓
... more stages ... ← Check ALL rules each time!
               ↓
┌─────────────────────────────┐
│ PAX CHANGED                 │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ RE-RUN FULL PIPELINE        │ ← Check ALL rules again!
└─────────────────────────────┘
```

**Problem:** Every pax change triggers full pipeline with all 64 rules checks.

### Component-Scoped Evaluation (New)

```
┌─────────────────────────────┐
│ Item Creation               │
├─────────────────────────────┤
│ RulesCoordinator('ITEM')    │
│   ↓ Filter: componentType   │
│   → Only ITEM rules (64/64) │
│   ↓ evaluate()              │
│   → Check rules once        │
│   ↓ Cache result            │
│   → Store in Item           │
└─────────────────────────────┘
                ↓
        ✅ DONE - Rules cached
                ↓
┌─────────────────────────────┐
│ PAX CHANGED                 │
├─────────────────────────────┤
│ Update Item.quantities      │
│ ⚠️ Do NOT re-evaluate       │
│ ✅ Reuse cached result      │
└─────────────────────────────┘
                ↓
        ✅ DONE - No rule check!
```

**Benefit:** Rules evaluated once at construction, cached, reused for lifetime of Item.

---

## Caching Strategy

### Why Caching is Safe

1. **Rules don't change** - At least not during a single quotation session
2. **Item data is fixed** - Once created, item ID doesn't change
3. **Result is deterministic** - Same snapshot → same result always
4. **Step 3.3 doesn't support** rule invalidation (future step if needed)

### Cache Implementation

```javascript
this.cached = null;  // Initially not evaluated

evaluate(snapshot) {
  if (this.cached !== null) {
    return this.cached;  // Return cached, no re-evaluation
  }

  // ... evaluation logic ...

  this.cached = result;  // Cache for future calls
  return result;
}
```

---

## Next Steps

1. **Step 3.3:** This - make rules engine testable at Item level
2. **Step 3.4:** Inheritance mechanism (Category → DayCategory → Item)
3. **Step 3.5:** Database integration (pull rules from GAS sheets)
4. **Step 3.6:** Other component types (CATEGORY, KIT, CONTAINER, BASKET)
5. **Future:** Rule invalidation, rule updates, complex action types

