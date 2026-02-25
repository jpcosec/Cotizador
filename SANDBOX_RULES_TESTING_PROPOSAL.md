# Proposal: Rules Testing in Sandbox (Step 3.3+)

## Current State

**Sandbox:** ✅ Running at http://localhost:8090/step-03-item
**Seeds:** ❌ Still using old hardcoded rule format
**UI:** ✅ Shows Item in catalog/basket modes, context controls
**Rules Evaluation:** ❌ Not implemented yet (waiting for RulesCoordinator)

### Current Mock Rules (seeds.js)
```javascript
rules: [
  { id: 'R1', type: 'MAX_PAX', value: 500, label: '...', active: true, blocking: true },
  { id: 'R2', type: 'ONLY_HOUR_RANGE', min: '07:00', max: '22:00', ... }
]
```

Problem: Uses old hardcoded types. Needs CSV format with JSON-Logic conditions.

---

## Proposal: 3-Phase Approach

### Phase A: Update Seeds to CSV Format ⏳ (30 min)

**Goal:** Replace mock rules with real CSV format

**File:** `packages/components/item/seeds.js`

**Replace:**
```javascript
rules: [
  {
    ID_Regla: 'R_TEST_0001',
    Nombre: 'Max 100 pax constraint',
    Scope: 'ITEM',
    Tipo_Accion: 'ERROR',
    Condicion_JSON: {
      ">": [{ "var": "linea._pax" }, 100]
    },
    Payload_JSON: { message: "This item supports max 100 pax." },
    Prioridad: 10,
    Acumulable: false,
    Activo: true
  },
  {
    ID_Regla: 'R_TEST_0002',
    Nombre: 'Available 09:00-18:00 only',
    Scope: 'ITEM',
    Tipo_Accion: 'WARNING',
    Condicion_JSON: {
      "or": [
        { "<": [{ "var": "linea.hora" }, "09:00"] },
        { ">": [{ "var": "linea.hora" }, "18:00"] }
      ]
    },
    Payload_JSON: { message: "Outside business hours (9am-6pm)." },
    Prioridad: 20,
    Acumulable: false,
    Activo: true
  }
  // ... more test rules
]
```

**Benefits:**
- ✅ Real CSV format matches production data
- ✅ Tests JSON-Logic conditions
- ✅ Ready for RulesCoordinator integration
- ✅ Variables match Item context: `linea._pax`, `linea.hora`, `linea.cantidad`, `linea.duracionMin`

---

### Phase B: Add Rules Display Panel ⏳ (1-2 hours)

**Goal:** Show applied rules in sandbox UI

**Location:** `packages/components/item/ui/ItemStandalone.html`

**Add new section:**

```html
<!-- Rules Evaluation Panel -->
<div class="rules-panel">
  <h4>📋 Rules Evaluation (Step 3.3)</h4>

  <!-- Status -->
  <div class="status">
    <template x-if="state.appliedRules && state.appliedRules.length > 0">
      <div class="rules-found">
        <strong>✓ Applied Rules:</strong> <span x-text="state.appliedRules.length"></span>
      </div>
    </template>
    <template x-if="!state.appliedRules || state.appliedRules.length === 0">
      <div class="no-rules">No rules matched</div>
    </template>
  </div>

  <!-- Rule List -->
  <template x-if="state.appliedRules && state.appliedRules.length > 0">
    <ul class="rules-list">
      <template x-for="rule in state.appliedRules">
        <li class="rule-item" :class="`rule-${rule.type.toLowerCase()}`">
          <div class="rule-header">
            <strong x-text="rule.type"></strong>
            <span class="rule-id" x-text="`(${rule.id})`"></span>
          </div>
          <div class="rule-condition" x-text="`Condition: ${rule.humanCondition}`"></div>
          <div class="rule-action" x-text="`Action: ${rule.message}`"></div>
        </li>
      </template>
    </ul>
  </template>

  <!-- Errors & Warnings -->
  <template x-if="state.ruleErrors && state.ruleErrors.length > 0">
    <div class="rule-errors">
      <strong>❌ Errors (Blocking):</strong>
      <ul>
        <template x-for="err in state.ruleErrors">
          <li x-text="err.message"></li>
        </template>
      </ul>
    </div>
  </template>

  <template x-if="state.ruleWarnings && state.ruleWarnings.length > 0">
    <div class="rule-warnings">
      <strong>⚠️ Warnings (Non-blocking):</strong>
      <ul>
        <template x-for="warn in state.ruleWarnings">
          <li x-text="warn.message"></li>
        </template>
      </ul>
    </div>
  </template>

  <!-- Debug: Raw Rules Data -->
  <details class="debug-rules">
    <summary>Debug: Raw Rules JSON</summary>
    <pre x-text="JSON.stringify(state.rules, null, 2)"></pre>
  </details>
</div>

<style>
.rules-panel {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.rules-panel h4 { margin-top: 0; }

.rules-list {
  list-style: none;
  padding: 0;
}

.rule-item {
  margin-bottom: 10px;
  padding: 10px;
  border-left: 4px solid #999;
  background: white;
}

.rule-item.rule-error {
  border-left-color: #d32f2f;
  background: #ffebee;
}

.rule-item.rule-warning {
  border-left-color: #f57c00;
  background: #fff3e0;
}

.rule-condition { color: #666; font-size: 0.9em; margin-top: 5px; }
.rule-action { color: #333; font-weight: 500; margin-top: 3px; }

.debug-rules { margin-top: 15px; }
.debug-rules pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
</style>
```

