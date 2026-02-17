# Docs

> Business logic and pricing engine documentation for the `feature/pricing-logic` worktree.

## Source of Truth

All table and model definitions live in `src/Config/Config_Schema.js`. No separate schema docs — the code is the spec.

## Reference

- **`pricing-engine.md`** — How the engine works (user-facing, start here).
- `quotation-pipeline-flow-v3.md` — 10-stage calculation pipeline and output contract.
- `plan/` — Step-by-step implementation plan (step_01 through step_14).

## Architecture

```
src/
├── Config/Config_Schema.js       # Data model definitions
├── DataStore/InMemoryStore.js     # In-memory table store
└── Pipeline/
    ├── 01_context.js              # Quotation context creation
    ├── 02_expand.js               # Composition/pack expansion
    ├── 03_defaults.js             # Q/T/P defaults resolution
    ├── 04_pricing.js              # Base price calculation
    ├── 05_adjustments.js          # Automatic adjustments
    ├── 06_manual_adjustments.js   # Manual user overrides
    ├── 07_taxes.js                # Tax calculation
    ├── rules_engine.js            # Shared rule evaluator
    ├── pipeline.js                # Full recalculation orchestrator
    └── add_item.js                # Add-to-cart entry point
```
