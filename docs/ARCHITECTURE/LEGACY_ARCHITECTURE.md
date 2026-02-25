# Legacy Architecture: Claps Codelab Monorepo (v2 branch)

## Overview

Claps Codelab is a monorepo bundler that consolidates 5 independent packages into a single IIFE bundle for Google Apps Script deployment. The architecture emphasizes **separation of concerns**, **pluggable layers**, and **pure calculation functions**.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CLAPS CODELAB MONOREPO ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              📦 BUNDLER ENTRY POINT
                         bundling/createCotizadorActor.js
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   Frontend   │  │    XState    │  │   Database   │
            │   Package    │  │   Package    │  │   Package    │
            └──────────────┘  └──────────────┘  └──────────────┘
                    │               │               │
                    │               │               │
            AlpineXState      Quotation        TableStore
            Bridge.js         Machine.js       (+ LocalInit)
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────────────────────────────────────┐
        │  XState Orchestrator (Wires everything together)│
        │  ┌───────────────────────────────────────────┐  │
        │  │ context.store (Database layer)            │  │
        │  │ context.catalog (Reference data)          │  │
        │  │ context.lineas (Quotation items)          │  │
        │  │ context.totals (Computed pricing)         │  │
        │  └───────────────────────────────────────────┘  │
        └────────────┬──────────────────────────────────┬─┘
                     │                                  │
        ┌────────────▼──────────────┐     ┌────────────▼──────────────┐
        │   Domain Package (Phase B) │     │   Pricing Package (Legacy)│
        │   ┌──────────────────────┐│     │   ┌──────────────────────┐│
        │   │ • Catalog            ││     │   │ • Pipeline (6-stage) ││
        │   │ • Basket             ││     │   │ • RulesEngine (9+)   ││
        │   │ • Item               ││     │   │ • Adapters           ││
        │   │ • Category           ││     │   │ • Formatting         ││
        │   │ • RulesCoordinator   ││     │   │ • Defaults           ││
        │   │ • Mixins (Rulable,   ││     │   │ • Manual Overrides   ││
        │   │   Prizable, etc.)    ││     │   └──────────────────────┘│
        │   └──────────────────────┘│     └────────────────────────────┘
        └────────────┬───────────────┘
                     │
        ┌────────────▼──────────────────┐
        │  Pure Calculation Functions   │
        │  (No side effects, no I/O)    │
        │  • Quantity resolution        │
        │  • Price calculations         │
        │  • Rule evaluation (JSON-Lgc) │
        │  • Display formatting         │
        └───────────────────────────────┘
