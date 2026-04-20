---
id: A-01-1
name: "[UI] Extract Item Templates"
domain: item
status: completed
priority: p1
depends_on: [A-00]
pills:
  - pill-srp-file-80-lines
  - pill-folder-structure-srp
---

## Goal
Extract legacy HTML templates from `playgroundItemSections.js` into dedicated `.html` files.

## Context
- Source: `src/components/item/ui/playgroundItemSections.js`
- Target Folder: `src/components/item/ui/`

## Requirements
1. Extract `catalogRuntimeHtml` to `ItemCatalog.html`.
2. Extract `basketRuntimeHtml` to `ItemBasket.html`.
3. Use Alpine.js syntax as-is.
4. Ensure no template exceeds 80 lines (or split into sub-partials if needed).

## Validation
- Files exist in `ui/` folder.
- `playgroundItemSections.js` uses imports or markers to reference the new files (or is ready for deletion).
