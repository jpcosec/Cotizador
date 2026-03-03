# Writing Rules Guide

Rules are the primary mechanism for expressing business constraints on quotation items.
They are stored in `REGLAS_NEGOCIO` and evaluated at runtime using JSON Logic.

---

## Rule Structure

```javascript
{
  ID_Regla:        'R_AUT_0001',     // Unique identifier
  Nombre:          'Aforo máximo',   // Human-readable name
  Scope:           'ITEM',           // Component type (see Scopes)
  Tipo_Accion:     'ERROR',          // What to do when triggered (see Actions)
  Condicion_JSON:  { ">": [{ "var": "pax" }, 320] },  // When to trigger
  Payload_JSON:    { message: 'Capacidad máxima 320 pax' },
  Prioridad:       10,               // Evaluation order (lower = first)
  Activo:          true,             // Enabled flag
}
```

---

## Scopes

| Scope       | Evaluated against    | Filtered by        |
|-------------|---------------------|--------------------|
| `ITEM`      | Single item line    | `ID_Item`          |
| `CATEGORY`  | Category aggregate  | `ID_Category`      |
| `KIT`       | Kit line            | `ID_Kit`           |
| `CONTAINER` | Day/container       | `ID_Container`     |
| `BASKET`    | Entire quotation    | *(no ID filter)*   |

---

## Action Types

| Action              | Effect                              | Blocks item? |
|---------------------|-------------------------------------|:------------:|
| `ERROR`             | Blocks item — cannot be added       | ✅ Yes       |
| `WARNING`           | Shows caution — item still works    | ❌ No        |
| `MULTIPLY`          | Price multiplier (future)           | ❌ No        |
| `ADD_FIXED`         | Flat fee added to total (future)    | ❌ No        |
| `SET_VALUE`         | Override unit price (future)        | ❌ No        |
| `SET_TAX`           | Apply named tax rate (future)       | ❌ No        |
| `SET_DEFAULT`       | Override default quantity (future)  | ❌ No        |
| `ADD_ITEM`          | Auto-include another item (future)  | ❌ No        |
| `INVALIDATE_BASKET` | Block entire quotation (future)     | ✅ Yes       |

---

## Condition Variables (Snapshot)

The condition receives a snapshot of the item at evaluation time.
All variables are plain numbers or strings — use `{ "var": "fieldName" }` to reference them.

| Variable      | Type     | Description                                         | Example      |
|---------------|----------|-----------------------------------------------------|--------------|
| `itemId`      | string   | Item identifier                                     | `'ITEM_001'` |
| `pax`         | number   | Resolved pax count                                  | `50`         |
| `cantidad`    | number   | Resolved unit count                                 | `3`          |
| `duracionMin` | number   | Duration in minutes                                 | `120`        |
| `hora`        | string   | Start time as entered (display only)                | `'21:30'`    |
| `horaMin`     | number   | Start time as **event minutes** (use for comparisons) | `1290`     |
| `horaFinMin`  | number   | End time = `horaMin + duracionMin`                  | `1410`       |
| `dia`         | number   | Day number within the quotation (1-based)           | `2`          |

### Time Variables — Important

`hora` is a raw string (`'21:30'`, `'1:00 AM'`). **Do not use it for comparisons** — string
ordering breaks across midnight and 12h/24h format differences.

Use `horaMin` and `horaFinMin` instead. They are monotonic integers anchored to the venue's
event day (boundary: 09:00). Times before 09:00 are treated as next-day overflow (+1440):

```
09:00 →  540   (day start)
21:00 → 1260
23:59 → 1439
00:00 → 1440   (midnight → next-day)
01:00 → 1500   (1 AM → correctly > 21:00)
08:59 → 1979
```

**Common time thresholds:**

| Time       | `horaMin` | Notes                  |
|------------|-----------|------------------------|
| `09:00`    | 540       | Venue opens (boundary) |
| `18:00`    | 1080      | End of standard day    |
| `21:00`    | 1260      | Overtime threshold     |
| `00:00`    | 1440      | Midnight               |
| `01:00`    | 1500      | Late night             |

---

## Condition Examples

### Quantity comparisons

```json
{ ">": [{ "var": "pax" }, 320] }
```
*Triggers when pax exceeds 320.*

```json
{ "<": [{ "var": "pax" }, 10] }
```
*Triggers when fewer than 10 pax.*

```json
{ "and": [
  { ">=": [{ "var": "pax" }, 50] },
  { "<=": [{ "var": "pax" }, 150] }
] }
```
*Triggers when pax is between 50 and 150 (inclusive).*

---

### Time comparisons

```json
{ ">": [{ "var": "horaMin" }, 1260] }
```
*Triggers when item starts after 21:00 (overtime).*

```json
{ ">": [{ "var": "horaFinMin" }, 1440] }
```
*Triggers when item ends past midnight.*

