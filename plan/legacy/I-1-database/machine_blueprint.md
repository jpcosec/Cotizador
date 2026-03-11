# I-1 Database Playground — Machine Blueprint

<!-- NOTE: Resolver panel is out of scope for I-1. It lives in III-1. -->
## Role of the machine

The DB viewer has the richest interactive state of all Phase I playgrounds. Browsing, inline-editing, and row-adding are mutually **exclusive modes** — the machine earns its place here because guards block invalid transitions (can't commit a row with validation errors) and because the async surface (GAS writes in Phase 4) is real. Without a machine, all of this would be imperative flag-juggling in Alpine.

---

## States

```
browsing         ← default; user navigates tables, sorts, filters
editing          ← one cell has keyboard focus; buffer accumulates keystrokes
addingRow        ← a blank pending row is appended; first required field is focused
```

### Transitions

| From | Event | Guard | To |
|------|-------|-------|----|
| browsing | SELECT_TABLE | — | browsing |
| browsing | SORT | — | browsing | <!-- Alpine reactive; no machine needed — kept here for completeness -->
| browsing | TOGGLE_FILTER | — | browsing | <!-- Alpine reactive; no machine needed — kept here for completeness -->
| browsing | DOUBLE_CLICK_CELL | — | editing |
| browsing | ADD_ROW | — | addingRow |
| browsing | DELETE_ROW | isConfirmedDelete | browsing |
| editing | UPDATE_BUFFER | — | editing |
| editing | COMMIT_EDIT | isValidEdit | browsing |
| editing | COMMIT_EDIT | !isValidEdit | editing (self — sets fieldError) |
| editing | CANCEL_EDIT | — | browsing |
| addingRow | UPDATE_BUFFER | — | addingRow |
| addingRow | COMMIT_ADD | isValidRow | browsing |
| addingRow | COMMIT_ADD | !isValidRow | addingRow (self — sets errors) |
| addingRow | CANCEL_ADD | — | browsing |

---

## Context

```
activeTable      which table is displayed — one of the 11 keys in DATA_SCHEMA:
                 'CLIENTES' | 'CATEGORIAS' | 'ITEM_CATALOGO' | 'PERFILES_PRECIO' |
                 'COMPOSICION_KIT' | 'REGLAS_NEGOCIO' | 'COTIZACIONES' | 'LINEA_DETALLE' |
                 'AJUSTES_COTIZACION' | 'CACHE_COTIZACION' | 'HISTORIAL_COTIZACION'
                 Initial value: 'PERFILES_PRECIO' (first non-transactional table)

rows             map of tableId → row[]  (in-memory store snapshot; updated after each write)

sort             { column: string | null, dir: 'asc' | 'desc' }

tagFilters       string[]  (active chip values — e.g. category IDs for ITEM_CATALOGO)

editTarget       { rowId, field, buffer, originalValue, error } | null
                 null when not in editing state

pendingRow       { fields: {[field]: value}, errors: {[field]: string} } | null
                 null when not in addingRow state

```

---

## Guards

| Guard | Logic |
|-------|-------|
| `isValidEdit` | `validation.validateField(activeTable, editTarget.field, editTarget.buffer)` returns no error |
| `isValidRow` | `validation.validateRow(activeTable, pendingRow.fields)` returns no errors |
| `isConfirmedDelete` | inline confirm state (a second click on a "confirm" button, not `window.confirm`) |

---

## Events (full list)

| Event | Payload |
|-------|---------|
| SELECT_TABLE | `{ tableId }` |
| SORT | `{ column }` (toggles dir if same column) |
| TOGGLE_FILTER | `{ tag }` |
| DOUBLE_CLICK_CELL | `{ rowId, field, value }` |
| UPDATE_BUFFER | `{ value }` |
| COMMIT_EDIT | — |
| CANCEL_EDIT | — |
| ADD_ROW | — |
| COMMIT_ADD | — |
| CANCEL_ADD | — |
| DELETE_ROW | `{ rowId }` |

---

## Closure pattern

The `InMemoryStore` instance lives in the factory closure — not in machine context (it's not serializable). Actions call `editService.updateRow / addRow / deleteRow` on the store, then refresh `context.rows` by reading back from the store.

```
factory closure:
  store = createDatabase(seed)   ← mutable, never in context

machine context:
  rows = store.getAll(table)     ← plain snapshot, updated after each write
```

---

## Alpine connection

Alpine is display-only. It sends events up to the actor and renders whatever is in `snapshot.context`.

```
init()
  actor.subscribe(snap => Object.assign(this, snap.context))

Table tab click      → actor.send({ type: 'SELECT_TABLE', tableId })
Column header click  → actor.send({ type: 'SORT', column })
Tag chip click       → actor.send({ type: 'TOGGLE_FILTER', tag })
Cell double-click    → actor.send({ type: 'DOUBLE_CLICK_CELL', rowId, field, value })
Input keydown Enter  → actor.send({ type: 'COMMIT_EDIT' })
Input keydown Escape → actor.send({ type: 'CANCEL_EDIT' })
Input @input         → actor.send({ type: 'UPDATE_BUFFER', value: $el.value })
Add row button       → actor.send({ type: 'ADD_ROW' })
Save new row         → actor.send({ type: 'COMMIT_ADD' })
Cancel new row       → actor.send({ type: 'CANCEL_ADD' })
Delete button        → actor.send({ type: 'DELETE_ROW', rowId })
```

### UI state derivations (Alpine computes from context, no extra state)

| UI element | Derived from |
|-----------|--------------|
| Active table tab highlight | `activeTable` |
| Row count pill | `rows[activeTable].length` |
| Filtered rows | `rows[activeTable]` filtered by `tagFilters` + sorted by `sort` |
| Inline edit input visible | `editTarget !== null && editTarget.rowId === row.id && editTarget.field === field` |
| Cell error outline | `editTarget.error !== null` (in editing state) |
| Pending row visible | `pendingRow !== null` (green-left-border accent) |

---

## Async readiness (Phase 4)

When GAS is wired in, `COMMIT_EDIT` and `COMMIT_ADD` gain a `saving` intermediate state. The machine absorbs this without Alpine changes — Alpine just sees a `isSaving: true` flag in context and disables the commit button.

```
editing → COMMIT_EDIT [valid] → saving → (on done) → browsing
                                        → (on error) → editing (sets error)
```
