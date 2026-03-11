# U-1 Save Vertical Slice — Agent Guideline

## Context

You are implementing the first persistence vertical slice. The quotation runtime already produces a complete in-memory snapshot with client, settings, and basket state across multiple days. Your job is to:

1. Define a SavePayload contract mapping runtime snapshot → DB schema tables.
2. Build a pure serialization mapper.
3. Build a persistence port with a local adapter.
4. Wire `confirmSave()` into the runtime and UI.

Prerequisites: The quotation internal runtime (`createQuotationInternalRuntime`) must be functional with basket state including entries across days. This is already the case.

Run `npm test` after every step. Do not proceed if tests fail.

---

## Step 1 — Write SavePayload contract

File: `packages/database/src/persistence/SavePayload.md`

Document before writing any code:

1. **Input** — what comes from `runtime.getSnapshot()` (client, settings, basket.days[].entries[])
2. **Output** — what gets written to `COTIZACIONES` and `LINEA_DETALLE` (exact field names from `Config_Schema.js`)
3. **Mapping rules** — how each runtime field maps to each DB column
4. **ID generation** — `COT-{timestamp}-{random}` for cotizacion, `LIN-{seq}` for lineas

Cross-reference:
- `packages/database/src/Config_Schema.js:119-146` for table schemas
- `apps/quotation/state/createQuotationInternalRuntime.js:62-86` for `buildValidationProjection()`
- `packages/components/item/Item.js` for `toSeed()` shape

Commit: `docs: add SavePayload contract for quotation persistence`

---

## Step 2 — Implement serialization mapper

File: `packages/database/src/persistence/serializeQuotation.js`

Pure function:

```
serializeQuotation({ client, settings, basketState }) → { cotizacion, lineas }
```

Rules:
- `cotizacion` is a single object with all `COTIZACIONES` columns populated
- `lineas` is an array of objects, one per entry across all days, with all `LINEA_DETALLE` columns
- Generate `ID_Cotizacion` using `COT-{Date.now()}-{random}`
- Generate `ID_Linea` using `LIN-{cotizacionId}-{seq}`
- Map overrides: `entry.state.overrides.pax` → `Override_Pax`, etc.
- Map schedule: `entry.state.schedule.hora` → `Hora_Inicio`
- Map comments: `entry.state.overrides.comentarios` → `Comentarios`
- Set `Estado` to `'Borrador'` and `Estado_Linea` to `'ACTIVA'`
- Set `Updated_At` to current ISO timestamp

Write tests first in `packages/database/src/persistence/serializeQuotation.test.js`:
- Serializes single-day quotation correctly
- Serializes multi-day quotation with entries distributed across days
- Maps all override fields
- Generates unique IDs
- Handles empty basket gracefully

Commit: `feat: add serializeQuotation mapper with tests`

---

## Step 3 — Implement PersistencePort + LocalPersistenceAdapter

Files:
- `packages/database/src/persistence/PersistencePort.js`
- `packages/database/src/persistence/LocalPersistenceAdapter.js`

### PersistencePort interface

```js
export class PersistencePort {
  async save(payload) { throw new Error('Not implemented'); }
  async load(id) { throw new Error('Not implemented'); }
}
```

### LocalPersistenceAdapter

- Constructor receives `{ models }` (from `createDatabase()`)
- `save(payload)`:
  - Inserts `payload.cotizacion` into `models.COTIZACIONES`
  - Inserts each `payload.lineas[i]` into `models.LINEA_DETALLE`
  - Returns `{ ok: true, id: payload.cotizacion.ID_Cotizacion }`
  - On error returns `{ ok: false, error: message }`
- `load(id)`:
  - Finds cotizacion by `ID_Cotizacion`
  - Finds all lineas where `ID_Cotizacion` matches
  - Returns `{ ok: true, data: { cotizacion, lineas } }`
  - On error returns `{ ok: false, error: message }`

Add tests:
- Save writes both tables
- Load retrieves matching records
- Load with unknown ID returns error
- Save with duplicate ID returns error

Commit: `feat: add PersistencePort and LocalPersistenceAdapter`

---

## Step 4 — Wire confirmSave() into runtime

File: `apps/quotation/state/createQuotationInternalRuntime.js`

Add to the runtime factory options:
- Accept `persistence` option (a `PersistencePort` instance)
- Default to `LocalPersistenceAdapter` backed by a separate `createDatabase()` instance for transactional tables

Add to the runtime API:

```js
async confirmSave() {
  const snapshot = getSnapshot();
  const payload = serializeQuotation({
    client: selectedClient,
    settings,
    basketState: basketActor.getSnapshot().context.state,
  });
  const result = await persistence.save(payload);
  if (result.ok) {
    stage = 'completed';
    quotationId = result.id;
    notify();
  }
  return result;
}

async loadQuotation(id) {
  const result = await persistence.load(id);
  // Reconstruct basket state from lineas (future — for now just return data)
  return result;
}
```

Add `quotationId` to `getSnapshot()` output.

Commit: `feat: wire confirmSave command into quotation runtime`

---

## Step 5 — Wire UI

Files:
- `apps/quotation/playground/QuotationFlowInternal.html`
- `bundling/createQuotationFlowComponent.js`

### QuotationFlowInternal.html changes

Replace:
```html
<button class="btn btn-small btn-primary" disabled>Confirm (deferred)</button>
```

With:
```html
<button class="btn btn-small btn-primary" @click="confirmSave()">Confirm & Save</button>
```

Add completed stage:
```html
<template x-if="stage === 'completed'">
  <section class="panel validation-panel">
    <h2>Quotation Saved</h2>
    <p>ID: <strong x-text="quotationId"></strong></p>
    <button class="btn btn-small btn-secondary" @click="resetToBrowse()">New Quotation</button>
  </section>
</template>
```

### createQuotationFlowComponent.js changes

Add `quotationId: null` to initial state.
Add `confirmSave()` method that calls `runtime.confirmSave()`.
Sync `quotationId` from snapshot.

Rebuild bundle:
```bash
npm run build
```

Commit: `feat: enable Confirm & Save in quotation UI`

---

## Step 6 — E2E verification

### Automated
```bash
npm test
```

### Manual (sandbox)
```bash
npm run serve:sandbox
# Open quotation route, create items, validate, confirm
```

### Manual (GAS preview)
```bash
npm run dev:gas
# Same flow at http://localhost:8082
```

Commit: `test: add save flow integration tests`

---

## What NOT to do

- Do not implement GAS SpreadsheetApp writes — that is U-3
- Do not implement PDF generation — that is U-4
- Do not modify item/basket/catalog machine contracts
- Do not add async loading from Google Sheets — keep local for now
- Do not implement `loadQuotation` basket reconstruction yet — just the data retrieval
