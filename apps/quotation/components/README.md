# Quotation Components (Compatibility Layer)

This folder keeps the original app-level controller API used by legacy tests.

- `HomePage.js` and `ClientSelector.js` are compatibility wrappers that delegate to
  `packages/components/quotation/*`.
- Runtime integration now happens through the package route wiring in
  `apps/sandbox/routes/step-04-quotation/index.html`.

The HTML files here are retained for reference while migration completes.
