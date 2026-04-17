---
id: A-02-2
name: "[Logic] Extract Pricing Detection"
domain: pricing
status: open
priority: p1
depends_on: [A-02-1]
pills:
  - pill-srp-file-80-lines
  - pill-srp-function-10-lines
  - pill-mandatory-docstrings
---

## Goal
Extract logic that detects pricing kinds and initialization modes.

## Context
- Monster: `packages/pricing/src/ItemLogic.js`
- Target: `PricingDetection.js`

## Requirements
1. Move `detectPricingKind`, `detectInitializationMode`, `rateForKind`, `overrideFieldForKind`, and `fixedAmountForKind`.
2. Ensure every function is under 10 lines.
3. Add comprehensive JSDoc explaining the detection criteria.

## Validation
- `PricingDetection.test.js` passes.
- File is under 80 lines.
