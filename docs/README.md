# Docs

> Pricing engine library documentation for `claps_codelab_pricing`.

## Source of Truth

All table and model definitions live in `src/Config/Config_Schema.js`. The code is the spec.

## Reference

- **`pricing-engine.md`** — How the engine works (user-facing, start here).
- `quotation-pipeline-flow-v3.md` — Calculation stages and output contract.
- `plan/` — Step-by-step implementation plan (step_01 through step_14).

## Architecture

The pricing engine exposes **pure calculation modules** and a **pluggable rules engine**. State management (event lifecycle, scenarios, step gating) lives in `claps_codelab_xstate`.

```
src/
├── Config/Config_Schema.js              # Data model definitions
├── DataStore/InMemoryStore.js           # In-memory table store
├── Pricing/                             # Pure business logic (library API)
│   ├── expand.js                        # Composition/pack expansion
│   ├── defaults.js                      # Q/T/P defaults resolution
│   ├── pricing.js                       # Base price calculation
│   ├── adjustments.js                   # Automatic line/global adjustments
│   ├── manual.js                        # Manual user overrides
│   └── taxes.js                         # Tax calculation
├── RulesEngine/                         # Pluggable rules engine
│   ├── RulesEngine.js                   # Stage/hook filtering + evaluation
│   └── actions/                         # Self-registering action handlers
│       ├── index.js                     # Registry (registerAction/getActionHandler)
│       ├── multiply.js, add_fixed.js, set_value.js, set_tax.js,
│       ├── set_default.js, add_item.js, warning.js, error.js,
│       └── invalidate_basket.js
└── mock/                                # Event-driven layer (reference for xstate)
    ├── Core/                            # AbstractEvent, EventBus, AbstractScenario, QuotationState
    ├── Events/quotation/                # Thin event orchestrators
    └── Scenarios/Quotation.js           # Step definitions (init→basket→finalization)
```
