# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Context: What is This?

**SF Lodge Cotizador** is a quotation system for events/catering. It's built as a **5-worktree ecosystem** where each worktree specializes in one concern:

```
claps_codelab (v2)           ← Architecture & planning docs (THIS REPO)
├── claps_codelab_database   ← Stores + Models (planned)
├── claps_codelab_xstate     ← Orchestration (59 tests passing)
├── claps_codelab_pricing    ← Pure calculations (117 tests passing)
└── claps_codelab_frontend   ← Alpine.js UI (in progress)
```

**Final product:** Single ~50KB gzipped IIFE bundle for Google Apps Script deployment.

---

## Architecture: 30-Second Version

```
┌─────────────────────────────┐
│  @claps/frontend            │  ← Alpine.js UI
│  (Alpine.js + reactive)     │
└──────────────┬──────────────┘
               │ (events)
               ▼
┌─────────────────────────────┐
│  @claps/xstate              │  ← State Machine (orchestrator)
│  (Owns all data access)     │
└──────────┬──────────────────┘
           │ (cached data as params)
           ▼
┌─────────────────────────────┐
│  @claps/pricing             │  ← Pure functions (zero I/O)
│  (100% business logic)      │
└─────────────────────────────┘
```

**Key pattern:** XState loads reference data (catalog, rules, profiles) at initialization, caches in context, passes to pricing as parameters. Pricing never touches the database.

---

## Essential Documentation (Read in This Order)

1. **[worktrees.md](worktrees.md)** ⭐ **START HERE**
   - 5-worktree architecture overview
   - 8 Mermaid diagrams (data flow, dependencies, runtime, patterns)
   - Quotation flow narrative (8 steps from user click to PDF)
   - Technical patterns (DI, pure functions, adapters, observers, factory)

2. **[TECHNICAL_DEPENDENCIES_AND_MOCKING.md](TECHNICAL_DEPENDENCIES_AND_MOCKING.md)**
   - External libraries: **ONLY xstate@5.x + alpinejs@3.12.0** (zero others!)
   - Per-worktree package.json templates
   - Rollup IIFE bundling for GAS
   - Message contracts between modules
   - Mock implementations for testing (InMemoryStore, MockActor, MockBridge)

3. **[DATABASE_ABSTRACTION_STRATEGY.md](DATABASE_ABSTRACTION_STRATEGY.md)**
   - IStore interface (pluggable backend)
   - 3 adapters: GasSheetStore, InMemoryStore, FileStore
   - Dependency injection pattern for testing

4. **[DATABASE_SCHEMA_DRIVEN_MODELS.md](DATABASE_SCHEMA_DRIVEN_MODELS.md)**
   - ModelFactory approach (auto-generate models from schema)
   - Config_Schema.js as single source of truth
   - 11 tables defined (currently only 4 in old code → schema drift risk)

5. **[DATAFLOW_AND_CACHING_STRATEGY.md](DATAFLOW_AND_CACHING_STRATEGY.md)**
   - Orchestrator-driven data loading
   - Cache strategy: load once at init, pass as params to pricing
   - Cache invalidation rules
   - Performance analysis (59% reduction in DB calls vs v1)

---

## Directory Structure

```
/home/jp/CotizadorLodge/claps_codelab/
├── README.md                              # Product overview + quick start
├── changelog.md                           # Version history
├── CLAUDE.md                              # This file
│
├── [ARCHITECTURE DOCS - Read these]
├── worktrees.md                           # ⭐ Complete architecture guide
├── TECHNICAL_DEPENDENCIES_AND_MOCKING.md
├── DATABASE_ABSTRACTION_STRATEGY.md
├── DATABASE_SCHEMA_DRIVEN_MODELS.md
├── DATAFLOW_AND_CACHING_STRATEGY.md
│
├── src/
│   └── Config/
│       └── Config_Schema.js               # 11-table schema definition (source of truth)
│
├── docs/                                  # Stable technical documentation
│   ├── README.md                          # Docs index
│   ├── ARCHITECTURE/                      # Core design documents
│   ├── PACKAGES/                          # Per-package reference
│   ├── BUSINESS/                          # Domain and workflow docs
│   └── DEPLOYMENT/                        # Build and deployment guides
│       └── local-deployment.md            # Local dev server setup
│
├── plan/                                  # Planning, roadmap, phase tracking
│   ├── README.md                          # Plan index
│   ├── PLAN.md                            # Current implementation priorities
│   ├── FUTURE.md                          # Post-v2 ideas
│   ├── features.md                        # Feature backlog
│   ├── legacy-items-rule-migration-matrix.md
│   └── PHASE3/                            # Phase 3 task files
│
├── docs/legacy/                           # v1 design documents (reference only)
└── old/                                   # v1 implementation (reference only)
    ├── SheetDB.js                         # Micro-ORM (to be replaced by Store interface)
    ├── Models.js                          # Domain models (to be refactored)
    ├── Controller_Cotizacion.js           # Service layer
    └── *.html                             # Frontend components (v1)
```

