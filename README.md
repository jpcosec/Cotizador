# SF Lodge Cotizador — Pricing Engine

> **Worktree** of the main SF Lodge Cotizador repo, focused exclusively on **core business logic and pricing management**. Frontend, data-layer integrations (SheetDB), and legacy code live in the parent repository.

## Project Status

**v0.1.0** — Pricing engine core complete (73 tests passing).

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
/
├── src/
│   ├── Config/Config_Schema.js        # v3.2 schema (single source of truth)
│   ├── DataStore/InMemoryStore.js      # In-memory table store
│   └── Pipeline/
│       ├── 01_context.js              # Quotation context creation
│       ├── 02_expand.js               # Composition/pack expansion
│       ├── 03_defaults.js             # Q/T/P defaults resolution
│       ├── 04_pricing.js              # Base price calculation
│       ├── 05_adjustments.js          # Automatic adjustments
│       ├── 06_manual_adjustments.js   # Manual user overrides
│       ├── 07_taxes.js                # Tax calculation
│       ├── rules_engine.js            # Shared condition evaluator
│       ├── pipeline.js                # Full recalculation orchestrator
│       └── add_item.js               # Add-to-cart entry point
├── tests/                             # 73 tests (unit + integration)
├── scripts/                           # demo.js, interactive.js
├── docs/                              # Business logic docs
│   ├── pricing-engine.md              # How the engine works (start here)
│   └── plan/                          # Step-by-step implementation plan
└── changelog.md
```

## Documentation

See [`docs/README.md`](docs/README.md) for the full documentation index.
