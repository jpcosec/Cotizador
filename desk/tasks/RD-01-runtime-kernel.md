---
id: RD-01
name: Runtime Kernel Consolidation
domain: runtime
status: open
priority: p0
depends_on: []
pills:
  - pill-runtime-unit-hierarchy
commit_messages:
  - feat(runtime): complete generic runtime kernel
---

# RD-01: Runtime Kernel Consolidation

## Goal
Stabilize `GenericUnit`, `GenericView`, `GenericContainer`, `GenericItem`, and the shared signal vocabulary as the canonical runtime base.

## Outputs
| Artifact | Location |
|----------|----------|
| Runtime base classes | `src/components/common/base/runtime/` |
| Shared signal dictionary | `src/components/common/base/runtime/signals.js` |
| Runtime tests | `src/components/common/base/runtime/*.test.js` |

## Done When
- Public signal names are canonical and reused across runtime classes.
- Projection/snapshot semantics are consistent across all runtime units.
- Runtime tests cover initialization, mutation, routing, boundaries, and actor syncing.

## Testing
```bash
npm test
```
