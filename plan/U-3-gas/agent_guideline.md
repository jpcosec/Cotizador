# U-3 GAS Persistence — Agent Guideline

## Context

You are bridging the local persistence from U-1 to real Google Sheets. The `PersistencePort` interface is already defined. Your job is to:

1. Add GAS server-side functions (`saveQuotation`, `loadQuotation`) that read/write Sheets.
2. Build `GasSheetAdapter` (client-side) that calls those functions via `google.script.run`.
3. Extend `Local_GAS_Shim.html` so local preview keeps working.
4. Wire adapter selection into the bundled runtime.

Prerequisites: U-1 must be complete. `PersistencePort`, `LocalPersistenceAdapter`, and `serializeQuotation` must exist and have passing tests.

Reference: `claps_codelab/SheetDB.js` for the legacy Sheets ORM pattern. `claps_codelab/Stores_App.html:199-307` for the legacy client-side persistence calls.

Run `npm test` after every step.

---

## Step 1 — Add GAS server functions to template

File: `tools/generate_gas_code.mjs`

Add function templates that will be generated into `gas/Code.gs`:

```js
function saveQuotation(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cotSheet = ss.getSheetByName('COTIZACIONES');
  var lineaSheet = ss.getSheetByName('LINEA_DETALLE');

  // Write cotizacion header row
  var cotHeaders = cotSheet.getRange(1, 1, 1, cotSheet.getLastColumn()).getValues()[0];
  var cotRow = cotHeaders.map(function(h) { return payload.cotizacion[h] || ''; });
  cotSheet.appendRow(cotRow);

  // Write each linea
  var lineaHeaders = lineaSheet.getRange(1, 1, 1, lineaSheet.getLastColumn()).getValues()[0];
  payload.lineas.forEach(function(linea) {
    var row = lineaHeaders.map(function(h) { return linea[h] || ''; });
    lineaSheet.appendRow(row);
  });

  return { ok: true, id: payload.cotizacion.ID_Cotizacion };
}

function loadQuotation(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // ... find cotizacion by ID, find matching lineas, return joined data
}
```

Run `npm run build:gas` to regenerate `gas/Code.gs`.

Commit: `feat: add saveQuotation/loadQuotation to GAS server template`

---

## Step 2 — Implement GasSheetAdapter (client-side)

File: `packages/database/src/persistence/GasSheetAdapter.js`

```js
export class GasSheetAdapter extends PersistencePort {
  save(payload) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(result => resolve(result))
        .withFailureHandler(err => resolve({ ok: false, error: err.message }))
        .saveQuotation(payload);
    });
  }

  load(id) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(result => resolve(result))
        .withFailureHandler(err => resolve({ ok: false, error: err.message }))
        .loadQuotation(id);
    });
  }
}
```

Write tests using a mock `google.script.run` fixture.

Commit: `feat: add GasSheetAdapter client-side persistence`

---

## Step 3 — Extend Local GAS Shim

File: `apps/gas/Local_GAS_Shim.html`

Add `saveQuotation` and `loadQuotation` to the shim proxy that currently only has `healthcheck`:

```js
saveQuotation(payload) {
  setTimeout(() => {
    // Use LocalPersistenceAdapter internally
    const result = localAdapter.save(payload);
    if (successHandler) successHandler(result);
  }, 50); // Simulate async
}

loadQuotation(id) {
  setTimeout(() => {
    const result = localAdapter.load(id);
    if (successHandler) successHandler(result);
  }, 50);
}
```

The shim must initialize its own `LocalPersistenceAdapter` with a transactional database.

Commit: `feat: extend Local_GAS_Shim with save/load persistence`

---

## Step 4 — Wire adapter selection

File: `bundling/createQuotationRuntime.js`

Add environment detection:

```js
function selectPersistenceAdapter() {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isLocal || !window.google?.script?.run) {
    return new LocalPersistenceAdapter({ models: createTransactionalDb().models });
  }
  return new GasSheetAdapter();
}
```

Pass selected adapter to `createQuotationInternalRuntime({ ..., persistence: selectPersistenceAdapter() })`.

Rebuild: `npm run build`

Commit: `feat: add environment-based persistence adapter selection`

---

## Step 5 — Smoke test on real GAS

```bash
npm run build
clasp push
```

Deploy as web app. Open in browser. Walk through full flow:
1. Select client → add items → validate → Confirm & Save.
2. Open Google Sheet → verify rows in `COTIZACIONES` and `LINEA_DETALLE`.

Commit: `test: verify GAS persistence smoke test`

---

## What NOT to do

- Do not modify the `PersistencePort` interface
- Do not modify the quotation runtime beyond accepting the persistence option
- Do not hard-code `SpreadsheetApp.openById()` — use `getActiveSpreadsheet()` for deployed web app
- Do not skip the Local_GAS_Shim update — local preview must keep working