```

---

## Package Structure

### 1. **Database Package** (`packages/database/`)

**Responsibility:** Persistence layer with pluggable stores

**Key Components:**
- `IStore.js` — Abstract store interface (defines API contract)
- `ModelFactory.js` — Auto-generates 11 models from schema
- `Config_Schema.js` — Single source of truth (11 tables)
- `stores/` — Three implementations:
  - `InMemoryStore` (testing, no I/O)
  - `FileStore` (local development)
  - `GasSheetStore` (Google Sheets in production)

**Models (auto-generated):**
- CLIENTES, CATEGORIAS, ITEMS, SERVICIOS, CONTRATOS
- RUTAS, OFERTAS, PAGOS, COTIZACIONES, REGLAS_NEGOCIO, PROPIEDADES

**Tests:** 5/5 ✅ (includes CSV seed migration)

---

### 2. **Pricing Package** (`packages/pricing/`)

**Responsibility:** Pure calculation pipeline (legacy, 148 tests)

**Architecture:** 6-stage pure function pipeline

```
Input → expand() → defaults() → pricing() → adjustments() → manual() → taxes() → Output
```

**Stages:**
1. **expand()** — Normalize input, create lineas array
2. **defaults()** — Apply schema defaults
3. **pricing()** — Calculate base prices from catalog
4. **adjustments()** — Apply volume/time discounts
5. **manual()** — Handle user manual overrides
6. **taxes()** — Calculate taxes (IVA, etc.)

**Rules Engine:** 9 pluggable action types
- DESCUENTO_PORCENTAJE, DESCUENTO_MONTO, RESTRICCION_UI
- RESTRICCION_ITEM, EXTRA_MONTO, EXTRA_PORCENTAJE
- EXTRA_LINEA, BLOQUEAR, MENSAJES

**Key Features:**
- Zero external dependencies (pure JS)
- 100% deterministic (same input → same output)
- Event-driven mock layer for testing
- JSON-Logic expression evaluation

**Tests:** 110/148 ✅ (38 pre-existing failures)

---

### 3. **XState Package** (`packages/xstate/`)

**Responsibility:** Orchestration & state machine (owns all DB access)

**Key Files:**
- `quotationMachineBlueprint.js` — Machine definition (states, transitions)
- `adapters/actions.js` — 15+ state mutation actions
- `adapters/guards.js` — 8+ transition guard conditions
- `adapters/services.js` — Async service definitions (DB calls)
- `runtime/createActor.js` — XState v5 actor runtime

**Machine States:**
- `uninitialized` → `idle` → `handling` → `recalculating`
- Parallel regions for concurrent processing
- Context caching for reference data

**Context Structure:**
```javascript
{
  definition: { /* config */ },
  store: IStore,              // Database reference
  catalog: { /* ref data */ }, // Cached at init
  lineas: [ /* items */ ],     // Quotation line items
  totals: { /* computed */ },  // Pricing results
  appliedRules: [ /* rules */ ],
  userSetFields: Set,
  errors: [], warnings: []
}
```

**Key Behavior:**
- Single point of all database access
- Loads reference data once at INIT, caches in context
- Passes calculated data as parameters to pricing engine
- 59% fewer DB calls vs. v1 implementation

**Tests:** 59/59 ✅

---

### 4. **Domain Package** (`packages/domain/`)

**Responsibility:** Object-oriented domain models (Phase B, new)

**Classes:**
- `Catalog` — Collection of categories & items
- `Basket` — Container of quotation line items
- `Item` — Single quotation item with pricing
- `Kit` — Bundled items
- `Category` — Item grouping with pricing profiles
- `DayCategory` — Category per-day breakdown
- Base classes: `ItemBase`, `ContainerBase`

**Mixins:**
- `Rulable` — Rule evaluation capability
- `Prizable` — Pricing calculation
- `Aggregable` — Total computation
- `XStateable` — XState integration
- `Alpineable` — Alpine.js binding

**Features:**
- Self-calculating items (profile fallback if not overridden)
- Tree-structured containers (Basket → DayCategory → Item/Kit)
- Rule inheritance (context flows down, aggregation flows up)
- Dual-write for backward compatibility (basket → lineas/totals sync)

**Tests:** 553/553 ✅ (100%)

---

### 5. **Frontend Package** (`packages/frontend/`)

**Responsibility:** UI bridge between XState and Alpine.js

**Key Components:**
- `AlpineXStateBridge.js` — Bidirectional sync
  - `sendEvent(name, payload)` — User input → XState
  - `syncToAlpine()` — State → UI
  - `mapContextToDisplay()` — Convert context to UI format

- HTML component templates (5 templates)
- Local actor factory for testing
- Mock GAS shim for offline testing

**Sync Flow:**
1. User interacts with Alpine.js UI
2. Alpine fires event via bridge
3. Bridge sends event to XState actor
4. XState updates context (calculations, DB calls)
5. Bridge pulls new context
6. Alpine re-renders with new data

**Tests:** 12/12 ✅

---

## Data & Dependency Flow

### User Input → State Update → Calculation → Output

```
USER INPUT (via AlpineXStateBridge)
    │
    ▼
XState Machine
    │
    ├─→ actions/ ──→ Load/Update data from Store
    │   ├── services.js (async DB calls)
    │   ├── guards.js (validation)
    │   └── actions.js (state mutations)
    │
    ├─→ context.store ──→ Database Package
    │   │   ├── InMemoryStore (testing)
    │   │   ├── FileStore (local dev)
    │   │   └── GasSheetStore (production)
    │   │
    │   └── 11 Auto-Generated Models
    │       (from Config_Schema.js)
    │
    └─→ Pricing/Domain Calculations
        │   Pass context data as parameters
        │   Returns computed values
        │
        ├── Pricing.pipeline() [Legacy]
        ├── Domain.Item/Basket/Category [Phase B]
        └── RulesCoordinator.evaluate()
            (JSON-Logic expressions)

RESULT SYNCED BACK
    │
    ▼
Frontend Package (AlpineXStateBridge)
    │
    └─→ Alpine.js reactive UI
        Display totals, lineas, errors
