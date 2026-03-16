# U-4 PDF Export - Agent Guideline

## Context

This track must mirror legacy save-first PDF behavior before any redesign.

Review first:

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Stores_App.html`

## Step 1 - Confirm generation strategy

Document and decide the urgent-track strategy:

- port legacy server-side approach first,
- list optional improvements after parity.

## Step 2 - Implement server function

Add PDF generation function(s) in generated GAS code.

Requirements:

- input: quotation ID,
- load persisted quotation data,
- return URL or structured error.

## Step 3 - Wire runtime and UI

Add export action while preserving save-first flow:

1. save quotation,
2. request PDF for returned ID,
3. open/export URL.

## Step 4 - Extend local shim

Provide deterministic PDF mock responses so local preview can validate UX paths.

## Step 5 - Validate on real GAS

Smoke test end-to-end from UI action to generated PDF link.

## What NOT to do

- Do not make PDF independent from save.
- Do not couple UI directly to GAS internals.
- Do not replace proven flow with speculative architecture in this urgent pass.
