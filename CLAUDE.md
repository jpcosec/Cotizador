# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Important: `claps_codelab_rebuild_components/` is the active implementation worktree.
> `claps_codelab/` is kept as legacy/reference only.
> If anything in this document conflicts with the rebuild worktree docs, follow:
> - `claps_codelab_rebuild_components/README.md`
> - `claps_codelab_rebuild_components/docs/README.md`
> - `claps_codelab_rebuild_components/plan/`

---

## Quick Context: The Cotizador Lodge Ecosystem

**What:** A quotation system for SF Lodge (event catering venue)
**Deployment:** Google Apps Script add-on with Google Sheets UI
**Architecture:** 5-worktree ecosystem (database → pricing → orchestration → frontend → integration)
**Status:** Phases 1-2 complete ✅ (209 tests passing) | Phase 3 in progress ⏳ | Phase 4 planned 📋
**Tech Stack:** XState v5.28.0 + Alpine.js v3.12.0 + Pure JavaScript (2 dependencies only)

---

## Directory Structure at a Glance

```
/home/jp/CotizadorLodge/

📄 Root Documentation (START HERE)
├── INDEX.md                      ← Navigation hub
├── QUICK_START.md                ← 5-10 min beginner's guide
├── README_ECOSYSTEM.md            ← Full ecosystem overview (20 min)
├── WORKTREE_STATUS.md            ← Detailed status report
└── current_state.md              ← Latest session summary

📁 claps_codelab/                 ← Architecture & Planning (v2 branch)
│  ├── CLAUDE.md                  ← Worktree-specific guidance
│  ├── README.md                  ← Product overview
│  ├── worktrees.md               ⭐ ESSENTIAL: 8 architecture diagrams + flow
│  ├── TECHNICAL_DEPENDENCIES_AND_MOCKING.md
│  ├── DATABASE_ABSTRACTION_STRATEGY.md
│  ├── DATABASE_SCHEMA_DRIVEN_MODELS.md
│  ├── DATAFLOW_AND_CACHING_STRATEGY.md
│  ├── package.json               ← Integration/bundling (Phase 4)
│  └── src/Config/
│     └── Config_Schema.js        ← 11-table schema (single source of truth)

📁 claps_codelab_database/        ← Phase 1 ✅ (Persistence Layer)
│  └── packages/database/
│     ├── src/
│     │  ├── IStore.js           ← Abstract interface
│     │  ├── ModelFactory.js     ← Auto-generates models
│     │  ├── createDatabase.js   ← Factory function
│     │  └── stores/             ← InMemory, File, Gas adapters
│     └── test/database.test.js  ← 3 passing tests

📁 claps_codelab_pricing/         ← Phase 2 ✅ (Pure Calculation Pipeline)
│  ├── src/
│  │  ├── Pricing/               ← 6-stage pipeline
│  │  │  ├── expand.js, defaults.js, pricing.js, adjustments.js, taxes.js, pipeline.js
│  │  └── RulesEngine/           ← 9 pluggable rule actions
│  └── tests/                    ← 147 tests, 25 files

📁 claps_codelab_xstate/          ← Phase 2 ✅ (Orchestration / State Machine)
│  ├── src/
│  │  └── Orchestration/
│  │     ├── quotationMachineBlueprint.js  ← Machine definition
│  │     ├── quotationMachine.xstate.js    ← Machine factory
│  │     └── adapters/
│  │        ├── actions.js  ← 15+ state machine actions
│  │        ├── guards.js   ← 8+ state machine guards
│  │        └── services.js ← Async service definitions
│  └── tests/               ← 59 tests

📁 claps_codelab_frontend/        ← Phase 3 ⏳ (User Interface)
│  ├── src/
│  │  ├── bridge/
│  │  │  └── AlpineXStateBridge.js  ← Connects Alpine.js to XState
│  │  └── local/
│  │     └── createCotizadorActor.local.js  ← Local actor factory
│  ├── tests/bridge/              ← Bridge integration tests
│  └── integration_concerns.md    ← Phase 3 design document

📁 Data/                          ← Historical Quotation Data
   └── Data_Historica.csv         ← Real-world validation data
```

---

## High-Level Architecture (The Picture)

