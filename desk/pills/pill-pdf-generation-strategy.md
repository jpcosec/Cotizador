---
id: pill-pdf-generation-strategy
type: decision
scope: domain
language: es
nature: context
status: active
depends_on: []
---

## What
Strategy for generating PDF quotations from the browser-based application.

## Why
Users need a formal, non-editable document to share with clients. The strategy must be reliable across different browsers and support the complex layout of the quotation.

## Where
- `apps/quotation/components/QuotationExporter.js` (to be created)
- `apps/quotation/services/pdfService.js` (to be created)

## How
1. **Tooling:** Prefer `window.print()` with a specialized `@media print` CSS stylesheet for maximum reliability and zero dependencies.
2. **Alternative:** If complex headers/footers are needed that CSS can't handle, consider `jspdf` + `html2canvas` (already verified in other claps projects).
3. **Template:** Reuse the "Validation" view as the base for the PDF layout, but optimized for A4/Letter.
4. **Data:** Must include: Client Info, Global Settings (Pax, Days), Itemized breakdown by Day, and Totals (Subtotal, IVA, Total).
