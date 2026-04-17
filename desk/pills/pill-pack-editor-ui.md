---
id: pill-pack-editor-ui
type: model
scope: domain
language: en
nature: context
status: active
depends_on: [pill-kits-logic]
---

## What
UI Model and constraints for the Pack Editor view.

## Why
Kits/Packs have complex hierarchical relationships that must be editable in a stylized, high-performance view.

## Where
- `apps/sandbox/routes/pack-editor.html`
- `packages/database/src/kitManagementService.js`

## How (Constraints)
1. **Visualization:** Parent items must be visually distinct from their children.
2. **Editing:** Changing a parent's property (e.g. quantity) must offer to propagate to children if relevant (based on `pill-kits-logic`).
3. **Database Binding:** Use `kitManagementService` for all C.R.U.D operations to ensure referential integrity.