```
┌────────────────────────────────────┐
│  User Interface (Alpine.js)         │
│  Phase 3: AlpineXStateBridge sync  │
└──────────────┬─────────────────────┘
               │ Events (addItem, removeItem, etc.)
               ▼
┌────────────────────────────────────┐
│  Orchestration (XState v5 Machine) │
│  Phase 2: Owns all DB access      │
├────────────────────────────────────┤
│ ✅ Parallel regions                │
│ ✅ 15+ actions, 8+ guards          │
│ ✅ Caches reference data at init   │
│ ✅ 59 tests passing                │
└──────────────┬─────────────────────┘
               │ Pricing params
               │ (header, lineas, catalog, rules)
               ▼
┌────────────────────────────────────┐
│  Pricing Engine (Pure Functions)   │
│  Phase 2: 6-stage pipeline         │
├────────────────────────────────────┤
│ ✅ expand() → defaults()            │
│ ✅ pricing() → adjustments()        │
│ ✅ manual() → taxes()               │
│ ✅ 147 tests, 100% deterministic   │
│ ✅ Zero external dependencies      │
└──────────────┬─────────────────────┘
               │ Calculation results
               ▼
┌────────────────────────────────────┐
│  Database Layer (Pluggable Stores) │
│  Phase 1: IStore interface         │
├────────────────────────────────────┤
│ ✅ InMemoryStore (testing)          │
│ ✅ FileStore (local dev)            │
│ ✅ GasSheetStore (production)       │
│ ✅ 11 auto-generated models         │
│ ✅ 3 tests passing                 │
└────────────────────────────────────┘
```

**Key Pattern:** Each layer is independent, testable, and pure. XState owns all database access and caches reference data, passing only required parameters to the pure pricing pipeline.

---

## Essential Documentation (Read in Order)

1. **[QUICK_START.md](./QUICK_START.md)** (5-10 min)
   - Overview of the 4 worktrees with code examples
   - Interactive learning commands
   - Architecture pattern explanation

2. **[claps_codelab/worktrees.md](./claps_codelab/worktrees.md)** ⭐ (30 min)
   - 8 Mermaid diagrams (data flow, dependencies, runtime, patterns)
   - Quotation flow narrative (8 steps from user click to results)
   - Technical patterns explained (DI, pure functions, adapters, observers)

3. **[README_ECOSYSTEM.md](./README_ECOSYSTEM.md)** (20 min)
   - What was recently completed
   - Complete data flow walkthrough
   - Implementation timeline and status
   - Common tasks and FAQ

4. **[WORKTREE_STATUS.md](./WORKTREE_STATUS.md)** (15 min)
   - Detailed phase completion breakdown
   - Test results summary
   - Per-worktree analysis (3 tests database, 147 tests pricing, 59 tests xstate)

5. **[claps_codelab/CLAUDE.md](./claps_codelab/CLAUDE.md)** (10 min)
   - Worktree-specific architecture decisions
   - Key patterns and constraints
   - Reference: v1 implementation

---

## Common Commands

### Running All Tests (3.2 seconds total)

```bash
# Sequential (reproducible)
cd /home/jp/CotizadorLodge/claps_codelab_database/packages/database && npm test
cd /home/jp/CotizadorLodge/claps_codelab_pricing && npm test
cd /home/jp/CotizadorLodge/claps_codelab_xstate && npm test

# Or one-liner
for dir in claps_codelab_database/packages/database claps_codelab_pricing claps_codelab_xstate; do
  (cd /home/jp/CotizadorLodge/$dir && npm test) &
done && wait
```

### Database Layer

```bash
cd /home/jp/CotizadorLodge/claps_codelab_database/packages/database
npm test                    # 3 integration tests (103ms)
npm test 2>&1 | grep -E "(✓|×)"  # Quick result check
```

### Pricing Layer

```bash
cd /home/jp/CotizadorLodge/claps_codelab_pricing
npm test                    # Run all 147 tests once (2.26s)
npm run test:watch          # Watch mode (useful during development)
npm run interactive         # Interactive calculator REPL
npm run demo                # Run demo with real data
```

### Orchestration Layer

