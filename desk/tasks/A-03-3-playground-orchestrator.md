---
id: A-03-3
name: "[Logic] Refactor Playground Orchestrator"
domain: item
status: open
priority: p2
depends_on: [A-03-2]
pills:
  - pill-srp-file-80-lines
  - pill-mandatory-docstrings
---

## Goal
Clean the 861-line orchestrator into a thin mounting entry point.

## Context
- Monster: `apps/sandbox/playground/item/mountItemPlayground.js`

## Requirements
1. Use `ItemPlaygroundController` via composition.
2. The resulting `mountItemPlayground.js` must only manage top-level sandbox mounting and dependency injection.
3. Provide comprehensive docstrings for the orchestrated flow.

## Validation
- The file is reduced to < 80 lines.
- Sandbox URL for the Item Component continues to work without errors.
