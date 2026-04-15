---
id: U-4
name: PDF Export
domain: quotation
status: pending
priority: p1
depends_on:
  - U-3
pills:
  - pill-pdf-generation-strategy
  - pill-legacy-pdf-flow
commit_messages:
  - feat: add GAS PDF server function
  - feat: wire PDF export through runtime
  - test: add PDF export E2E coverage
---

# U-4: PDF Export

## Goal

Deliver production-ready PDF export from saved quotations using save-first pattern.

## Legacy Decisions

1. Save first, then generate PDF from quotation ID
2. PDF generated on GAS server, not browser
3. `generarPDF(idCotizacion)` exposed via router

## What This Produces

| Artifact | Location |
|----------|----------|
| GAS PDF server | `gas/Code.gs` |
| PDF strategy doc | `docs/.../pdf-generation.md` |
| Runtime wiring | `apps/quotation/state/createQuotationInternalRuntime.js` |
| UI wiring | `apps/quotation/playground/QuotationFlowInternal.html` |

---

## Phase 01: PDF Template

**Commit:** `feat: add GAS PDF server function`

### Objectives

- [ ] Select PDF generation strategy (legacy parity first)
- [ ] Document strategy choice
- [ ] Implement server-side generation

### Status: ⏳ Pending

---

## Phase 02: GAS Server PDF

**Commit:** `feat: wire PDF export through runtime`

### Objectives

- [ ] `generarPDF` server function
- [ ] Runtime `exportPdf` command
- [ ] Contract compatible with `google.script.run`

### Status: ⏳ Pending

---

## Phase 03: UI Wiring

**Commit:** `test: add PDF export E2E coverage`

### Objectives

- [ ] Save-first UI flow
- [ ] Local preview with deterministic PDF mock
- [ ] Real GAS opens valid PDF link
- [ ] E2E tests for PDF export flow

### Status: ⏳ Pending

---

## Completion Criteria

- [ ] PDF flow is save-first
- [ ] Server-side PDF generation path selected and documented
- [ ] Runtime/UI invoke export through adapter-safe integration
- [ ] Local preview has deterministic PDF mock behavior
- [ ] Real GAS deployment opens valid PDF link
