---
id: pill-naming-conventions
type: guardrail
scope: global
language: en
nature: context
status: active
depends_on: []
---

## What
Standardized naming rules for all code artifacts.

## Why
Consistency makes the codebase predictable and searchable for automated agents.

## Rules
1. **Classes:** `PascalCase` (e.g., `QuotationView`).
2. **Methods/Variables:** `camelCase` (e.g., `shipItemToSelectedDay`).
3. **Events:** `SCREAMING_SNAKE_CASE` (e.g., `ITEM_ADDED`).
4. **Files:** 
   - Components: `PascalCase` (e.g., `Sidebar.html`, `Sidebar.js`).
   - Helpers/Domain: `camelCase` (e.g., `quantity.js`).
   - Tasks/Pills: `kebab-case` (e.g., `pill-naming-conventions.md`).
5. **Private Members:** Prefix with `#` (standard JS private) or `_` if `#` is not supported by the runtime.
