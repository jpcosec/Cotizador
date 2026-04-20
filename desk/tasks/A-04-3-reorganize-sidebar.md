---
id: A-04-3
name: "[Geography] Reorganize Sidebar View"
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
- Target: `src/components/quotation/views/sidebar/`

## Requirements
1. Move all sidebar-related files (`Sidebar.js`, `SidebarCatalog.js`, `Sidebar.test.js`, `SidebarCatalog.test.js`) to the new folder.
2. Update all imports within those files.

## Validation
- Folder `views/sidebar/` exists with moved files.
