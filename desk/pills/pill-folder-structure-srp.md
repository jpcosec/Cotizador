---
id: pill-folder-structure-srp
type: guardrail
scope: global
language: en
nature: rule
status: active
---

## What
Folders must be small and serve a single, cohesive purpose.

## Why
Prevents dumping grounds (like massive `utils/` or `views/` folders) and forces domain-driven organization.

## Rules
1. Subdivide folders if they contain more than 7-10 files.
2. Group files by feature/domain first, then by technical role (if necessary).
3. Every folder should ideally have an `index.js` or `README.md` defining its bounded context.
