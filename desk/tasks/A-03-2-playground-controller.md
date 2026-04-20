---
id: A-03-2
name: "[Logic] Extract Playground Controller"
domain: item
status: completed
priority: p2
depends_on: [A-03-1]
pills:
  - pill-srp-file-80-lines
  - pill-mandatory-docstrings
---

## Goal
Move inline Alpine.js controller logic to its own file.

## Context
- Monster: `playground/playground/item/mountItemPlayground.js`
- Target: `playground/playground/item/ItemPlaygroundController.js`

## Requirements
1. Extract `x-data` object definitions into a structured class/controller.
2. Use the `ItemPlaygroundController.js` to hold the state and methods.

## Validation
- `ItemPlaygroundController.test.js` passes.
- Original file is under 80 lines.
