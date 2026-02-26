# Legacy vs. Rebuild: Feature Comparison

## Executive Summary

| Aspect | Legacy (claps_codelab) | Rebuild (components) | Status |
|--------|---|---|---|
| **Total Tests** | 739/777 (95.1%) | 363/363 (100%) ✅ | Rebuild fewer tests but 100% passing |
| **Packages** | 5 (database, pricing, xstate, domain, frontend) | 3 partial (components, pricing, xstate) | Missing 2 full packages |
| **Dependencies** | 2 (xstate, json-logic-js) | 1 (json-logic-js) | Rebuild missing xstate dependency |
| **Bundling** | Rollup IIFE + GAS support | None yet | Phase 4 planned |
| **Line Items** | Via pricing pipeline | Via Item component ✅ | Item-specific, not general |

---

## Detailed Package-by-Package Comparison

### 1. DATABASE PACKAGE (`packages/database/`)

#### Legacy Architecture ✅
```
packages/database/
├── src/
│   ├── IStore.js (abstract interface)
│   ├── ModelFactory.js (auto-generates models)
│   ├── Config_Schema.js (11 tables)
│   └── stores/
│       ├── InMemoryStore.js
│       ├── FileStore.js
│       └── GasSheetStore.js
└── tests/database.test.js (5 tests)
```

**Features:**
- ✅ Pluggable store pattern (swap implementations at runtime)
- ✅ Auto-generated models from schema
- ✅ 11 tables (CLIENTES, CATEGORIAS, ITEMS, etc.)
- ✅ 5 integration tests
- ✅ Abstract IStore interface (5 methods: get, set, all, create, update)

#### Rebuild Architecture ❌
```
packages/components/
├── common/ (utilities, no store)
├── item/domain/... (no store access)
└── No database package
```

**Status:** MISSING ENTIRELY
- ❌ No IStore interface
- ❌ No store implementations
- ❌ No model factory
- ❌ No schema definitions
- ❌ No database tests

**Impact:** 
- Items are seed-based (static data only)
- No persistence layer
- Can't load real catalogs from database
- No multi-environment support (test vs. prod)

---

### 2. PRICING PACKAGE (`packages/pricing/`)

#### Legacy Architecture ✅
```
packages/pricing/
├── src/
│   ├── Pricing/
│   │   ├── pipeline.js (6-stage flow)
│   │   ├── expand.js, defaults.js, pricing.js
│   │   ├── adjustments.js, manual.js, taxes.js
│   │   └── formatting.js
│   ├── RulesEngine/
│   │   ├── actions/ (9+ action types)
│   │   └── coordinator.js
│   └── Adapters/
└── tests/ (110/148 tests, 25 files)
```

**Features:**
- ✅ 6-stage pure function pipeline
- ✅ 9 rule action types (DESCUENTO, RESTRICCION, EXTRA, BLOQUEAR, MENSAJES)
- ✅ Event-driven mock layer
- ✅ JSON-Logic expression evaluation
- ✅ 110+ tests with various scenarios

#### Rebuild Architecture ⚠️ PARTIAL
```
packages/pricing/
└── src/ItemLogic.js (just one file)

packages/components/item/domain/
├── pricing.js ✅ (Item-specific pricing)
├── quantity.js ✅ (Item-specific quantity)
├── formatting.js ✅ (Item-specific display)
├── schedule.js ✅ (Item time logic)
└── rulesEngine/
    ├── coordinator.js ✅ (Item-specific rule evaluation)
    └── ... (partial rules, only 3 types: MAX_PAX, MIN_PAX, ONLY_HOUR_RANGE)
```

**Status:** PARTIALLY REIMPLEMENTED (Item-only)
- ✅ Item pricing calculation exists
- ✅ Item quantity resolution exists
- ✅ Item rules evaluation exists (coordinator + json-logic)
- ✅ 82 pricing tests for items
- ❌ No general 6-stage pipeline
- ❌ Only 3 rule types (vs. 9+ in legacy)
- ❌ No global/basket-level pricing adjustments
- ❌ No tax calculation
- ❌ No expansion/defaults stages
- ❌ 110 legacy tests not ported

**Impact:**
- Item pricing works ✅
- Can't calculate basket totals yet ❌
- Can't apply global rules or discounts ❌
- Can't calculate taxes ❌

---

### 3. XSTATE PACKAGE (`packages/xstate/`)

#### Legacy Architecture ✅
```
packages/xstate/
├── src/
│   ├── Orchestration/
│   │   ├── quotationMachineBlueprint.js (full machine)
│   │   ├── adapters/
│   │   │   ├── actions.js (15+ actions)
│   │   │   ├── guards.js (8+ guards)
│   │   │   └── services.js (async DB services)
│   │   └── createActor.js
│   └── runtime/
└── tests/quotation_machine.test.js (59 tests)
```

