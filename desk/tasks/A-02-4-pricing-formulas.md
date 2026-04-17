---
id: A-02-4
name: "[Logic] Extract Pricing Formulas"
domain: pricing
status: open
priority: p1
depends_on: [A-02-3]
pills:
  - pill-srp-file-80-lines
  - pill-srp-function-10-lines
  - pill-mandatory-docstrings
---

## Goal
Extract core pricing calculation formulas.

## Context
- Monster: `packages/pricing/src/ItemLogic.js`
- Target: `Formulas.js`

## Requirements
1. Move `calculateBasePrice`, `calculateDisaggregatedPrice`, `calculateTotal`.
2. Ensure every function is under 10 lines.
3. Add mathematical JSDoc documentation to every formula.

## Validation
- `Formulas.test.js` passes.
- File is under 80 lines.
