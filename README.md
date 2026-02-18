# SF Lodge Cotizador

Quotation system for SF Lodge (events and catering venue). Built on Google Apps Script with Google Sheets as the data layer.

**Status:** v2 Architectural Design Complete - Ready for Phase 1 Implementation

---

## Quick Start: Understanding the System

Start here to understand how everything works:

1. **[worktrees.md](worktrees.md)** - Complete architecture (START HERE!)
   - 5-worktree ecosystem overview
   - 8 Mermaid diagrams showing data flow and module interactions
   - Quotation flow narrative (8 steps from user click to PDF)
   - Technical patterns used throughout

2. **[TECHNICAL_DEPENDENCIES_AND_MOCKING.md](TECHNICAL_DEPENDENCIES_AND_MOCKING.md)** - Production specs
   - External libraries: ONLY xstate@4.38 + alpinejs@3.12
   - Rollup IIFE bundling for GAS
   - Message contracts between modules
   - Mock implementations for testing
   - Bundle size (~55KB gzipped)

3. **[DATABASE_ABSTRACTION_STRATEGY.md](DATABASE_ABSTRACTION_STRATEGY.md)** - Data layer design
   - IStore interface (pluggable stores)
   - 3 adapters: GasSheetStore, InMemoryStore, FileStore
   - Dependency injection pattern

4. **[DATABASE_SCHEMA_DRIVEN_MODELS.md](DATABASE_SCHEMA_DRIVEN_MODELS.md)** - Model generation
   - ModelFactory approach (auto-generate all 10 models)
   - Schema as single source of truth
   - Runtime introspection strategy

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Final: GAS App (IIFE Bundle)                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↑ (Rollup)

┌──────────────────┬───────────────────────┬──────────────────────┐
│ @claps/database  │  @claps/xstate        │  @claps/frontend     │
│ (Stores+Models)  │  (Orchestration)      │  (Alpine.js)         │
└──────────────────┴───────────────────────┴──────────────────────┘
                              ↑
                  (Depends on all 3 ↓)

           ┌────────────────────────────┐
           │    @claps/pricing          │
           │ (Pure calculation engine)  │
           └────────────────────────────┘
```

**Key characteristics:**
- ✅ **Zero external dependencies** except xstate + alpinejs
- ✅ **Pure functions** for pricing (no side effects)
- ✅ **Pluggable stores** (test with InMemory, deploy with GasSheetStore)
- ✅ **Event-driven** (UI dispatches events, XState updates state)
- ✅ **Fully testable** in isolation (no GAS API needed for tests)
- ✅ **Single bundle** for GAS deployment (~55KB gzipped)

---

## Directory Structure

```
/
├── README.md                              # This file
├── changelog.md                           # Version history
├── .clasp.json                            # Google Apps Script config
│
├── [ARCHITECTURE DOCS - READ THESE]
├── worktrees.md                           # ⭐ START HERE
├── TECHNICAL_DEPENDENCIES_AND_MOCKING.md
├── DATABASE_ABSTRACTION_STRATEGY.md
├── DATABASE_SCHEMA_DRIVEN_MODELS.md
│
├── src/
│   └── Config/
│       └── Config_Schema.js               # Single source of truth for schema
│
├── docs/
│   └── legacy/                            # Old v1 design documents (reference)
│       ├── technical-design-v2-modular-architecture.md
│       ├── PRICING_AND_CONSTRAINTS_v2.md
│       ├── composition_logic.md
│       └── ... (other legacy v1/v2 planning)
│
└── old/                                   # v1 Implementation (reference)
    ├── SheetDB.js                         # Micro-ORM (to refactor)
    ├── Models.js                          # Domain models (to refactor)
    ├── Controller_Cotizacion.js           # Business logic (to refactor)
    ├── Config.js                          # Configuration
    ├── *.html                             # Frontend components (v1)
    └── appsscript.json                    # GAS manifest
```

---

## Implementation Roadmap

### Phase 1: Create Database Worktree (2-3 hours)
Create `@claps/database` with:
- IStore interface
- 3 store adapters (GAS, InMemory, File)
- ModelFactory (auto-generate from CONFIG_SCHEMA.js)
- All 10 models working with any store
- Comprehensive tests using InMemoryStore mock

### Phase 2: Create AlpineXStateBridge (2-3 hours)
Bridge Alpine.js reactivity with XState state machine:
- Sync snapshots → reactive properties
- Dispatch events from UI
- Computed properties for view logic

### Phase 3: Integration Tests (2-3 hours)
End-to-end testing across all worktrees:
- Full quotation flow (add items, validate, save)
- State transitions
- Pricing calculations
- Database persistence

### Phase 4: Bundling & GAS Deployment (2 hours)
Create IIFE bundle for Google Sheets:
- Rollup configuration
- Environment detection
- Bundle size verification
- GAS wrapper functions

**Total Estimate:** 10-12 hours focused work

---

## Reference: v1 Implementation

The `old/` directory contains the v1 implementation (reference only):

- **SheetDB.js** - Micro-ORM for Google Sheets (to be abstracted → IStore interface)
- **Models.js** - Domain models for v1 (to be refactored into @claps/database)
- **Controller_Cotizacion.js** - Service layer (to be moved to @claps/xstate actions)
- **HTML components** - v1 UI (to be adapted for Alpine.js)

Legacy v1 features:
- Simple price lookup (no rule engine)
- 4 tables only (no composition, no rules, no caching)
- Manual PDF generation

---

## Project Dependencies

**Production Code:**
- `xstate@4.38.0` - State machine for orchestration
- `alpinejs@3.12.0` - Reactive UI framework

**Development Only:**
- `vitest@1.0.0` - Test runner
- `rollup@4.0.0` - Module bundler
- `@rollup/plugin-node-resolve` - Module resolution
- `@rollup/plugin-commonjs` - CommonJS support

**Zero runtime dependencies** for:
- Database layer (@claps/database)
- Pricing engine (@claps/pricing)

---

## Testing

All modules can be tested in isolation without touching Google Sheets:

```bash
# Test everything with mocks
npm run test

# Test individual worktrees
npm run test:database    # InMemoryStore mock
npm run test:pricing     # Pure functions
npm run test:xstate      # MockActor mock
npm run test:frontend    # MockBridge mock

# Test bundling
npm run build            # Verify Rollup works
npm run test:bundle      # Verify bundle integrity
```

---

## Development Environment

Local development uses mocks:
- **Database:** InMemoryStore (no GAS API calls)
- **Storage:** RAM only (no I/O)
- **Time:** Unit tests complete in ~1 second

Production uses real stores:
- **Database:** GasSheetStore (Google Sheets API)
- **Storage:** Persistent sheets
- **Quota:** 6-minute execution limit (optimized)

---

## Changelog

See [changelog.md](changelog.md) for version history and major changes.

---

## Legacy Documentation

The `docs/legacy/` folder contains v1 and early v2 planning documents for historical reference. For current architecture, see the documents listed in "Quick Start" above.

---

**Ready to start Phase 1? Read [worktrees.md](worktrees.md) first!**