```

---

## Build Pipeline & Output

### Local Bundle (Browser)

```
npm run build:bundle
    │
    ├─→ generate_local_init_tables.mjs
    │   (Creates bundling/generated/localInitTables.js)
    │
    └─→ rollup bundler
        Input: bundling/entry.js
            │
            ├─ AlpineXStateBridge (frontend)
            ├─ createCotizadorActor (wires everything)
            │   ├─ XState machine
            │   ├─ Database store
            │   ├─ Domain/Pricing logic
            │   └─ Local init data
            │
            └─ Resolves all node_modules (@xstate/...)
            
        Output: dist/quotation-engine.iife.js
                (354KB, 10,989 lines, browser-ready)
```

### GAS Bundle (Google Apps Script)

```
npm run build:gas
    │
    ├─→ reset_gas_workspace.mjs
    │   (Cleans /gas directory)
    │
    ├─→ generate_gas_runtime_bundle.mjs
    │   (Creates GAS-compatible wrapper)
    │
    └─→ generate_gas_code.mjs
        (Generates gas/Code.gs with embedded logic)
        
        Output: gas/Code.gs (GAS-compatible runtime)
```

---

## Package Dependencies

```
database/
    ├── IStore.js (abstract)
    │   ├── InMemoryStore
    │   ├── FileStore
    │   └── GasSheetStore
    │
    ├── ModelFactory.js
    └── Config_Schema.js (11 tables, single source of truth)

pricing/ ─────────┐
    ├── pipeline/ │
    ├── rules/    ├─→ LEGACY (still used for calculations)
    ├── adapters/ │
    └── formatting

domain/ ──────────┐
    ├── classes/ │
    ├── mixins/  ├─→ PHASE B (new architecture)
    ├── rules/   │
    └── RulesCoordinator

xstate/
    ├── Orchestration/
    │   ├── quotationMachine.xstate.js (blueprint)
    │   ├── adapters/ (actions, guards, services)
    │   └── runtime/ (XState v5 actor system)
    │
    └── depends on: database, domain OR pricing (switchable)

frontend/
    ├── Bridge/ (AlpineXStateBridge)
    ├── UI components
    └── depends on: xstate, domain OR pricing

bundling/ (Monorepo root)
    ├── entry.js (exports APIs)
    ├── createCotizadorActor.js (factory)
    ├── rollup.config.mjs (browser bundling)
    └── generated/ (auto-generated local data)
```

---

## Key Architectural Decisions

### ✅ Separation of Concerns

Each package has **one clear responsibility** and owns its interface:

| Package | Responsibility | Contract |
|---------|---|---|
| Database | Persistence with pluggable stores | `IStore` interface (5 methods) |
| Pricing | Pure calculation pipeline | `pipeline(header, lineas, catalog, rules)` → results |
| Domain | Object-oriented domain models | Classes with mixins |
| XState | Orchestration & state management | Machine blueprint + adapters |
| Frontend | UI synchronization | `AlpineXStateBridge` (sendEvent, syncToAlpine) |

### ✅ Pluggable Layers

**Stores:** Switch at runtime based on environment
- `InMemoryStore` — Fast testing (no I/O)
- `FileStore` — Local development (fs-based)
- `GasSheetStore` — Production (Google Sheets)

**Rules Engine:** JSON-Logic expressions
- Build-time evaluable
- No runtime expression evaluation
- Cache-friendly

**Calculations:** Two available engines
- Legacy `Pricing.pipeline()` (148 tests)
- New `Domain` models (553 tests)
- Switchable via `quotationAdapters`

### ✅ Monorepo with Single Bundle Output

- **5 independent packages** (each has own `package.json`, `node_modules`)
- **Shared nothing** (no cross-package imports except through adapters)
- **Single IIFE bundle** (`dist/quotation-engine.iife.js`)
- **Offline testable** (local init tables for dev without GAS)
- **Deployable** (`clasp push` to Google Apps Script)

### ✅ Pure Calculation Functions

**Pricing & Domain** are **pure functions**:
- ✅ No side effects (no DB access)
- ✅ No I/O operations
- ✅ Testable without mocking
- ✅ Reusable in any context
- ✅ Fast (synchronous)
- ✅ Deterministic (same input → same output)

**XState owns all I/O:**
- Database access
- File operations
- Async operations
- Complex state transitions

### ✅ Single Source of Truth

| File | Controls |
|------|----------|
| `Config_Schema.js` | 11 table definitions → all models auto-generated |
| `quotationMachine.xstate.js` | All state, transitions, actions, guards |
| `Pricing.pipeline.js` | 6-stage calculation flow |
| `Domain classes` | Object structure & behavior |

Change schema → all models regenerate automatically.

---

## Test Summary

| Package | Tests | Files | Status |
|---------|-------|-------|--------|
| database | 5/5 | 1 | ✅ PASS |
| pricing | 110/148 | 25 | ✅ (38 pre-existing) |
| xstate | 59/59 | 3 | ✅ PASS |
| domain | 553/553 | - | ✅ PASS |
| frontend | 12/12 | - | ✅ PASS |
| **TOTAL** | **739/777** | **29+** | **95.1%** |

**Run all tests:**
```bash
for dir in database pricing xstate domain frontend; do
  (cd packages/$dir && npm test) &