**Features:**
- ✅ Full quotation machine blueprint
- ✅ 15+ state actions (load catalog, update lineas, apply rules, etc.)
- ✅ 8+ guard conditions (validation)
- ✅ Async services for DB access
- ✅ Context caching strategy
- ✅ 59 comprehensive tests

#### Rebuild Architecture ⚠️ SKELETON ONLY
```
packages/xstate/
├── src/
│   ├── interactions/ (no meaningful content yet)
│   └── README.md
└── No tests
```

**Status:** MISSING IMPLEMENTATION
- ❌ No machine blueprint
- ❌ No actions
- ❌ No guards
- ❌ No services
- ❌ No orchestration logic
- ❌ No tests

**However, Component-Level Machines Exist:**
```
packages/components/item/
├── machine/itemMachine.js ✅
└── ItemComponent.js (owns the machine)
```

- ✅ Item machine (catalog/basket states, SET_CONTEXT, rules eval)
- ✅ Item-level guards
- ✅ Item-level actions

**Impact:**
- Item-level orchestration works ✅
- No global quotation orchestration ❌
- No multi-item coordination ❌
- No context propagation from quotation → categories → items ❌
- No orchestrated DB access ❌

---

### 4. DOMAIN PACKAGE (`packages/domain/`)

#### Legacy Architecture ✅
```
packages/domain/
├── src/
│   ├── classes/
│   │   ├── Catalog.js
│   │   ├── Basket.js, Item.js, Kit.js
│   │   ├── Category.js, DayCategory.js
│   │   └── ContainerBase.js, ItemBase.js
│   ├── mixins/
│   │   ├── Rulable.js, Prizable.js
│   │   ├── Aggregable.js, XStateable.js
│   │   └── Alpineable.js
│   └── adapters/
└── tests/ (553 tests)
```

**Features:**
- ✅ OOP domain models with composable mixins
- ✅ Tree-structured containers (Basket → DayCategory → Item/Kit)
- ✅ Rule inheritance (context flows down)
- ✅ Price aggregation (child totals bubble up)
- ✅ Dual-write for backward compatibility
- ✅ 553 comprehensive tests (100%)

#### Rebuild Architecture ⚠️ ITEM-ONLY PARTIAL
```
packages/components/item/
├── Item.js ✅ (one class, no base/mixin pattern)
├── ItemComponent.js ✅
├── domain/ (no classes, just functions)
│   ├── pricing.js ✅
│   ├── quantity.js ✅
│   ├── formatting.js ✅
│   └── schedule.js ✅
└── tests/Item.test.js (88 tests)
```

**Status:** MISSING MOST CLASSES
- ✅ Item class exists (but different design)
- ✅ Item component exists
- ❌ No Catalog class
- ❌ No Basket class
- ❌ No Kit class
- ❌ No Category class
- ❌ No DayCategory class
- ❌ No mixins (Rulable, Prizable, Aggregable, XStateable, Alpineable)
- ❌ No tree structure (no parent/child relationships)
- ❌ No rule inheritance
- ❌ No price aggregation
- ❌ 553 domain tests not ported

**Impact:**
- Single items work ✅
- Can't compose items into kits ❌
- Can't group items by category ❌
- Can't organize by day ❌
- Can't aggregate prices up the tree ❌
- Can't inherit context from containers ❌

---

### 5. FRONTEND PACKAGE (`packages/frontend/`)

#### Legacy Architecture ✅
```
packages/frontend/
├── src/
│   ├── Bridge/
│   │   └── AlpineXStateBridge.js
│   └── templates/ (5 HTML templates)
└── tests/ (12 tests)
```

**Features:**
- ✅ AlpineXStateBridge (bidirectional sync)
- ✅ sendEvent() — user input → XState
- ✅ syncToAlpine() — state → UI
- ✅ mapContextToDisplay() — context projection
- ✅ 5 HTML component templates
- ✅ 12 integration tests

#### Rebuild Architecture ⚠️ PER-COMPONENT APPROACH
```
packages/components/item/
├── Item.html ✅ (static template)
├── ItemComponent.js ✅ (lightweight wrapper)
├── logic/
│   ├── createItemStandaloneComponent.js ✅
│   └── createItemMultiComponent.js ✅
└── ui/
    └── ItemStandalone.html ✅ (Alpine-bound)
```

**Status:** REDESIGNED (component-local approach)
- ✅ Item component HTML exists
- ✅ createItem factory functions exist
- ✅ Alpine.js binding exists (per-component)
- ❌ No centralized AlpineXStateBridge
- ❌ No unified template system
- ❌ No global bridge for quotation orchestration