**What it displays:**
- ✅ Applied rules count
- ✅ Rule type (ERROR/WARNING)
- ✅ Humanized condition (using humanize.js)
- ✅ Action message
- ✅ Grouped errors vs warnings
- ✅ Raw rules JSON for debugging

**Update Item.toDisplayObject():**
```javascript
// Add these fields:
appliedRules: this.ruleResult?.appliedRules || [],
ruleErrors: this.ruleResult?.errors || [],
ruleWarnings: this.ruleResult?.warnings || [],
rules: this.#definition.rules || []  // For debug display
```

---

### Phase C: Test Scenarios ⏳ (30 min)

**Goal:** Create 5-6 example rules that test different JSON-Logic scenarios

**Location:** `packages/components/item/seeds.js`

**Test Rules:**

```javascript
{
  // Test 1: Simple comparison
  ID_Regla: 'R_TEST_PAX_MAX',
  Nombre: 'Max 100 pax',
  Scope: 'ITEM',
  Tipo_Accion: 'ERROR',
  Condicion_JSON: { ">": [{ "var": "linea._pax" }, 100] },
  Payload_JSON: { message: "Max 100 pax for this item." },
  Prioridad: 10,
  Acumulable: false,
  Activo: true
},
{
  // Test 2: AND condition
  ID_Regla: 'R_TEST_PAX_AND_HOURS',
  Nombre: 'Min 10 pax AND between 9-18h',
  Scope: 'ITEM',
  Tipo_Accion: 'WARNING',
  Condicion_JSON: {
    "and": [
      { "<": [{ "var": "linea._pax" }, 10] },
      { ">=": [{ "var": "linea.hora" }, "09:00"] },
      { "<=": [{ "var": "linea.hora" }, "18:00"] }
    ]
  },
  Payload_JSON: { message: "Small groups (< 10 pax) available 9am-6pm only." },
  Prioridad: 20,
  Acumulable: false,
  Activo: true
},
{
  // Test 3: OR condition
  ID_Regla: 'R_TEST_OFF_HOURS',
  Nombre: 'Outside business hours',
  Scope: 'ITEM',
  Tipo_Accion: 'WARNING',
  Condicion_JSON: {
    "or": [
      { "<": [{ "var": "linea.hora" }, "09:00"] },
      { ">": [{ "var": "linea.hora" }, "18:00"] }
    ]
  },
  Payload_JSON: { message: "After-hours booking. Premium pricing may apply." },
  Prioridad: 30,
  Acumulable: false,
  Activo: true
},
{
  // Test 4: Inactive rule (should not appear)
  ID_Regla: 'R_TEST_INACTIVE',
  Nombre: 'This rule is inactive',
  Scope: 'ITEM',
  Tipo_Accion: 'ERROR',
  Condicion_JSON: { "===": [{ "var": "linea._pax" }, 50] },
  Payload_JSON: { message: "Inactive rule - should not appear." },
  Prioridad: 1,
  Acumulable: false,
  Activo: false  // ← Inactive
},
```

**How to test manually:**
1. Start sandbox: `npm run serve:sandbox`
2. Open http://localhost:8090/step-03-item
3. Adjust "Global PAX" (should trigger R_TEST_PAX_MAX if > 100)
4. Adjust "Hora" (should trigger R_TEST_OFF_HOURS if outside 09:00-18:00)
5. See rules panel update in real-time (once RulesCoordinator implemented)

---

## Implementation Timeline

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| **A** | Update seeds.js CSV format | 30 min | None |
| **B** | Add Rules Panel UI | 1-2 hours | Phase A |
| **C** | Test scenarios | 30 min | Phase A |
| **Integration** | Implement RulesCoordinator | 2-3 hours | Phase A + B ready |

---

## Key Files to Update

1. **seeds.js** — Replace hardcoded rules with CSV format
2. **ItemStandalone.html** — Add rules display panel
3. **Item.js:toDisplayObject()** — Expose rule evaluation fields
4. **RulesCoordinator.js** (new) — Implement evaluation logic

---

## Success Criteria

- ✅ Sandbox shows Item in catalog/basket modes
- ✅ Rules displayed with humanized conditions
- ✅ Context changes (pax, hora) trigger different rules
- ✅ ERROR rules appear in errors section
- ✅ WARNING rules appear in warnings section
- ✅ Inactive rules don't appear
- ✅ Debug panel shows raw rules JSON

---

## Questions for You

1. **Phase A (Quick Win):** Should we update seeds.js now with CSV format? (No RulesCoordinator needed yet — just shows rule data)

2. **Variables naming:** Should we use `linea._pax` (legacy from v1) or simpler `pax` in test conditions? Current CSV uses `linea._pax`.

3. **Test rules scope:** Should test rules apply to just this demo item, or should we create multiple test items with different rules?

4. **Humanization:** Once RulesCoordinator returns results, should rules panel auto-humanize conditions using humanize.js?

---

## Next Steps (If Approved)

1. ✅ Approve this proposal
2. 🔨 Implement Phase A (update seeds.js)
3. 🔨 Implement Phase B (add Rules Panel UI)
4. 🔨 Implement Phase C (test scenarios)
5. 🔨 Implement RulesCoordinator integration

Ready to proceed?
