---
id: A-04-1
name: "[Geography] Reorganize Timeline View"
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
- Target: `src/components/quotation/views/timeline/`

## Requirements
1. Move all timeline-related files (`Timeline.js`, `TimelineEntry.js`, `Timeline.test.js`, `TimelineEntry.test.js`) to the new folder.
2. Update all imports within those files.

## Validation
- Folder `views/timeline/` exists with moved files.
- Application still imports `Timeline` via `views/index.js` correctly.