**Impact:**
- Individual items bind to Alpine ✅
- Components are self-contained ✅
- Can't easily coordinate multiple components ❌
- No global state sync ❌
- Pattern doesn't scale to quotation level ❌

---

## Components: What's Been Built

### ✅ Counter Components (Test Pattern)

```
packages/components/
├── counter-basic/ (Step 1)
│   ├── src/CounterComponent.js
│   ├── machine/counterMachine.js
│   ├── ui/counter.html
│   └── tests/
│
└── counter-composed/ (Step 2)
    ├── GlobalCounter.js + LocalCounter.js
    ├── Parallel actor pattern demo
    └── tests/
```

**Purpose:** Validate XState + Alpine pattern before scaling to items
**Status:** ✅ Working pattern, proven concept

---

### ✅ Item Component (Step 3)

**Complete Implementation:**

```
packages/components/item/
├── Item.js (core class)
│   ├── #rulesCoordinator (rule evaluation)
│   ├── #machine (XState)
│   ├── toDisplayObject() (projection)
│   └── 88 tests ✅
│
├── ItemComponent.js (lightweight facade)
├── machine/itemMachine.js (blueprint)
│   ├── states: UNINITIALIZED, CATALOG, BASKET
│   ├── events: SET_MODE, SET_CONTEXT, SET_OVERRIDE, etc.
│   └── guards, actions
│
├── domain/ (pure functions)
│   ├── pricing.js (82 tests)
│   ├── quantity.js (80 tests)
│   ├── formatting.js (69 tests)
│   ├── schedule.js
│   └── rulesEngine/
│       ├── coordinator.js (28 tests)
│       └── json-logic (expression evaluation)
│
├── logic/ (mounting)
│   ├── createItemStandaloneComponent.js
│   └── createItemMultiComponent.js
│
├── ui/ (HTML + Alpine binding)
│   ├── ItemStandalone.html (catalog + basket modes)
│   └── RulesEditor.html (introspection)
│
└── tests/ (363 total tests)
    ├── Item.test.js (88)
    ├── pricing.test.js (82)
    ├── quantity.test.js (80)
    ├── rules.test.js (44)
    ├── formatting.test.js (69)
    └── rulesEngine/coordinator.test.js (28)
```

**Status:** ✅ COMPLETE FOR ITEMS
- 363 tests passing (100%)
- Full calculation pipeline
- Rules engine (JSON-Logic based)
- User override tracking
- Catalog/basket mode toggle
- Sandbox demo working

---

## Features Comparison Table

| Feature | Legacy | Rebuild | Status |
|---------|--------|---------|--------|
| **Database Layer** | ✅ Full (IStore + 3 impls) | ❌ None | MISSING |
| **Pluggable Stores** | ✅ Yes (InMemory, File, GAS) | ❌ No | MISSING |
| **11-Table Schema** | ✅ Yes | ❌ No | MISSING |
| **6-Stage Pricing Pipeline** | ✅ Yes | ⚠️ Item-only | PARTIAL |
| **9+ Rule Types** | ✅ Yes | ⚠️ 3 types | PARTIAL |
| **Global Pricing Rules** | ✅ Yes | ❌ No | MISSING |
| **Tax Calculation** | ✅ Yes | ❌ No | MISSING |
| **Quotation Orchestration** | ✅ Yes | ❌ No | MISSING |
| **Item Pricing** | ✅ Yes | ✅ Yes | COMPLETE ✅ |
| **Item Quantity Logic** | ✅ Yes | ✅ Yes | COMPLETE ✅ |
| **Item Rules** | ✅ Yes | ⚠️ Basic | PARTIAL |
| **Item Component** | ⚠️ Old design | ✅ New design | REDESIGNED |
| **Category Container** | ✅ Yes | ❌ No | MISSING |
| **Kit Support** | ✅ Yes | ❌ No | MISSING |
| **Day Grouping** | ✅ Yes | ❌ No | MISSING |
| **Context Inheritance** | ✅ Yes | ❌ No | MISSING |
| **Price Aggregation** | ✅ Yes (up-tree) | ❌ No | MISSING |
| **Dual-Write Pattern** | ✅ Yes | ❌ No | MISSING |
| **Alpine Bridge** | ✅ Centralized | ⚠️ Per-component | REDESIGNED |
| **Rollup Bundling** | ✅ Yes (IIFE) | ❌ No | MISSING |
| **GAS Support** | ✅ Yes | ❌ No | MISSING |
| **Tests** | 739/777 (95%) | 363/363 (100%) | REBUILD BETTER |

---

## Test Coverage Comparison

### Legacy (739 tests)
```
database/     5 tests    ✅
pricing/     110 tests   ✅ (38 pre-existing failures)
xstate/       59 tests   ✅
domain/      553 tests   ✅
frontend/     12 tests   ✅
─────────────────────────────
TOTAL:       739 tests   95.1% pass rate
```

