---
id: A-01-2
name: "[Logic] Extract Item State & Projections"
domain: item
status: completed
priority: p1
depends_on: [A-01-1]
pills:
  - pill-srp-file-80-lines
  - pill-mandatory-docstrings
  - pill-atom-testing-parity
---

## Goal
Extract state management and render projections from the 667-line `Item.js`.

## Context
- Monster: `src/components/item/Item.js`
- Targets: `ItemState.js`, `ItemProjections.js`

## Requirements
1. Move all mutation methods (`setOverride`, `clearOverride`, etc.) to `ItemState.js`.
2. Move all projection getters (`catalogCard`, `basketLine`, `toDisplayObject`) to `ItemProjections.js`.
3. Ensure both are under 80 lines.
4. Add comprehensive JSDoc to every method.

## Validation
- `ItemState.test.js` and `ItemProjections.test.js` pass.
- New files follow the 80-line rule.
