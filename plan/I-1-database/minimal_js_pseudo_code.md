# I-1 Database — Minimal JS Pseudo Code

## Data source

The only source of truth for table data is `data/init/*.csv`.
Row shapes are defined by `packages/database/src/Config_Schema.js`.
Do not maintain a separate hand-written fixture for the playground or tests —
load data via `loadSeedFromCsvUrl()` (browser) or `loadSeedFromCsvDir()` (Node.js).

---

## `editService.js` — write helpers with safe return contract 

```js
export function updateRow(model, id, patch) {
  try {
    const row = model.findById(id)
    if (!row) return { ok: false, data: null, error: `Row not found: ${id}` }
    const updated = model.update({ ...row, ...patch })
    return { ok: true, data: updated, error: null }
  } catch (error) {
    return { ok: false, data: null, error: String(error.message || error) }
  }
}

export function addRow(model, row) {
  try {
    return { ok: true, data: model.create(row), error: null }
  } catch (error) {
    return { ok: false, data: null, error: String(error.message || error) }
  }
}

export function deleteRow(model, id) {
  try {
    const deleted = model.deleteById(id)
    if (!deleted) return { ok: false, data: null, error: `Row not found: ${id}` }
    return { ok: true, data: { id }, error: null }
  } catch (error) {
    return { ok: false, data: null, error: String(error.message || error) }
  }
}
```

---

## `validation.js` — schema-driven checks

```js
export function validateField(tableName, fieldName, value, context) {
  const column = context.schema[tableName].columns.find((c) => c.name === fieldName)
  if (!column) return null

  if (!column.nullable && (value === null || value === undefined || value === '')) {
    return 'Campo requerido'
  }

  if (column.type === 'ENUM' && Array.isArray(column.options) && value != null) {
    if (!column.options.includes(value)) return 'Valor no permitido'
  }

  if (column.type === 'FK' && value != null) {
    const target = context.models[column.ref]
    const fkExists = Boolean(target?.findById(value))
    if (!fkExists) return `No existe referencia en ${column.ref}`
  }

  return null
}

export function validateRow(tableName, row, context) {
  const errors = {}
  for (const key of Object.keys(row)) {
    const error = validateField(tableName, key, row[key], context)
    if (error) errors[key] = error
  }
  return errors
}
```
