# U-4 PDF Export — Agent Guideline

## Context

You are implementing the final step of the urgent track: PDF generation from saved quotations. U-3 must be complete — you need a working `saveQuotation` server function and a valid `ID_Cotizacion` in Sheets.

Your job is to:

1. Add a GAS server function that loads quotation data and generates a PDF.
2. Build an HTML template for the PDF content.
3. Wire the export command into the runtime and UI.
4. Extend the local shim for development.

Reference: `claps_codelab/Stores_App.html:278-307` for the legacy save-then-PDF flow.

Run `npm test` after every step.

---

## Step 1 — Build PDF template

File: `apps/gas/PdfTemplate.html`

Create an HTML template with inline CSS that renders:

1. **Header**: company logo placeholder, quotation ID, date.
2. **Client section**: name, RUT, email, phone.
3. **Settings section**: event date, duration (days), global pax.
4. **Items table**: columns for Day, Item, Pax, Units, Hour, Total.
5. **Totals section**: Subtotal, IVA (19%), Total.

The template receives a data object and uses simple string interpolation (GAS `HtmlService` template syntax or pre-rendered HTML).

Keep it minimal and professional. Print-friendly layout.

Commit: `feat: add PDF template for quotation export`

---

## Step 2 — Add generateQuotationPdf server function

File: `tools/generate_gas_code.mjs`

Add template for:

```js
function generateQuotationPdf(idCotizacion) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // 1. Load cotizacion row from COTIZACIONES sheet
  // 2. Load matching lineas from LINEA_DETALLE sheet
  // 3. Load client from CLIENTES sheet
  // 4. Render PdfTemplate.html with data
  // 5. Create PDF blob via HtmlService
  // 6. Save to Drive, set sharing
  // 7. Return { ok: true, url: file.getUrl() }
}
```

Run `npm run build:gas` to regenerate `gas/Code.gs`.

Commit: `feat: add generateQuotationPdf GAS server function`

---

## Step 3 — Wire exportPdf into runtime

File: `apps/quotation/state/createQuotationInternalRuntime.js`

Add to runtime API:

```js
async exportPdf() {
  if (!quotationId) return { ok: false, error: 'No quotation saved' };
  return new Promise((resolve) => {
    google.script.run
      .withSuccessHandler(result => {
        if (result.ok && result.url) window.open(result.url, '_blank');
        resolve(result);
      })
      .withFailureHandler(err => resolve({ ok: false, error: err.message }))
      .generateQuotationPdf(quotationId);
  });
}
```

Commit: `feat: wire exportPdf command into quotation runtime`

---

## Step 4 — Wire UI buttons

File: `apps/quotation/playground/QuotationFlowInternal.html`

### Completed stage
Add PDF button alongside the existing quotation ID display:

```html
<button class="btn btn-small btn-primary" @click="exportPdf()" :disabled="exportingPdf">
  <span x-show="!exportingPdf">Download PDF</span>
  <span x-show="exportingPdf">Generating...</span>
</button>
```

### Validation stage (optional save-then-PDF)
Add combined action:

```html
<button class="btn btn-small btn-secondary" @click="saveAndExportPdf()">
  Save & PDF
</button>
```

Where `saveAndExportPdf()` calls `confirmSave()` then `exportPdf()` sequentially.

Update `bundling/createQuotationFlowComponent.js` with same commands.

Commit: `feat: add PDF export buttons to quotation UI`

---

## Step 5 — Extend Local GAS Shim

File: `apps/gas/Local_GAS_Shim.html`

Add `generateQuotationPdf` method:

```js
generateQuotationPdf(id) {
  setTimeout(() => {
    console.log('[PDF MOCK] generateQuotationPdf called with:', id);
    if (successHandler) {
      successHandler({ ok: true, url: 'about:blank#pdf-mock-' + id });
    }
  }, 200);
}
```

Commit: `feat: extend Local_GAS_Shim with PDF mock`

---

## Step 6 — Build, verify, smoke test

```bash
npm run build
npm run dev:gas
# Local: confirm → PDF button → mock URL
```

```bash
clasp push
# GAS: confirm → PDF button → real PDF URL from Drive
```

Commit: `test: verify PDF export end-to-end`

---

## What NOT to do

- Do not generate PDFs client-side — this is a GAS server operation
- Do not use external PDF libraries — use GAS `HtmlService` + `DriveApp`
- Do not modify the persistence layer — PDF reads from already-saved data
- Do not skip the local shim — development must work without GAS