done && wait
```

---

## External Dependencies

**Production:**
- `xstate@5.28.0` — State management (14-15 KB gzipped)
- `json-logic-js@2.0.5` — Rule conditions (lightweight)

**Development:**
- `vitest` — Test runner (all packages)
- `rollup` — Bundler (top-level)

**Total bundle size:** ~354 KB (10,989 lines, includes all logic)

**Why minimal dependencies?**
- Easier to understand code
- Smaller bundle
- No supply chain risk
- No runtime version conflicts
- Works in Google Apps Script environment

---

## Entry Point & Factory

### `bundling/createCotizadorActor.js`

The main factory function that wires everything together:

```javascript
export function createCotizadorActor(opts = {}) {
  // 1. Create machine from XState
  const machine = createQuotationXStateMachine(quotationAdapters);
  const actor = createActor(machine);

  // 2. Inject store (pluggable)
  const store = opts.store || createTableStoreFromTables(LOCAL_INIT_TABLES);
  actor.getSnapshot().context.store = store;

  // 3. Start actor & bootstrap
  actor.start();
  if (opts.bootstrap !== false) {
    actor.send({ type: 'START_NEW_QUOTATION' });
    // ... more bootstrap events
  }

  return actor;
}
```

**Usage:**
```javascript
// Browser/test
const actor = createCotizadorActor({ paxGlobal: 50 });

// With custom store
const actor = createCotizadorActor({ 
  store: new GasSheetStore(spreadsheet),
  paxGlobal: 100
});
```

---

## Runtime Flow Example

### Create a quotation:

1. **User clicks "New Quotation"** (Alpine.js)
   ```
   AlpineXStateBridge.sendEvent('START_NEW_QUOTATION')
   ```

2. **XState processes event**
   ```
   Machine: idle → creating
   Action: loadCatalog() from database
   Action: initializeContext()
   ```

3. **Pricing engine calculates**
   ```
   Pricing.pipeline({
     header: { paxGlobal: 50, fechaEvento: '2026-02-24' },
     lineas: [],
     catalog: context.catalog,
     rules: context.rules
   }) → { lineas: [], totals: { ... } }
   ```

4. **State updated in context**
   ```
   context.lineas = [ ... ]
   context.totals = { subtotal: 0, total: 0 }
   ```

5. **AlpineXStateBridge syncs to UI**
   ```
   Alpine.js re-renders with new totals
   ```

---

## Deployment

### Local Testing
```bash
npm run build:bundle
npm run test:integration
```

### Google Apps Script
```bash
npm run build:gas
clasp push  # Pushes to GAS project
```

---

## References

- **Machine diagram:** `npm run inspect` (in xstate package)
- **Pricing demo:** `npm run demo` (in pricing package)
- **Interactive REPL:** `npm run interactive` (in pricing package)
- **Data flow:** See `DATAFLOW_AND_CACHING_STRATEGY.md`
- **Database schema:** `packages/database/Config_Schema.js`

---

## Summary

The legacy architecture is a **layered, modular monorepo** with:

1. **Clear separation** of database, calculations, and orchestration
2. **Pluggable components** (stores, rules, calculation engines)
3. **Pure functions** for calculations (testable, fast, reusable)
4. **Single orchestrator** (XState) that owns state and I/O
5. **Minimal dependencies** (xstate + json-logic-js only)
6. **Single bundle output** (IIFE for browser + GAS)

This design enables **easy testing**, **flexible deployment**, and **maintainable code** across 5 independent packages.
