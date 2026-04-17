---
id: A-02-3
name: "[Logic] Extract Quantity Resolution"
domain: pricing
status: open
priority: p1
depends_on: [A-02-2]
pills:
  - pill-srp-file-80-lines
  - pill-srp-function-10-lines
  - pill-mandatory-docstrings
---

## Goal
Extract logic that resolves initial and basket quantities.

## Context
- Monster: `packages/pricing/src/ItemLogic.js`
- Target: `QuantityResolution.js`

## Requirements
1. Move `resolveContextQuantity`, `resolveBasketQuantity`, and `applyExclusiveDefaultMode`.
2. Ensure every function is under 10 lines.
3. Add JSDoc to every function.

## Validation
- `QuantityResolution.test.js` passes.
- File is under 80 lines.
