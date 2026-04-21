---
id: RD-02
name: Quotation Shell Projection Migration
domain: quotation
status: open
priority: p0
depends_on:
  - RD-01
pills:
  - pill-runtime-unit-hierarchy
  - pill-projection-first-ui
commit_messages:
  - feat(quotation): migrate shell to runtime projection
---

# RD-02: Quotation Shell Projection Migration

## Goal
Make the real quotation shell consume `QuotationFlowRuntimeView` and `runtimeProjection` as primary UI state.

## Outputs
| Artifact | Location |
|----------|----------|
| View adapter | `gas/scripts/QuotationFlowRuntimeView.js` |
| Shell sync | `gas/scripts/createQuotationFlowComponent.js` |
| Shell tests | `gas/scripts/QuotationFlowRuntimeView.test.js` |

## Done When
- Shell stage, client, settings, and persistence status derive from `runtimeProjection`.
- Duplicated shell state is reduced to compatibility glue only.
- Tests cover runtime snapshot updates plus later stage transitions.

## Testing
```bash
npm test
```
