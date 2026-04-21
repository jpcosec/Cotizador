---
id: RD-03
name: Quotation Unit Adoption
domain: quotation
status: open
priority: p0
depends_on:
  - RD-01
  - RD-02
pills:
  - pill-runtime-unit-hierarchy
  - pill-projection-first-ui
commit_messages:
  - feat(quotation): adopt container and item runtime units
---

# RD-03: Quotation Unit Adoption

## Goal
Replace demo-only unit structure with quotation-specific `Container` and `Item` runtime units in the real app path.

## Outputs
| Artifact | Location |
|----------|----------|
| Quotation container/item units | `src/components/**/runtime/` or `src/components/common/base/runtime/` |
| Wiring into quotation runtime | `src/state/` and `gas/scripts/` |
| Integration coverage | `gas/scripts/*.test.js`, `src/**/*.test.js` |

## Done When
- Real catalog/basket/validation structures map onto explicit runtime units.
- Pricing/rules stay item-local.
- Container aggregation and context propagation are used in the real quotation flow.

## Testing
```bash
npm test
```
