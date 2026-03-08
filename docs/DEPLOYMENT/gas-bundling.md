# GAS Bundling Pipeline

This repository now has a full Google Apps Script bundling pipeline.

## Commands

```bash
# 1) Bundle runtime + generate GAS workspace
npm run build

# 2) Preview the real GAS includes locally
npm run serve:gas

# or build + preview in one command
npm run dev:gas
```

Preview URL: `http://localhost:8082`

## Build Outputs

- `dist/quotation-engine.iife.js` - Rollup IIFE runtime bundle
- `bundling/generated/localInitTables.js` - generated CSV seed module
- `gas/Bundle_Runtime.html` - `<script>` wrapper for GAS include
- `gas/Code.gs` - GAS server entrypoints (`doGet`, `include`, `healthcheck`)
- `gas/*.html` - GAS templates copied/generated from source-of-truth

## Source Of Truth

- GAS static templates: `apps/gas/*.html`
- GAS manifest: `apps/gas/appsscript.json`
- Quotation shell template: `apps/quotation/playground/QuotationFlowInternal.html`
- Runtime sections injected into quotation shell:
  - `packages/components/item/ui/playgroundItemSections.js`

Do not edit `gas/` manually. `npm run build:gas` recreates it.

## Deploy With Clasp

```bash
# one-time setup
clasp login
clasp create --type webapp --title "CotizadorLodge Rebuild"

# then for each deploy
npm run build
clasp push
```

In Apps Script editor, deploy as a Web App after pushing.
