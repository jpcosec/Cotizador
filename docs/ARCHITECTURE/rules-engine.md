# Rules Engine

## Overview

The Rules Engine is a data-driven, pipeline-aware system that applies business logic during quotation pricing. Rules are stored in the `REGLAS_NEGOCIO` table and are evaluated at runtime against line items and basket context. Each rule has a condition (JSON Logic), an action type, and a payload — making the system configurable without code changes.

**Source:** `packages/pricing/src/RulesEngine/`

---

## How a Rule Works

Every row in `REGLAS_NEGOCIO` defines one rule:

| Field | Type | Purpose |
|---|---|---|
| `ID_Regla` | PK | Unique identifier |
| `Etapa` | ENUM | Which pipeline stage runs this rule |
| `Scope` | ENUM | What entity the rule targets |
| `Tipo_Accion` | ENUM | What the action does when triggered |
| `Hook` | ENUM / null | Optional lifecycle sub-filter |
| `Condicion_JSON` | JSON | JsonLogic predicate — when to fire |
| `Payload_JSON` | JSON | Parameters passed to the action handler |
| `Prioridad` | INTEGER | Execution order within the stage (lower = first) |
| `Acumulable` | BOOLEAN | If `false`, stops processing further rules after this one fires |
| `Activo` | BOOLEAN | Logical enable/disable without deletion |

---

## Pipeline Stages

Rules run in exactly five stages, in order:

```
1. CANTIDAD_DEFAULT   — override computed quantity/pax/duration before pricing
2. RESTRICCION_UI     — validation errors that block a basket or line
3. AJUSTE_LINEA       — per-line price adjustments (discounts, surcharges)
4. AJUSTE_GLOBAL      — basket-level adjustments applied after line totals
5. IMPUESTO           — tax calculation applied on the subtotal
```

Each stage receives a different evaluation context (what `Condicion_JSON` can reference):

| Stage | Context object passed to condition |
|---|---|
| `CANTIDAD_DEFAULT` | `{ linea }` |
| `RESTRICCION_UI` | `{ linea }` or `{ lineas, quotation }` |
| `AJUSTE_LINEA` | the `linea` object directly |
| `AJUSTE_GLOBAL` | `{ subtotal, lineas }` |
| `IMPUESTO` | `{ subtotal, lineas }` |

---

## Condition Evaluation

