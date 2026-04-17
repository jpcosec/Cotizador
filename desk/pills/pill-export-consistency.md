---
id: pill-export-consistency
type: guardrail
scope: global
language: en
nature: convention
status: active
---

## What
Standardized export and naming patterns for atoms.

## Why
Consistency across thousands of atoms is the only way to keep the codebase searchable.

## Rules
1. **Named Exports:** Always prefer named exports over `default` exports.
2. **Naming:** 
   - Classes/Components: `PascalCase` (e.g., `ItemController.js`)
   - Functions/Logic: `camelCase` (e.g., `calculateBasePrice.js`)
3. **Index Files:** Use `index.js` in folders as a "Table of Contents" (Public API) for that domain.
