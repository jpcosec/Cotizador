# Rules Execution Pipeline

## Overview

Rules are evaluated inside `Item.calculate()` on every mutation that changes
quantities or context. The result is exposed via `toDisplayObject()` as
`appliedRules`, `ruleErrors`, `ruleWarnings`, and `available`.

---

## 1. Rule data — where it comes from

`resolveItemDefinition(itemId, db)` performs a **pre-filter** before rules ever
reach the Item:

| Filter condition | Value |
|---|---|
| `Activo`        | `true` |
| `Scope`         | `'ITEM'` |
| `Etapa`         | `'RESTRICCION_UI'` |
| `ID_Componente` | `null` (global) OR `=== itemId` |

Rules are sorted by `Prioridad ASC`. This is the only subset an Item ever sees.

---

## 2. Snapshot — variable namespace

`RulesCoordinator.evaluate()` receives a snapshot object that must match
the variable paths used in `Condicion_JSON` (JSON-Logic `{ "var": "..." }`).

All real CSV rules use the **`item.*` namespace**:

```js
// What calculate() passes:
{
  item: {
    id:    string,   // { "var": "item.id" }
    pax:       number,   // { "var": "item.pax" }
    cantidad:  number,   // { "var": "item.cantidad" }
    duracion:  number,   // { "var": "item.duracion" }
    hora:       string,   // { "var": "item.hora" }   'HH:MM'
    horaMin:    number,   // minutes from midnight
    horaFinMin: number,   // horaMin + duracion
    dia:        number,   // day number (1..N)
  }
}
```

> **Why `item.*`?** The CSV conditions were generated from the v1 quotation system
> where each basket row was called a "línea". The prefix is kept as-is — changing
> the CSV would break production data.

---

## 3. Condition evaluation — JSON-Logic

`Condicion_JSON` is a JSON-Logic expression (see https://jsonlogic.com).
Common patterns in the real data:

```json
// Pax ceiling for a specific item
{ "and": [
    { "===": [{ "var": "item.id" }, "ITEM_SALON_CHINOOK_..."] },
    {  ">"  : [{ "var": "item.pax"   }, 320                      ] }
] }

// Pax floor for a specific item
{ "and": [
    { "===": [{ "var": "item.id" }, "ITEM_CATA_VINOS_..."] },
    {  "<"  : [{ "var": "item.pax"   }, 10                    ] }
] }

// Always-on rule (no condition = fires every time)
null   →  treated as true
true   →  true
false  →  never fires
```

---

## 4. Acumulable semantics

`Acumulable: false` (the default in all CSV rules) means:

> Once **one rule of a given Tipo_Accion fires**, no further rules of that same
> type are evaluated.

- `ERROR` and `WARNING` stop independently.
- `Acumulable: true` allows multiple rules of the same type to all fire.

**Effect:** Each item surfaces at most one error and at most one warning at a time.
This prevents a flood of messages (e.g. an item with both a min-pax and a
max-pax rule only ever shows one message depending on which condition fires).

---

## 5. Action types at RESTRICCION_UI stage

Only `ERROR` and `WARNING` have UI availability effects:

| Tipo_Accion | Effect on `available` | Shown in |
|---|---|---|
| `ERROR`   | Sets `available = false` (blocking) | `ruleErrors[]` |
| `WARNING` | No change (non-blocking)            | `ruleWarnings[]` |
| Other (`MULTIPLY`, `ADD_FIXED`, etc.) | None — recorded in `appliedRules` only | diagnostics |

The other action types belong to later pipeline stages (`AJUSTE_LINEA`,
`AJUSTE_GLOBAL`, `IMPUESTO`) and have no effect at the UI restriction phase.

---

## 6. Execution order

```
Item.calculate()
  │
  ├─ resolve quantities (pax, cantidad, duracionMin)
  ├─ resolve schedule (hora, dia, horaMin, horaFinMin)
  │
  ├─ rulesCoordinator.invalidateCache()      ← force re-eval every calculate()
  ├─ rulesCoordinator.evaluate({ item: { ... } })
  │    │
  │    ├─ for each rule (sorted by Prioridad ASC):
  │    │    ├─ skip if same-type already fired with Acumulable=false
  │    │    ├─ evaluateCondition(Condicion_JSON, snapshot)
  │    │    │    └─ jsonLogic.apply(logic, snapshot)
  │    │    └─ on match: push to appliedRules, errors, warnings; update available
  │    │
  │    └─ cache result
  │
  └─ store in this.#ruleResult
```

---

## 7. toDisplayObject() outputs

| Field | Type | Description |
|---|---|---|
| `appliedRules` | `{ id, type, priority, message, humanCondition, humanPayload }[]` | All rules that fired |
| `ruleErrors`   | same[] | Subset where `type === 'ERROR'` |
| `ruleWarnings` | same[] | Subset where `type === 'WARNING'` |
| `available`    | boolean | `false` if any ERROR fired |
