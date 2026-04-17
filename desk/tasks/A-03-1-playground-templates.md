---
id: A-03-1
name: "[UI] Extract Playground Templates"
domain: item
status: open
priority: p2
depends_on: [A-00]
pills:
  - pill-srp-file-80-lines
  - pill-folder-structure-srp
---

## Goal
Extract legacy HTML templates from the 861-line orchestrator.

## Context
- Monster: `apps/sandbox/playground/item/mountItemPlayground.js`
- Target Folder: `apps/sandbox/playground/item/ui/`

## Requirements
1. Extract any inline template strings to dedicated `.html` files.
2. Maintain Alpine.js bindings.

## Validation
- Templates are in dedicated `.html` files.
- Original file is reduced by the template size.