```bash
cd /home/jp/CotizadorLodge/claps_codelab_xstate
npm test                    # Run all 59 tests (814ms)
npm run inspect             # Visualize state machine with all transitions
npm run example             # Demo workflow (create quotation end-to-end)
```

### Frontend & Integration (Phase 3-4)

```bash
cd /home/jp/CotizadorLodge/claps_codelab_frontend
npm test                    # Frontend bridge tests
npm run dev                 # Local dev server

cd /home/jp/CotizadorLodge/claps_codelab
npm run build               # Rollup: creates IIFE bundle for GAS
npm run test:integration    # Merged stack tests
```

---

## Typical Workflows

### Adding a New Pricing Rule

1. **Update schema:** `claps_codelab/src/Config/Config_Schema.js`
   - Add new action type to `REGLAS_NEGOCIO.Tipo_Accion` options

2. **Implement handler:** `claps_codelab_pricing/src/RulesEngine/actions/`
   - Create pure function for the new rule

3. **Register handler:** `claps_codelab_pricing/src/RulesEngine/actions/index.js`
   - Export the new handler

4. **Add tests:** `claps_codelab_pricing/tests/unit/rules_engine/`
   - Test the new rule with various inputs

5. **Verify:** `cd claps_codelab_pricing && npm test`

### Modifying State Machine Logic

1. **Update blueprint:** `claps_codelab_xstate/src/Orchestration/quotationMachineBlueprint.js`
   - Modify states, transitions, or guards

2. **Update adapters if needed:**
   - `adapters/actions.js` - action implementations
   - `adapters/guards.js` - guard conditions
   - `adapters/services.js` - async services

3. **Add/update tests:** `claps_codelab_xstate/tests/`
   - Test state transitions and side effects

4. **Verify:** `cd claps_codelab_xstate && npm test`

### Running a Single Test

```bash
# Pricing (filter by test name)
cd /home/jp/CotizadorLodge/claps_codelab_pricing
npx vitest --run --reporter=verbose 2>&1 | grep -A 5 "test name"

# XState (filter by test file)
cd /home/jp/CotizadorLodge/claps_codelab_xstate
npx vitest --run tests/quotation_machine.test.js

# Database
cd /home/jp/CotizadorLodge/claps_codelab_database/packages/database
npm test 2>&1 | grep "specific test name"
```

---

## Key Files (Single Source of Truth)

Update these files and the entire system cascades:

| File | Purpose | Impact |
|------|---------|--------|
| `claps_codelab/src/Config/Config_Schema.js` | 11-table database schema | All models auto-regenerate |
| `claps_codelab_xstate/src/Orchestration/quotationMachineBlueprint.js` | State machine definition | All transitions, actions, guards |
| `claps_codelab_pricing/src/Pricing/pipeline.js` | 6-stage calculation pipeline | Pricing for all quotations |
| `claps_codelab_database/packages/database/src/IStore.js` | Database abstraction interface | All store implementations |

---

## Architecture Decisions (What's Important to Know)

### 1. Pure Pricing Engine
- **Why:** Testable without mocking, deterministic, reusable in any context
- **How:** All data passed as parameters; functions return `{lineas, totals, appliedRules}`
- **Constraint:** Never access database directly

### 2. Orchestrator-Driven Data Flow
- **Why:** Single point of database access, predictable caching, 59% fewer DB calls vs v1
- **How:** XState loads reference data once at init, caches in context, passes to pricing
- **Constraint:** All DB access must go through XState

### 3. Pluggable Stores (Dependency Injection)
- **Why:** Test with InMemory (fast, no I/O), deploy with GasSheetStore (production)
- **How:** IStore interface with 3 implementations
- **Constraint:** Models never hard-coded to specific store

### 4. Only Two External Dependencies
- **xstate@5.28.0** - State machine (14-15 KB gzipped)
- **alpinejs@3.12.0** - Reactive UI (15 KB gzipped)
- **Everything else:** Vanilla JavaScript ES2020+
- **Benefit:** Minimal bundle size (~50 KB gzipped total), no supply chain risk

### 5. Schema-Driven Model Generation
- **Why:** Models never out of sync, auto-detects schema changes
- **How:** ModelFactory generates all 11 models from `Config_Schema.js`
- **Constraint:** Always define schema changes in Config_Schema first