### Rebuild (363 tests)
```
Item/pricing/    82 tests   ✅
Item/quantity/   80 tests   ✅
Item/formatting/ 69 tests   ✅
Item/rules/      44 tests   ✅
Item/core/       88 tests   ✅
─────────────────────────────
TOTAL:          363 tests   100% pass rate
```

**Gap:** Rebuild has NO tests for:
- Database/stores ❌
- Basket ❌
- Category ❌
- Kit ❌
- DayCategory ❌
- Global rules ❌
- Tax calculation ❌
- Orchestration ❌
- Frontend bridge ❌
- Bundling ❌

---

## What's Working vs. What's Missing

### ✅ WORKING (Item-Level)
```
┌─────────────────────────────────────┐
│         ITEM COMPONENT              │
├─────────────────────────────────────┤
│ XState Machine                  ✅  │
│ Pricing (item-level)            ✅  │
│ Quantity Resolution             ✅  │
│ Rules Evaluation (JSON-Logic)   ✅  │
│ Display Formatting              ✅  │
│ User Override Tracking          ✅  │
│ Catalog/Basket Mode Toggle      ✅  │
│ Alpine.js Binding               ✅  │
│ HTML UI (2 modes)               ✅  │
│ Sandbox Demo                    ✅  │
│ 363 Tests (100%)                ✅  │
└─────────────────────────────────────┘
```

### ❌ MISSING (Container/Orchestration Level)
```
┌──────────────────────────────────────┐
│    CONTAINER ORCHESTRATION           │
├──────────────────────────────────────┤
│ Quotation Machine                ❌  │
│ Catalog (item list + groups)     ❌  │
│ Basket (cart of items)           ❌  │
│ Category (pricing profile)       ❌  │
│ Kit (composite items)            ❌  │
│ DayCategory (time grouping)      ❌  │
│ Context Inheritance              ❌  │
│ Price Aggregation (up-tree)      ❌  │
│ Global Rules (basket-level)      ❌  │
│ Tax Calculation                  ❌  │
│ Database Integration             ❌  │
│ Pluggable Stores                 ❌  │
│ Bundling & Deployment            ❌  │
│ GAS Support                      ❌  │
└──────────────────────────────────────┘
```

---

## Recommended Path Forward

### Phase 1: Stabilize Item ✅ (DONE)
- [x] Item component complete
- [x] 363 tests passing
- [x] Catalog + basket modes
- [x] Rules engine (JSON-Logic)
- [x] User overrides protected

### Phase 2: Build Containers (Next - Steps 4-6)
- [ ] **Step 4:** Database Viewer (load catalog from DB)
- [ ] **Step 5:** Category Container (owns item actors, provides context)
- [ ] **Step 6:** Basket Container (owns day categories, aggregates prices)

### Phase 3: Build Orchestration (Steps 7-8)
- [ ] **Step 7:** Quotation Machine (top-level orchestrator)
- [ ] **Step 8:** Full pricing pipeline (6-stage, global rules, taxes)

### Phase 4: Integration & Deployment (Steps 9-10)
- [ ] **Step 9:** Database Integration (items from real catalog)
- [ ] **Step 10:** Bundling & GAS deployment

---

## Key Gaps to Fill

| Gap | Legacy | Rebuild | Priority |
|-----|--------|---------|----------|
| Database abstraction | ✅ Complete | ❌ Missing | **HIGH** |
| Container pattern | ✅ Complete | ❌ Missing | **HIGH** |
| Basket aggregation | ✅ Complete | ❌ Missing | **HIGH** |
| Global rules | ✅ Complete | ❌ Missing | **MEDIUM** |
| Kit support | ✅ Complete | ❌ Missing | **MEDIUM** |
| Tax calculation | ✅ Complete | ❌ Missing | **MEDIUM** |
| GAS bundling | ✅ Complete | ❌ Missing | **LOW** |

---

## Summary

**The Rebuild has achieved:**
- ✅ Complete item component (standalone working)
- ✅ Proven component pattern (XState + Alpine)
- ✅ High test coverage (363 tests @ 100%)
- ✅ Clean architecture (separation of concerns at item level)
- ✅ JSON-Logic rules (flexible condition evaluation)

**The Rebuild is missing:**
- ❌ Database layer (critical for real data)
- ❌ Container system (critical for composition)
- ❌ Orchestration (critical for multi-item workflows)
- ❌ Basket aggregation (critical for pricing)
- ❌ Global rules & taxes (critical for calculations)
- ❌ Bundling (needed for deployment)

**Next steps:** Focus on Phase 2 (Containers) to unlock multi-item functionality and database integration.
