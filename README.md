# SF Lodge — Pricing Engine

> Pure pricing calculation library. State management and event orchestration live in [`claps_codelab_xstate`](../claps_codelab_xstate/).

## Project Status

**v0.2.0** — Event-driven rewrite complete (117 tests passing).

## Quick Start

```bash
npm install
npm test            # run all tests
npm run test:watch  # watch mode
npm run demo        # scripted demo
npm run interactive # interactive REPL
```

## Source of Truth

All table and model definitions: [`src/Config/Config_Schema.js`](src/Config/Config_Schema.js)

## Directory Structure

```
src/
├── Config/Config_Schema.js              # v3.2 schema (single source of truth)
├── DataStore/InMemoryStore.js           # In-memory table store
├── Pricing/                             # Library API — pure calculation modules
│   ├── expand.js                        # Composition/pack expansion
│   ├── defaults.js                      # Q/T/P defaults resolution
│   ├── pricing.js                       # Base price: Neto = Base + P×Cp + T×Ct + Q×Cq
│   ├── adjustments.js                   # Automatic line/global adjustments
│   ├── manual.js                        # Manual user overrides
│   └── taxes.js                         # Tax calculation
├── RulesEngine/                         # Pluggable rules engine
│   ├── RulesEngine.js                   # Stage/hook filtering + evaluation
│   └── actions/                         # Self-registering action handlers
└── mock/                                # Event-driven layer (reference for xstate)
    ├── Core/                            # AbstractEvent, EventBus, Scenario, State
    ├── Events/quotation/                # Event orchestrators
    └── Scenarios/Quotation.js           # Step definitions
```

## Documentation

See [`docs/README.md`](docs/README.md) for the full documentation index.
