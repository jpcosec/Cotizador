# U-4 PDF Export — Objectives

## Goal

Generate a PDF from a saved quotation. The flow is: save quotation (U-3) → generate PDF from `ID_Cotizacion` → open/download PDF URL. This mirrors the legacy `generarPDF()` behavior.

---

## What this step produces

| Artifact | Location |
|---|---|
| `generateQuotationPdf(id)` GAS server function | `tools/generate_gas_code.mjs` template |
| PDF template (HTML-based) | `apps/gas/PdfTemplate.html` |
| `exportPdf()` runtime command | `apps/quotation/state/createQuotationInternalRuntime.js` |
| UI wiring (PDF button in completed/validation stage) | `apps/quotation/playground/QuotationFlowInternal.html` |
| Local shim mock for PDF | `apps/gas/Local_GAS_Shim.html` |

---

## Completion Criteria

### GAS PDF generation
- [ ] `generateQuotationPdf(id)` loads quotation data from Sheets
- [ ] Renders data into `PdfTemplate.html`
- [ ] Converts HTML to PDF via `HtmlService` + `DriveApp`
- [ ] Returns PDF URL (Google Drive sharing link)
- [ ] Error handling: returns `{ ok: false, error }` if quotation not found

### PDF template
- [ ] Client info header (name, RUT, date)
- [ ] Quotation settings (pax, days, event date)
- [ ] Line items table: day, item, pax, units, hour, total
- [ ] Totals section: subtotal, IVA, total
- [ ] Styled with inline CSS (GAS HtmlService requirement)

### Runtime command
- [ ] `exportPdf()` calls `google.script.run.generateQuotationPdf(quotationId)`
- [ ] Returns PDF URL on success
- [ ] Opens URL in new tab automatically

### UI
- [ ] PDF button visible in completed stage
- [ ] PDF button visible in validation stage (triggers save-then-PDF flow)
- [ ] Loading indicator while PDF is being generated
- [ ] Error toast if PDF generation fails

### Local shim
- [ ] `generateQuotationPdf()` returns a mock URL (e.g., `about:blank#pdf-mock`)
- [ ] Logs mock data to console for development inspection

---

## Testing Criteria

**Automated:**
```bash
npm test
# PDF template rendering tests (if any)
```

**Manual (local GAS preview):**
```bash
npm run dev:gas
# Confirm → PDF button → mock URL opens
```

**Manual (real GAS):**
```bash
npm run build && clasp push
# Confirm → PDF button → real PDF opens in Drive
```

---

## Key Constraints

- PDF generation happens server-side in GAS — not client-side
- Template must use inline CSS (GAS `HtmlService` does not support external stylesheets)
- PDF must be readable without styling framework dependencies
- Save must happen before PDF (quotation ID required)
- Follow legacy pattern from `claps_codelab/Codigo.js:64-65`

---

## What already exists

| Artifact | Status | Location |
|---|---|---|
| Legacy `generarPDF()` server function | ✅ Reference | `claps_codelab/Codigo.js:64-65` |
| Legacy save-then-PDF client flow | ✅ Reference | `claps_codelab/Stores_App.html:278-307` |
| `CompletionSuccess` emits `OPEN_PDF` | ✅ Complete | `packages/components/quotation/views/CompletionSuccess.js:15` |
| `QuotationHeader` emits `PDF_CLICKED` | ✅ Complete | `packages/components/quotation/views/QuotationHeader.js:33` |
| `confirmSave()` command | U-1 output | `apps/quotation/state/createQuotationInternalRuntime.js` |
| `GasSheetAdapter` for persistence | U-3 output | `packages/database/src/persistence/GasSheetAdapter.js` |
