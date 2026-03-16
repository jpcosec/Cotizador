# U-4 PDF Export - Objectives

## Goal

Deliver production-ready PDF export from saved quotations, reusing the proven legacy save-first pattern and server-side PDF generation flow.

---

## Legacy Decisions To Reuse

- Save first, then generate PDF from quotation ID.
- PDF generated on GAS server, not in browser.
- `generarPDF(idCotizacion)` exposed via router and called by `google.script.run`.

References:

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Stores_App.html`

---

## What this step produces

| Artifact | Location |
|---|---|
| GAS PDF server function(s) | `tools/generate_gas_code.mjs` -> `gas/Code.gs` |
| PDF generation strategy doc (legacy parity + rebuild choice) | `plan/U-4-pdf/phases/01_pdf_template.md` |
| Runtime command wiring (`exportPdf`) | `apps/quotation/state/createQuotationInternalRuntime.js` |
| UI flow wiring (save then PDF) | `apps/quotation/playground/QuotationFlowInternal.html` |
| Local shim parity/mocks | `apps/gas/Local_GAS_Shim.html` |

---

## Completion Criteria

- [ ] PDF flow is save-first and works from quotation ID.
- [ ] Server-side PDF generation path is selected and documented (legacy parity first).
- [ ] Runtime/UI invoke export through adapter-safe integration.
- [ ] Local preview has deterministic PDF mock behavior.
- [ ] Real GAS deployment opens valid PDF link and updates quotation state if required.

---

## Constraints

- Do not move PDF generation to client-side.
- Do not bypass save-first dependency.
- Keep contract compatible with `google.script.run`.
- Preserve separation of concerns between UI/runtime and GAS server implementation.