---

## Constraints & Patterns

### ✅ DO

- Load data in XState actions (at `INIT` or state entry)
- Pass data as parameters to pricing functions
- Use InMemoryStore for testing (no GAS API calls)
- Define all schema changes in Config_Schema.js first
- Keep pricing functions pure (no side effects, no I/O)
- Run tests after any change
- Commit code with meaningful commit messages

### ❌ DON'T

- Call database from pricing functions (violates purity)
- Use external dependencies outside xstate/alpinejs
- Couple models to storage implementation directly (use IStore)
- Modify v1 code in `old/` directly (reference only)
- Create new worktrees without updating documentation
- Hard-code data or configuration values

---

## Test Status Summary

```
Worktree           Tests  Files  Duration  Status
────────────────────────────────────────────────
database           3      1      103ms     ✅ PASS
pricing            147    25     2.26s     ✅ PASS
xstate             59     3      814ms     ✅ PASS
frontend           TBD    -      -         ⏳ Phase 3

TOTAL              209    29     3.2s      ✅ PASS
```

All tests can run in parallel. Wall-clock time on modern hardware: ~3.2 seconds.

---

## Phase Status

| Phase | Task | Status | Time |
|-------|------|--------|------|
| 1 | Database abstraction | ✅ Complete | 2-3h actual |
| 2a | Pricing engine | ✅ Complete | 3-4h actual |
| 2b | Orchestration | ✅ Complete | 2-3h actual |
| 3 | Frontend bridge (AlpineXStateBridge + components + tests) | ⏳ In Progress | 4-6h remaining |
| 4 | GAS bundling + deployment | 📋 Planned | 2h remaining |

**Completed:** 11+ hours | **Remaining:** 6-8 hours | **Total estimate:** 17-19 hours

---

## Important Context

### Real Data Available
- `Data/Data_Historica.csv` - Historical quotation data for validation
- Used in: `claps_codelab_pricing/tests/integration/historical_quotation_smoke.test.js`
- Purpose: Validate pricing calculations against real-world data

### Reference Implementation (v1)
- Location: `claps_codelab/old/` directory
- Status: Reference only (do not modify directly)
- What to learn: Business logic, quotation workflow, PDF generation approach

### Integration/Bundling
- Location: `claps_codelab/` (package.json, rollup.config.mjs, bundling/)
- Purpose: Consolidates all worktrees into single IIFE bundle
- Output: `dist/quotation-engine.iife.js` (~50 KB gzipped)
- Deployment: `clasp push` to Google Apps Script

---

## Debugging Tips

### To understand pricing calculations:
```bash
cd claps_codelab_pricing
npm run interactive  # REPL where you can test manually
```

### To understand state machine:
```bash
cd claps_codelab_xstate
npm run inspect     # Visual state diagram
```

### To understand data flow:
Read: `claps_codelab/DATAFLOW_AND_CACHING_STRATEGY.md`

### To understand what's broken:
1. Run test for the component: `npm test`
2. Check test output for failures
3. Read the test file to understand expectations
4. Fix the implementation to match

---

## Quick Navigation

| I want to... | Read this | Time |
|--------------|-----------|------|
| Understand architecture | `claps_codelab/worktrees.md` ⭐ | 30m |
| See tests passing | `npm test` in any worktree | 1m |
| Explore pricing | `npm run interactive` in pricing | 10m |
| Add a feature | Follow "Typical Workflows" above | 30m+ |
| Deploy to GAS | Wait for Phase 3 + Phase 4 | TBD |
| Understand v1 | `claps_codelab/old/` + v1 docs | 60m |

---

## Getting Help

- **Architecture questions?** → Read `claps_codelab/worktrees.md` (has 8 diagrams)
- **Test failures?** → Check `WORKTREE_STATUS.md` for context
- **How to implement X?** → Look at existing tests in `tests/` directories
- **Schema questions?** → Check `claps_codelab/DATABASE_SCHEMA_DRIVEN_MODELS.md`
- **What's next?** → Check `current_state.md` for session summary

---

**Last Updated:** 2026-02-18
**Total Tests:** 209 passing ✅
**Status:** Ready for Phase 3 implementation