Conditions use [JsonLogic](https://jsonlogic.com). The `Condicion_JSON` field is evaluated against the context for that stage.

```js
// Always fires
Condicion_JSON: true

// Only fires for salon category items exceeding 8 hours
Condicion_JSON: { "and": [
  { "===": [{ "var": "_categoriaId" }, "CAT_SALON"] },
  { ">":   [{ "var": "_duracionMin" }, 480] }
]}

// Only fires when no quantity override is set
Condicion_JSON: { "===": [{ "var": "linea.Override_Cantidad" }, null] }
```

If the condition returns falsy, the rule is skipped entirely.

---

## Action Types

When a condition passes, the action handler runs with `(payload, target)`:

| Action | Payload fields | Target used | Effect |
|---|---|---|---|
| `MULTIPLY` | `factor` | `target.neto` | `delta = neto * (factor - 1)` — proportional surcharge or discount |
| `ADD_FIXED` | `amount` | — | `delta = amount` — fixed monetary adjustment (negative = discount) |
| `SET_VALUE` | `value` | `target.neto` | `delta = value - neto` — forces price to an exact amount |
| `SET_TAX` | `name`, `rate` | `target.subtotal` | `amount = subtotal * rate` — adds a named tax entry |
| `SET_DEFAULT` | `field`, `value` | — | Sets a quantity/pax/duration field; `delta = 0` |
| `ADD_ITEM` | `itemId` | — | Signals auto-add of another item; `delta = 0` |
| `WARNING` | `message` | — | Adds a warning message; `delta = 0` |
| `ERROR` | `message` | — | Adds a blocking error message; `delta = 0` |
| `INVALIDATE_BASKET` | `message` | — | Marks the basket as invalid; `delta = 0` |

All handlers return an object with at minimum `{ delta, description }`. Actions that don't affect price return `delta: 0`.

---

## Execution Flow per Stage

### CANTIDAD_DEFAULT
Runs after category-based defaults are resolved. Used to set item-specific quantity overrides via rules (e.g., "if this item has no quantity override, default to 60").

```
resolveDefaults(linea, paxGlobal, store)   ← category/item base defaults
applyCantidadDefaultRules(linea, store)    ← CANTIDAD_DEFAULT rules on top
```

### RESTRICCION_UI
Runs per line and per basket. Rules with `Tipo_Accion: 'ERROR'` produce blocking errors attached to the result.

### AJUSTE_LINEA
Runs per line. Each matching rule appends to `linea._ajustes` and updates `linea._netoAjustado`:

```
linea._netoAjustado = linea._netoBase   // reset
for each rule (sorted by Prioridad):
  if condition passes:
    result = executeAction(...)
    linea._ajustes.push({ ruleId, ...result })
    linea._netoAjustado += result.delta
    if !rule.Acumulable: break          // stop after first non-accumulating rule
```

### AJUSTE_GLOBAL
Runs once on the basket subtotal. Results are pushed to a `messages` array, not onto individual lines.

### IMPUESTO
Runs on the final subtotal. Each matching rule produces a named tax entry `{ name, rate, amount }`. The total is `subtotal + sum(taxes)`.

---

## Action Registry

Actions self-register by importing `registerAction` from `actions/index.js`. The registry is a module-level `Map`.

```js
// Each action file does this:
registerAction('MULTIPLY', (payload, target) => { ... });
```

`RulesEngine.js` imports all action files, triggering registration as a side effect. `getActionHandler(name)` throws if the action type is not registered.

To add a new action:
1. Create `packages/pricing/src/RulesEngine/actions/my_action.js`
2. Call `registerAction('MY_ACTION', handler)`
3. Import the file in `RulesEngine.js`
4. Add `'MY_ACTION'` to the `Tipo_Accion` ENUM in `Config_Schema.js`

---

## Example Rule (Overtime Surcharge)

```js
{
  ID_Regla: 'R001_OVERTIME',
  Nombre: 'Sobreturno salón (>8h)',
  Etapa: 'AJUSTE_LINEA',
  Scope: 'CATEGORIA',
  Tipo_Accion: 'MULTIPLY',
  Condicion_JSON: { "and": [
    { "===": [{ "var": "_categoriaId" }, "CAT_SALON"] },
    { ">":   [{ "var": "_duracionMin" }, 480] },
  ]},
  Payload_JSON: { factor: 1.25 },
  Prioridad: 10,
  Acumulable: false,
  Activo: true,
}
```

When a salon line exceeds 480 minutes, the price is multiplied by 1.25 (+25%). Because `Acumulable: false`, no other `AJUSTE_LINEA` rule fires after this one for that line.

---

## Example Rule (IVA Tax)

```js
{
  ID_Regla: 'R002_IVA',
  Etapa: 'IMPUESTO',
  Scope: 'COTIZACION',
  Tipo_Accion: 'SET_TAX',
  Condicion_JSON: true,           // always fires
  Payload_JSON: { name: 'IVA', rate: 0.19 },
  Prioridad: 100,
  Acumulable: true,
  Activo: true,
}
```

Applies 19% IVA to the basket subtotal unconditionally.

---

## Key Constraints

- Rules are fetched from the store at runtime, not bundled — changing data changes behavior without redeployment.
- The pricing layer never writes to the database; it only reads rules via the injected `store`.
- `Acumulable: false` stops the rule loop for that item/stage after the first match.
- Rules with `Activo: false` are filtered out before evaluation.
- `Hook` can optionally narrow rules to a lifecycle phase (`pre_execution`, `execute`, `post_execution`). A rule with `Hook: null` matches any hook filter.

---

## Human-Readable Rule Display

**Source:** `packages/pricing/src/RulesEngine/humanize.js`
**Exported from:** `packages/pricing/src/RulesEngine/RulesEngine.js`

Three pure functions convert raw rule data into readable strings for debug logging, audit trails, and UI tooltips.

### `humanizeCondition(condJson)`

Converts a JsonLogic condition object (or JSON string) into a human-readable expression.

```js
humanizeCondition({ "===": [{ "var": "_categoriaId" }, "CAT_SALON"] })
// → "_categoriaId = CAT_SALON"

humanizeCondition({ "and": [
  { "===": [{ "var": "_categoriaId" }, "CAT_SALON"] },
  { ">":   [{ "var": "_duracionMin" }, 480] }
]})
// → "(_categoriaId = CAT_SALON) AND (_duracionMin > 480)"

humanizeCondition(true)   // → "always"
humanizeCondition(false)  // → "never"
```

Supported operators: `===`, `!==`, `>`, `>=`, `<`, `<=`, `and`, `or`, `!`, `in`.
Unknown operators fall back to `JSON.stringify`.

### `humanizePayload(tipoAccion, payloadJson)`

Converts an action type + payload into a concise description.

```js
humanizePayload('MULTIPLY', { factor: 1.25 })
// → "×1.25 (+25%)"

humanizePayload('ADD_FIXED', { amount: -5000 })
// → "−$5000 flat"

humanizePayload('SET_TAX', { name: 'IVA', rate: 0.19 })
// → "IVA 19%"

humanizePayload('WARNING', { message: 'Capacity exceeded' })
// → "Capacity exceeded"
```

Unknown action types fall back to `JSON.stringify(payload)`.

### `humanizeRule(rule)`

Produces a one-line summary of a full rule object.

```js
humanizeRule({
  Tipo_Accion: 'MULTIPLY',
  Condicion_JSON: { "and": [
    { "===": [{ "var": "_categoriaId" }, "CAT_SALON"] },
    { ">": [{ "var": "_duracionMin" }, 480] }
  ]},
  Payload_JSON: { factor: 1.25 }
})
// → "When (_categoriaId = CAT_SALON) AND (_duracionMin > 480), MULTIPLY ×1.25 (+25%)"

humanizeRule({
  Tipo_Accion: 'SET_TAX',
  Condicion_JSON: true,
  Payload_JSON: { name: 'IVA', rate: 0.19 }
})
// → "When always, SET_TAX IVA 19%"
```

### Use cases

- **Debug logging:** `console.log(humanizeRule(rule))` in tests or dev builds
- **Audit trails:** Include in quotation logs for traceability
- **UI tooltips:** Display readable rule descriptions in admin panels