```json
{ "and": [
  { ">": [{ "var": "horaMin" }, 1260] },
  { "<=": [{ "var": "horaFinMin" }, 1500] }
] }
```
*Triggers when item starts after 21:00 but ends before 01:00.*

> **Why not compare `hora` strings?**
> `'01:00' < '21:00'` is true as a string — wrong for next-day events.
> `horaMin` for 01:00 is 1500, correctly greater than 1260 (21:00).

---

### Duration comparisons

```json
{ ">": [{ "var": "duracionMin" }, 240] }
```
*Triggers when item runs longer than 4 hours.*

---

### Logical operators

```json
{ "or": [
  { "<": [{ "var": "pax" }, 10] },
  { ">": [{ "var": "pax" }, 320] }
] }
```
*Triggers when pax is outside the valid range (10–320).*

```json
{ "!": [{ ">": [{ "var": "pax" }, 0] }] }
```
*Triggers when pax is zero.*

---

### Always / Never

```json
true
```
*Rule always triggers (use for unconditional messages or surcharges).*

```json
false
```
*Rule never triggers (useful for temporarily disabling without deleting).*

---

## Full Rule Examples

### Block oversized groups

```javascript
{
  ID_Regla:       'R_SALON_MAX_PAX',
  Nombre:         'Salón: aforo máximo',
  Scope:          'ITEM',
  Tipo_Accion:    'ERROR',
  Condicion_JSON: { ">": [{ "var": "pax" }, 320] },
  Payload_JSON:   { message: 'Capacidad máxima del salón: 320 personas' },
  Prioridad:      10,
  Activo:         true,
}
```

### Warn about after-hours events

```javascript
{
  ID_Regla:       'R_OVERTIME_WARNING',
  Nombre:         'Evento fuera de horario estándar',
  Scope:          'ITEM',
  Tipo_Accion:    'WARNING',
  Condicion_JSON: { ">": [{ "var": "horaMin" }, 1260] },
  Payload_JSON:   { message: 'El evento comienza después de las 21:00. Se aplica cargo por extensión.' },
  Prioridad:      20,
  Activo:         true,
}
```

### Block events that end past midnight

```javascript
{
  ID_Regla:       'R_NO_PAST_MIDNIGHT',
  Nombre:         'No se puede continuar después de medianoche',
  Scope:          'ITEM',
  Tipo_Accion:    'ERROR',
  Condicion_JSON: { ">": [{ "var": "horaFinMin" }, 1440] },
  Payload_JSON:   { message: 'El ítem excede la medianoche. Ajusta la hora o la duración.' },
  Prioridad:      15,
  Activo:         true,
}
```

### Warn about very short durations

```javascript
{
  ID_Regla:       'R_MIN_DURATION',
  Nombre:         'Duración mínima recomendada',
  Scope:          'ITEM',
  Tipo_Accion:    'WARNING',
  Condicion_JSON: { "and": [
    { ">": [{ "var": "duracionMin" }, 0] },
    { "<": [{ "var": "duracionMin" }, 30] }
  ] },
  Payload_JSON:   { message: 'La duración mínima recomendada es 30 minutos.' },
  Prioridad:      25,
  Activo:         true,
}
```

---

## Priority Order

Rules are evaluated in ascending `Prioridad` order. Lower number = evaluated first.

```
10  ← blocking capacity checks (ERROR)
20  ← blocking time/date checks (ERROR)
30  ← warnings (WARNING)
50  ← surcharges and modifiers (MULTIPLY, ADD_FIXED)
```

If multiple rules match, all are recorded (unless a non-accumulative rule stops evaluation).

---

## Testing Your Rules

Use the Item sandbox to test rules interactively before storing them in the database:

```
http://localhost:8090/step-03-item/
```

Or write a unit test:

```javascript
import { Item } from '../../Item.js';

const item = await Item.fromDefinition({
  id: 'SALON_01',
  name: 'Salón Principal',
  pricingProfile: { tipo: 'porPersona', tarifa: 5000 },
  rules: [
    {
      ID_Regla: 'R_TEST',
      Nombre: 'Test overtime',
      Scope: 'ITEM',
      Tipo_Accion: 'WARNING',
      Condicion_JSON: { ">": [{ "var": "horaMin" }, 1260] },
      Payload_JSON: { message: 'Overtime applies' },
      Prioridad: 10,
      Activo: true,
    }
  ]
}).initialize();

item.setOverride('hora', '22:00');
const { ruleWarnings } = item.toDisplayObject();
console.log(ruleWarnings); // → [{ message: 'Overtime applies', ... }]
```

---

## Reference

- **JSON Logic operators:** [jsonlogic.com](https://jsonlogic.com/)
- **Time utilities:** `packages/components/item/domain/time.js`
- **RulesCoordinator:** `packages/components/item/domain/rulesEngine/coordinator.js`
- **Rule structure (full CSV schema):** `claps_codelab/src/Config/Config_Schema.js` → `REGLAS_NEGOCIO`