### Worktree Locations

All worktrees are siblings under `/home/jp/CotizadorLodge/`:

```
/home/jp/CotizadorLodge/
├── claps_codelab/                 ← Architecture & planning (v2 branch, THIS REPO)
├── claps_codelab_xstate/          ← Orchestration (59 passing tests)
├── claps_codelab_pricing/         ← Pricing engine (117 passing tests)
└── claps_codelab_frontend/        ← UI components (in progress)
```

---

## Testing Across Worktrees

### Running Tests Locally

Each worktree has a **package.json** with test scripts:

```bash
# Test xstate (orchestration layer)
cd /home/jp/CotizadorLodge/claps_codelab_xstate
npm run test              # Vitest watch mode
npm run test:coverage     # Coverage report
npm run test:ui           # UI dashboard

# Test pricing (pure calculations)
cd /home/jp/CotizadorLodge/claps_codelab_pricing
npm run test              # Vitest (runs once)
npm run test:watch        # Vitest watch mode
npm run demo              # Interactive demo
npm run interactive       # Interactive calculator

# Check specific functionality
npm run example            # Example usage
```

### Current Test Status (Updated)

| Worktree | Tests | Status | Completion |
|----------|-------|--------|------------|
| database | 3 | ✅ Passing | Phase 1 COMPLETE |
| pricing | 147 | ✅ Passing | Phase 2 COMPLETE |
| xstate | 59 | ✅ Passing | Phase 2 COMPLETE |
| frontend | TBD | ⏳ Planned | Phase 3 (ready to start) |

**Total:** 209 tests passing (206 core + 3 database)

**For detailed status breakdown, see:** [`../WORKTREE_STATUS.md`](../WORKTREE_STATUS.md)

---

## Key Architecture Decisions

### 1. **Pure Pricing Engine**
- Pricing functions receive **all data as parameters** (no database access)
- Returns: `{lineas: [...], totals: {...}, appliedRules: [...]}`
- Benefits: Testable in isolation, deterministic, composable

### 2. **Orchestrator-Driven Data Flow**
- **XState owns all database access** (acts as service layer)
- Loads reference data once at init: catalog, rules, pricing profiles
- Caches in `context.dataCache`
- Passes cached data as parameters to pricing pipeline
- Benefits: Single point of DB access, predictable caching, 59% reduction in DB calls

### 3. **Pluggable Stores (Dependency Injection)**
```javascript
// Models work with any store, e.g.:
const store = new InMemoryStore();    // Testing
const store = new GasSheetStore();    // Production (GAS)
const store = new FileStore();        // Local development

Cliente.setStore(store);
const clients = await Cliente.find({...});
```

### 4. **No External Dependencies (Except Two)**
- **xstate@5.x** - State machine orchestration (14-15 KB gzipped)
- **alpinejs@3.12.0** - Reactive UI framework (15 KB gzipped)
- Everything else is vanilla JS (ES2020+)
- **Pricing**: Zero dependencies (not even xstate)

### 5. **Single Bundle for Deployment**
- Rollup builds one IIFE bundle: `quotation-engine.iife.js`
- Detects environment at runtime (GAS vs Node vs Browser)
- Uses only required store adapter
- Tree-shaking removes unused code (~50 KB gzipped total)

### 6. **Schema-Driven Model Generation**
```javascript
// Config_Schema.js defines 11 tables (source of truth)
// ModelFactory auto-generates Models from schema:
const Cliente = ModelFactory.create('CLIENTES', CONFIG_SCHEMA);
const Cotizacion = ModelFactory.create('COTIZACIONES', CONFIG_SCHEMA);
// Benefits: Never out of sync, auto-detects new tables
```

---

## Workflow: Adding a Feature

### Example: "Add new rule type to REGLAS_NEGOCIO"

1. **Update schema** → `src/Config/Config_Schema.js`
   - Add new `Tipo_Accion` option to `REGLAS_NEGOCIO` table definition
   - This is the source of truth

2. **Update rules engine** → `claps_codelab_pricing/src/RulesEngine`
   - Add handler for new action type in `evaluateRule()`
   - Add test case in `__tests__/`

3. **Update models** (if needed) → `@claps/database` (future)
   - Models auto-sync with schema, so may require no changes

4. **Update tests**
   - Run: `npm run test` in pricing worktree
   - Verify: `npm run test:coverage`

5. **Update GAS deployment**
   - Run: `npm run build` (bundles all worktrees)
   - Verify: `npm run test:bundle` (checks bundle integrity)

---

## Common Commands Quick Reference

