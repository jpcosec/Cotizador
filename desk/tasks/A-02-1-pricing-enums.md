---
id: A-02-1
name: "[Logic] Extract Pricing Enums & Helpers"
domain: pricing
status: open
priority: p1
depends_on: [A-00]
pills:
  - pill-srp-file-80-lines
  - pill-naming-conventions
---

## Goal
Extract enums and helpers from the 825-line `ItemLogic.js`.

## Context
- Monster: `src/pricing/src/ItemLogic.js`
- Targets: `Enums.js`, `Helpers.js`

## Requirements
1. Move `PricingKind` and `InitializationMode` enums to `Enums.js`.
2. Move `toNumber`, `toInteger`, `money`, etc. to `Helpers.js`.
3. Export them from an `index.js` if needed for backward compatibility.

## Validation
- `Enums.js` and `Helpers.js` exist.
- New files are under 80 lines.
