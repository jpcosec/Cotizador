# Decisions & Answers: Why This Approach?

## Your 4 Original Points - How We Resolved Them

### ✅ Point 1: Build-Time Evaluation, Not Runtime Stages

**You said:**
> Rules should be checked by components on build time, and on modification, then they should be passed to other components via inheritance

**Resolution:**
We don't use the 5-stage pipeline (CANTIDAD_DEFAULT, AJUSTE_LINEA, AJUSTE_GLOBAL, RESTRICCION_UI, IMPUESTO).

Instead:
- Rules evaluated **at Item construction** (build time)
- Results **cached** in the Item instance
- Results **inherited** to parent containers (no re-eval)
- On pax/quantity **modification**, rules NOT re-evaluated (use cached result)

**Implementation:**
```javascript
const item = new Item(itemData, { componentRules });
// At this point: rules evaluated, cached
// Item.ruleResult contains: { appliedRules, available, errors, warnings }
```

---

### ✅ Point 2: JSON-Logic Bundle Overhead - Justified

**You said:**
> Check the overhead, if it's significant let's see how to reduce it, but the flexibility working with json-logic gives us in order to not having to modify logic to create new rules worth it.

**Finding:**
- **json-logic-js:** ~8 KB gzipped
- **Current bundle:** ~50 KB
- **Impact:** +3-4 KB (6-8% increase)
- **Already in project:** Yes, it's in `claps_codelab/package.json`

**Real CSV data uses JSON-Logic:**
```json
{
  "Condicion_JSON": {
    "and": [
      { "===": [{ "var": "linea.ID_Item" }, "ITEM_SALON_CHINOOK_..."] },
      { ">": [{ "var": "linea._pax" }, 320] }
    ]
  }
}
```

**Decision:**
✅ **KEEP json-logic-js**

Why:
- Eliminates need to hardcode 30+ rule types
- Non-developers can add rules via CSV (no code changes)
- 8 KB gzipped overhead is negligible for this flexibility
- All 64 real rules in CSV use JSON-Logic

---

### ✅ Point 3: Separate Rules Machine for Efficiency

**You said:**
> Maybe the complexity of the rules could make it worthwhile to create a separate machine that coordinates them. In runtime each component should only check the rules that are their responsibility. We can filter by component type (instead of the stages), and then pass the results through inheritance.

**Resolution:**
✅ Create **RulesCoordinator** class

```javascript
class RulesCoordinator {
  constructor(componentType, allRules) {
    // Filter ONCE at construction
    this.rules = allRules.filter(r => r.componentType === componentType);
  }

  evaluate(snapshot) {
    // Return cached if already evaluated (no re-scroll!)
    if (this.cached) return this.cached;

    // Check 5-10 rules for this component type
    // Cache result
    return (this.cached = result);
  }
}
```

**Efficiency Gain:**
- Before: Scroll all rules on every pax/quantity change
- After: Filter once at construction, cache result, reuse

**Component Types** (instead of stages):
- ITEM - Individual items
- CATEGORY - Room/meal categories
- KIT - Meal packs, bundles
- CONTAINER - DayCategory, sections
- BASKET - Full quotations

---

### ✅ Point 4: Config_Schema Already Data-Driven

**You said:**
> Check claps_codelab/src/Config/Config_Schema.js to see how rules are applied

**Finding:**
Rules in REGLAS_NEGOCIO table are **already data-driven**:

```javascript
REGLAS_NEGOCIO: {
  columns: [
    { name: "ID_Regla", type: "PK" },
    { name: "Nombre", type: "TEXT" },
    { name: "Etapa", type: "ENUM", options: ["CANTIDAD_DEFAULT", "RESTRICCION_UI", ...] },
    { name: "Scope", type: "ENUM", options: ["LINEA", "ITEM", "CATEGORIA", ...] },
    { name: "Tipo_Accion", type: "ENUM", options: ["ERROR", "WARNING", "MULTIPLY", ...] },
    { name: "Condicion_JSON", type: "JSON" },  // ← JSON-Logic expressions
    { name: "Payload_JSON", type: "JSON" },
    { name: "Prioridad", type: "INTEGER" },
    { name: "Acumulable", type: "BOOLEAN" },
    { name: "Activo", type: "BOOLEAN" },
  ]
}
```