### Development
```bash
# In xstate worktree
npm run test              # Watch mode
npm run inspect           # Visualize machine state
npm run example           # Run example workflow

# In pricing worktree
npm run test:watch        # Watch mode
npm run demo              # Interactive demo
npm run interactive       # Calculator REPL

# In root (when monorepo exists)
npm run build             # Rollup: creates IIFE bundle
npm run test:all          # Run all worktree tests
```

### Debugging
```bash
# Check what's in context.dataCache during state transitions
npm run inspect

# Interactive pricing calculator
cd claps_codelab_pricing
npm run interactive

# View database schema
open schema_viewer.html    # Browser view of CONFIG_SCHEMA
```

---

## Important Patterns & Constraints

### ✅ DO:
- **Load data in XState actions** (at `INIT` or state entry)
- **Pass data as parameters to pricing functions**
- **Use InMemoryStore for testing** (no GAS API calls)
- **Define all schema changes in Config_Schema.js first**
- **Keep pricing functions pure** (no side effects, no I/O)
- **Use dependency injection** for stores

### ❌ DON'T:
- Call database from pricing functions (violates purity)
- Use external dependencies outside xstate/alpinejs
- Couple models to SheetDB directly (use IStore interface)
- Modify v1 code in `old/` directly (reference only, plan migration)
- Create new worktrees without updating README.md + worktrees.md

---

## Reference: v1 Implementation

The `old/` directory contains the v1 implementation (reference only):

| File | Status | Action |
|------|--------|--------|
| `SheetDB.js` (213 lines) | To replace | Becomes Store adapters (IStore interface) |
| `Models.js` (442 lines) | To refactor | Use Store interface, auto-generate from schema |
| `Controller_Cotizacion.js` (268 lines) | To migrate | Methods → XState actions |
| `Config.js` | To enhance | Merge with CONFIG_SCHEMA.js |

Legacy v1 features (for context):
- Simple price lookup (no rule engine)
- 4 tables only (no composition, no dynamic rules)
- Manual PDF generation (no built-in PDF support)

---

## Where to Ask Questions

### Understanding the Architecture?
→ Start with **[worktrees.md](worktrees.md)** (8 diagrams explain everything)

### Adding Tests?
→ Look at existing tests in `claps_codelab_pricing/src/__tests__/`

### Database Questions?
→ Read **[DATABASE_ABSTRACTION_STRATEGY.md](DATABASE_ABSTRACTION_STRATEGY.md)**

### Schema Questions?
→ Check **[DATABASE_SCHEMA_DRIVEN_MODELS.md](DATABASE_SCHEMA_DRIVEN_MODELS.md)** + `src/Config/Config_Schema.js`

### Integration Questions?
→ See **[DATAFLOW_AND_CACHING_STRATEGY.md](DATAFLOW_AND_CACHING_STRATEGY.md)**

### Planning & Roadmap?
→ See **[plan/PLAN.md](plan/PLAN.md)** for current priorities, **[plan/FUTURE.md](plan/FUTURE.md)** for post-v2 ideas

### Local Deployment?
→ See **[docs/DEPLOYMENT/local-deployment.md](docs/DEPLOYMENT/local-deployment.md)**

---

## Implementation Status: PHASES 1-2 COMPLETE ✅

### Phase 1: Database Abstraction (2-3 hours)
- [x] IStore interface (8 methods)
- [x] 3 store adapters (GasSheetStore, InMemoryStore, FileStore)
- [x] ModelFactory (auto-generates all 11 models from CONFIG_SCHEMA)
- [x] 3 integration tests ✅
- **Status:** ✅ **COMPLETE** - Production ready

### Phase 2: Pricing Engine & Orchestration (5-6 hours total)
- [x] Pricing engine (6-stage pipeline, 147 tests) ✅
- [x] Rules engine (9 action types, pluggable)
- [x] XState machine (parallel regions, 59 tests) ✅
- [x] State transitions validated
- **Status:** ✅ **COMPLETE** - 206 tests passing

### Phase 3: Frontend Bridge (4-6 hours)
- [ ] AlpineXStateBridge (sync Alpine ↔ XState)
- [ ] Alpine.js components for quotation UI
- [ ] Reactive properties from snapshots
- [ ] Event dispatching from UI
- [ ] End-to-end integration tests
- **Status:** ⏳ **READY TO START** - Design complete

### Phase 4: Bundling & GAS Deployment (2 hours)
- [ ] Rollup IIFE configuration
- [ ] Environment detection
- [ ] Bundle size verification (~50KB gzipped)
- [ ] GAS wrapper functions
- **Status:** 📋 **PLANNED** - After Phase 3

**Total effort:** 12-14 hours → 11+ hours actual (Phases 1-2 done)

---

## Version History

See [changelog.md](changelog.md) for detailed version history and major changes.

---

**Last Updated:** 2026-02-18
**Branch:** v2 (architecture & planning)
**Status:** Ready for Phase 1 Implementation
