# Step 09: Rules Engine (Shared)

**What:** Reusable engine for evaluating business rules.

**File:** `src/Pipeline/rules_engine.js`

**Functions:**
- `getRulesForStage(stage, store)` → sorted by Prioridad
- `evaluateCondition(condicionJSON, context)` → boolean
- `executeAction(tipoAccion, payloadJSON, target)` → `{ delta, description }`

**Condition format:** `{ field, op, value, and?, or? }` — supports eq, gt, lt, gte, lte, has_category, missing_category, always

**Test file:** `tests/unit/rules_engine.test.js`
- evaluateCondition({ field: 'pax', op: 'gt', value: 50 }, { pax: 80 }) → true
- evaluateCondition({ always: true }, {}) → true
- executeAction('MULTIPLY', { factor: 1.25 }, { neto: 100000 }) → delta: 25000
- executeAction('ADD_FIXED', { amount: -50000 }, ...) → delta: -50000
- getRulesForStage('IMPUESTO') → sorted by Prioridad ascending

**Depends on:** Step 02.
