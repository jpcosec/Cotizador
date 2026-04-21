---
id: RD-04
name: Boundary Wiring and Rebuild
domain: runtime
status: open
priority: p1
depends_on:
  - RD-02
  - RD-03
pills:
  - pill-projection-first-ui
commit_messages:
  - feat(runtime): unify quotation boundaries and rebuild artifacts
---

# RD-04: Boundary Wiring and Rebuild

## Goal
Finish the migration by routing persistence/export/store/pricing/rules through explicit runtime boundaries, then rebuild GAS artifacts.

## Outputs
| Artifact | Location |
|----------|----------|
| Boundary wiring | `src/state/`, `gas/scripts/`, `src/database/` |
| Rebuilt bundle/dist/GAS outputs | `dist/`, `gas/` |

## Done When
- Runtime boundaries are the integration seam for quotation flow side effects.
- GAS/local preview artifacts are regenerated from current source.
- No stale generated files remain.

## Testing
```bash
npm test
npm run build
```