**Real CSV data shows:**
- 64 rules total
- ALL are `Etapa: RESTRICCION_UI` (single stage)
- ALL are `Scope: ITEM` (single component type)
- Conditions: JSON-Logic (and, ===, >, <, in operators)
- Actions: ERROR (16 rules), WARNING (48 rules)

**Mapping for new architecture:**
```javascript
// Instead of Etapa: RESTRICCION_UI
// Add: componentType: 'ITEM'

// Schema is already designed for this!
// No changes needed, just add filtering
```

---

## Why This Approach Is Better

| Aspect | Legacy (5 stages) | New (Component-scoped) |
|--------|---|---|
| **Evaluation trigger** | On every property change | At construction, then cached |
| **Rule filtering** | Query store every time | Filter once at init |
| **Re-evaluation** | Per pax/quantity change | Never (use cached) |
| **Inheritance** | Re-evaluate child rules | Pass cached results down |
| **Performance** | O(n) rules × m changes | O(n) rules × 1 construction |
| **Component relevance** | All items eval all rules | Each item only its rules |

---

## Real Example from CSV

**Rule: Max 320 pax for Salon Chinook**

```json
{
  "ID_Regla": "R_AUT_0001",
  "Nombre": "Maximo 320 pax - Salon Chinook uso diurno, hasta 320 personas",
  "Etapa": "RESTRICCION_UI",
  "Scope": "ITEM",
  "componentType": "ITEM",  // ← ADD THIS
  "Tipo_Accion": "ERROR",
  "Condicion_JSON": {
    "and": [
      { "===": [{ "var": "itemId" }, "ITEM_SALON_CHINOOK_USO_DIURNO_HASTA_320_PERSONAS"] },
      { ">": [{ "var": "pax" }, 320] }
    ]
  },
  "Payload_JSON": {
    "message": "Este item permite maximo 320 pax."
  },
  "Prioridad": 20,
  "Acumulable": false,
  "Activo": true
}
```

**How it works in new architecture:**

```javascript
// 1. At Item creation
const item = new Item(
  { ID_Item: 'ITEM_SALON_CHINOOK_...', ... },
  { componentRules: allRulesFromCsv, pax: 350 }
);

// 2. In constructor
this.rulesCoordinator = new RulesCoordinator('ITEM', componentRules);
// → Filters to: [R_AUT_0001, R_AUT_0002, ...] (all ITEM-scoped rules)

this.ruleResult = this.rulesCoordinator.evaluate({
  itemId: 'ITEM_SALON_CHINOOK_...',
  pax: 350
});

// 3. Evaluation
// → Check R_AUT_0001:
//   - Condition: itemId matches? YES
//   - Condition: pax > 320? YES (350 > 320)
//   - Action: ERROR
//   - Result: available = false, errors = [{ message: "..." }]

// 4. Result
item.ruleResult = {
  appliedRules: [
    { id: 'R_AUT_0001', type: 'ERROR', message: 'Este item permite maximo 320 pax.' }
  ],
  errors: [{ message: 'Este item permite maximo 320 pax.' }],
  available: false,
  warnings: []
};

// 5. Display
item.toDisplayObject().appliedRules
// → User sees: "❌ Este item permite maximo 320 pax."
```

---

## Step 3.3 Scope (Ultra-Focused)

This step ONLY builds:
- ✅ RulesCoordinator class
- ✅ Item integration
- ✅ Tests

NOT building:
- ❌ Inheritance mechanism (Step 3.4)
- ❌ Database integration (Step 3.5+)
- ❌ Multiple component types yet
- ❌ Complex action types yet
- ❌ Rule updates/invalidation yet

This keeps it focused, testable, and deliverable.

---

## Why Start at Item Level?

Item is the **lowest-level component**:
- Simple structure
- Single responsibility
- Easy to test in isolation
- Good foundation for inheritance

Once Item rules work perfectly, Step 3.4 builds the inheritance mechanism so Category rules → DayCategory → Item cascade works smoothly.

