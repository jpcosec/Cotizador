# CLAUDE.md

Guidance for Claude Code when working with this repository.

## What Is This?

**SF Lodge Cotizador v2** — a quotation system for events/catering, deployed as a Google Apps Script add-on.

**Monorepo** with four packages under `packages/`:

| Package | Role | Tests |
|---------|------|-------|
| `packages/database` | IStore interface + adapters + ModelFactory | 5 passing |
| `packages/pricing` | Pure calculation pipeline (6 stages) + RulesEngine | 180 passing |
| `packages/xstate` | XState orchestrator (owns all DB access) | 79 passing |
| `packages/frontend` | Alpine.js UI + AlpineXStateBridge | 3 integration |

**Total:** 267+ tests passing. Build: 46.7 KB gzipped IIFE for GAS.

---

## Architecture: 30-Second Version

```
┌─────────────────────────────┐
│  packages/frontend           │  Alpine.js UI
│  AlpineXStateBridge          │  syncs snapshot → Alpine store
└──────────────┬───────────────┘
               │ events (ADD_ITEM, UPDATE_QUOTATION_SETTINGS…)
               ▼
┌─────────────────────────────┐
│  packages/xstate             │  XState orchestrator
│  Owns all database access    │  caches reference data at init
└──────────────┬───────────────┘
               │ (catalog, rules, profiles as params)
               ▼
┌─────────────────────────────┐
│  packages/pricing            │  Pure functions — zero I/O
│  6-stage calculation pipeline│  deterministic, fully testable
└─────────────────────────────┘
               ↑
┌─────────────────────────────┐
│  packages/database           │  IStore interface
│  GasSheetStore / InMemory    │  swapped via DI
└─────────────────────────────┘
```

---

## Directory Structure

```
claps_codelab/
├── README.md                     # Product overview + quick start
├── CLAUDE.md                     # This file
├── changelog.md                  # Version history
│
├── packages/
│   ├── database/                 # IStore, adapters, ModelFactory
│   ├── pricing/                  # Pricing pipeline + RulesEngine
│   ├── xstate/                   # QuotationMachine + services
│   └── frontend/                 # Alpine.js UI (source of truth for GAS templates)
│       └── *.html                # Edited here — copied to gas/ on build
│
├── src/Config/Config_Schema.js   # 11-table schema (single source of truth)
├── bundling/entry.js             # Rollup IIFE entry point
├── tools/
│   ├── serve-gas.mjs             # Local GAS preview server (npm run serve:gas)
│   ├── generate_gas_runtime_bundle.mjs
│   ├── generate_gas_code.mjs
│   └── reset_gas_workspace.mjs
│
├── gas/                          # GENERATED — do not edit manually
│   ├── Index.html                # Regenerated from packages/frontend/Index.html
│   ├── Bundle_Runtime.html       # IIFE bundle inlined
│   └── Code.gs                   # GAS backend from packages/database/src/services/
│
├── dist/
│   └── quotation-engine.iife.js  # Rollup output (~197KB, 46.7KB gzipped)
│
├── docs/                         # Stable technical documentation
│   ├── README.md
│   ├── ARCHITECTURE/             # database-logic, rules-engine, state-machine, ui-sync
│   ├── PACKAGES/                 # Per-package reference
│   ├── BUSINESS/                 # quotation-workflow
│   └── DEPLOYMENT/               # local-development.md, gas-deployment.md, LOCAL_vs_GAS.md
│
└── plan/                         # Planning, roadmap, phase tracking
    ├── README.md
    ├── PLAN.md                   # Current priorities
    ├── FUTURE.md                 # Post-v2 ideas
    └── PHASE3/                   # Phase 3 task files
```

---

## Key Commands

```bash
# Local development (build + serve real GAS app)
npm run dev           # build:bundle + build:gas + serve:gas → http://localhost:8082
npm run serve:gas     # serve already-built gas/ (no rebuild)

# Build
npm run build         # full build: IIFE bundle + GAS workspace
npm run build:bundle  # Rollup IIFE only
npm run build:gas     # reset gas/ + copy templates + generate runtime + Code.gs

# Tests
npm run test:integration   # root integration tests (3)
cd packages/pricing && npx vitest run    # 181 tests
cd packages/xstate  && npx vitest run    # 79 tests
cd packages/database && npm test         # 5 tests

# GAS deploy
npm run build && clasp push
# Then in GAS editor run: initializeSheetDb()
```

---

## Architecture Decisions

### 1. Pure Pricing Engine
- Pricing functions receive **all data as parameters** — no I/O, fully deterministic.
- Returns `{ lineas, totals, appliedRules }`.

### 2. Orchestrator-Driven Data Flow
- XState loads reference data once at init (`INIT` event), caches in `context.dataCache`.
- Passes cached data as params to pricing — single DB access point, 59% fewer calls vs v1.

### 3. Pluggable Stores (Dependency Injection)
```javascript
const store = new InMemoryStore();    // testing (seeded, no GAS quota)
const store = new GasSheetStore();    // production
```

### 4. Only Two Runtime Dependencies
- **xstate@5.x** + **alpinejs@3.12.0** + **json-logic-js** (rules engine)
- Everything else is vanilla JS ES2020+.

### 5. Schema-Driven Model Generation
- `src/Config/Config_Schema.js` defines 11 tables.
- `ModelFactory` auto-generates all models from schema — never out of sync.

### 6. GAS Preview via Template Processing
- `tools/serve-gas.mjs` resolves `<?!= include('Name'); ?>` directives locally.
- The locally served app is the **exact GAS app** — `Local_GAS_Shim.html` stubs `google.script.run`.
- Edit `packages/frontend/*.html` (source), never `gas/*.html` (generated).

---

## Patterns & Constraints

### DO
- Load data in XState actions (at `INIT` or state entry).
- Pass data as parameters to pricing functions.
- Use InMemoryStore for testing.
- Define schema changes in `Config_Schema.js` first.
- Edit frontend templates in `packages/frontend/`, not `gas/`.

### DON'T
- Call database from pricing functions (violates purity).
- Use external dependencies outside xstate/alpinejs/json-logic-js.
- Edit `gas/` files manually — they are regenerated on every `npm run build:gas`.
- Use `npm run dev:local` — replaced by `npm run dev`.

---

## Documentation Map

| Question | Where to look |
|----------|---------------|
| Architecture overview | `docs/ARCHITECTURE/` |
| Per-package reference | `docs/PACKAGES/` |
| Local dev + GAS deploy | `docs/DEPLOYMENT/local-development.md` |
| Current priorities | `plan/PLAN.md` |
| Future ideas | `plan/FUTURE.md` |
| Schema | `src/Config/Config_Schema.js` |
| Quotation workflow | `docs/BUSINESS/quotation-workflow.md` |
| Version history | `changelog.md` |

---

## Phase Status

| Phase | Task | Status |
|-------|------|--------|
| 1 | Database abstraction (IStore, adapters, ModelFactory) | ✅ Complete |
| 2 | Pricing engine + XState orchestration | ✅ Complete |
| 3 | Frontend bridge + Alpine components + local preview | ✅ Complete |
| 4 | GAS deployment (clasp push + initializeSheetDb) | ⏳ Next |

---

**Last Updated:** 2026-02-20
**Branch:** v2
**Status:** Production-ready, local preview working, GAS deploy ready
