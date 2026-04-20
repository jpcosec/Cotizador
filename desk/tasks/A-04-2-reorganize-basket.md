---
id: A-04-2
name: "[Geography] Reorganize Basket View"
domain: quotation
status: open
priority: p2
depends_on: []
pills:
  - pill-folder-structure-srp
---

## Goal
Subdivide `src/components/quotation/views/` into dedicated folders.

## Context
- Folder: `src/components/quotation/views/`
- Target: `src/components/quotation/views/basket/`

## Requirements
1. Move all basket-related files (`Basket.js`, `BasketDay.js`, `Basket.test.js`, `BasketDay.test.js`) to the new folder.
2. Update all imports within those files.

## Validation
- Folder `views/basket/` exists with moved files.
