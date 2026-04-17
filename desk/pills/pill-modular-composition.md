---
id: pill-modular-composition
type: guardrail
scope: global
language: en
nature: context
status: active
depends_on: []
---

## What
Enforce the "Package Composition" architecture. Applications in `apps/` must be thin orchestrators that compose "dumb" components from `packages/`.

## Why
Large, monolithic files (monsters) are unmanageable, hard to test, and prone to regressions. Modularization ensures that each unit has a single responsibility and is testable in isolation.

## Constraints
1. **File Size:** No UI file in `apps/` should exceed 100 lines.
2. **Composition:** Use `<?!= include('ComponentName'); ?>` (GAS) or template injection (local) to assemble the UI.
3. **Logic Location:** All component-specific logic (XState, Alpine controllers) must reside in the `packages/components/<name>/` directory.
4. **Styles:** Shared styles must be in `packages/components/common/styles/`. Component-specific styles must be isolated.
