# Phase 3 - Frontend Bridge & Component Implementation

**Status:** In Progress (Step 3.1-3.2 Complete, Step 3.3 Planning Complete)
**Timeline:** Started Feb 2026
**Objective:** Build UI components with business logic, test-driven, modular

## Phase 3 Roadmap

| Step | Title | Status | Files | Tests | Time |
|------|-------|--------|-------|-------|------|
| 3.1 | Catalog UI + Basket Layout | ✅ Complete | 1 | - | 2h |
| 3.2 | User Override Protection | ✅ Complete | 2 | 363✅ | 1.5h |
| 3.3 | Rules Engine (Item) | 📋 Planning | 4 | 18-25 | 2.5h |
| 3.4 | Inheritance Mechanism | 🔄 Queue | - | - | 3h |
| 3.5 | Database Integration | 🔄 Queue | - | - | 2h |
| 3.6 | Container Components | 🔄 Queue | - | - | 2.5h |
| **Total** | | | | | **~13.5h** |

## Step-by-Step Breakdown

### ✅ Step 3.1: Catalog Card + Basket Line UI

**What:** Built UI templates showing items in two modes (catalog browsing, basket editing)
**Where:** `packages/components/item/ui/ItemStandalone.html`
**Status:** Complete ✅

### ✅ Step 3.2: User Override Protection

**What:** Track which fields user manually set (pax, cantidad, duracionMin) vs auto-calculated
**Where:** `packages/components/item/Item.js`
**Status:** Complete ✅ | Tests: 363 passing

**Key Addition:**
```javascript
isUserSetPax, isUserSetCantidad, isUserSetDuracion properties
```

### 📋 Step 3.3: Rules Engine (Item-Level)

**What:** Evaluate business rules at Item construction, cache results
**Where:** `packages/components/item/domain/rulesEngine/`
**Docs:** `plan/PHASE3/STEP_3_3_RULES_ENGINE/`
**Status:** Planning Complete ✅ | Ready for Implementation

**Planning Documents:**
- 📄 `00_OVERVIEW.md` - Quick summary
- 📄 `01_FOCUSED_SCOPE.md` - Implementation plan
- 📄 `02_DECISIONS_AND_ANSWERS.md` - Design decisions
- 📄 `03_DEEP_DIVE_REFERENCE.md` - Technical reference
- 📄 `README.md` - Full documentation

**Next:** Start implementation with focused scope

### 🔄 Step 3.4: Inheritance Mechanism (Queue)

**What:** Rules pass from Category → DayCategory → Item via inheritance
**Where:** Domain model (abstract)
**When:** After Step 3.3 complete

### 🔄 Step 3.5: Database Integration (Queue)

**What:** Pull rules from Google Sheets / CSV
**Where:** Database service layer
**When:** After Step 3.4 complete

### 🔄 Step 3.6: Container Components (Queue)

**What:** DayCategory and Basket rule logic
**Where:** New component domain classes
**When:** After Step 3.5 complete

---

## Current Work Directory

```
/home/jp/CotizadorLodge/claps_codelab_rebuild_components/
├── packages/components/
│   └── item/
│       ├── Item.js                    ← Core domain class
│       ├── domain/
│       │   ├── pricing.js             ← Pricing calculations
│       │   ├── rules.js               ← Rules evaluation
│       │   ├── quantity.js            ← Quantity resolution
│       │   ├── formatting.js          ← Display formatting
│       │   └── rulesEngine/           ← STEP 3.3: NEW
│       │       ├── coordinator.js
│       │       └── coordinator.test.js
│       ├── ui/
│       │   └── ItemStandalone.html    ← UI templates
│       └── tests/
│           ├── Item.test.js           ← 88 tests
│           ├── pricing.test.js        ← 82 tests
│           ├── quantity.test.js       ← 80 tests
│           ├── rules.test.js          ← 44 tests
│           ├── formatting.test.js     ← 69 tests
│           └── rulesEngine.test.js    ← STEP 3.3: NEW (15-20 tests)
└── package.json
```

## Key Statistics

| Metric | Value |
|--------|-------|
| **Total Tests Passing** | 363 ✅ |
| **Test Files** | 5 |
| **Domain Classes** | 1 (Item) |
| **External Dependencies** | 0 (pure JS) |
| **Build Time** | ~200ms |
| **Bundle Size** | TBD (not yet bundled) |

## Architecture Highlights

### Item Component Structure

```
Item (domain class)
├── Pricing
│   ├── Base price calculation
│   ├── Pax-based adjustments
│   ├── Time-based adjustments
│   └── Quantity-based adjustments
├── Quantity Resolution
│   ├── Context defaults
│   ├── User overrides
│   └── Override tracking (NEW Step 3.2)
├── Rules Evaluation (NEW Step 3.3)
│   ├── RulesCoordinator
│   ├── Condition evaluation
│   ├── Action execution
│   └── Result caching
└── Display
    ├── Human-readable strings
    ├── Applied rules list
    ├── Availability status
    └── User override badges
```

### Design Principles

1. **Testable** - All logic testable in isolation without UI
2. **Pure Functions** - No side effects, no I/O, deterministic
3. **Data Classes** - Item is a domain model, not a UI component
4. **Immutable Display** - toDisplayObject() returns static snapshot
5. **Modular** - Each aspect (pricing, rules, quantity) independent

## Testing Strategy

### Test Files
```
363 Tests Total (100% passing)
├── Item.test.js (88 tests)
│   ├── Factory tests
│   ├── Mode transitions
│   ├── Calculation tests
│   ├── Override tests (NEW 3.2)
│   └── Serialization tests
├── pricing.test.js (82 tests)
│   ├── Enum tests
│   ├── Type conversion
│   ├── Kind detection
│   └── Utility functions
├── quantity.test.js (80 tests)
│   ├── Context resolution
│   ├── Override precedence
│   └── Exclusive defaults
├── rules.test.js (44 tests)
│   ├── Rule evaluation
│   ├── Blocking behavior
│   └── Multiple rule handling
├── formatting.test.js (69 tests)
│   ├── Display string generation
│   ├── All kinds/modes
│   └── Edge cases
└── rulesEngine.test.js (NEW 3.3)
    ├── Constructor filtering
    ├── Evaluation caching
    ├── Action dispatch
    └── Error handling
```

### Test Commands

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Single file
npm test Item.test.js

# With coverage
npm test -- --coverage
```

## Next Actions

### Immediate (Step 3.3)
1. ✅ Complete planning documentation (DONE)
2. 📝 Create `coordinator.js` (1 hour)
3. 📝 Integrate with `Item.js` (45 min)
4. 📝 Add tests (45 min)
5. ✅ Verify 363 tests pass (automated)

### Short Term (Step 3.4+)
1. Design inheritance mechanism
2. Implement Category rules
3. Integrate DayCategory
4. Add database service

### Medium Term (Step 3.5+)
1. Fetch rules from Google Sheets
2. Handle rule updates
3. Complex actions (MULTIPLY, ADD_FIXED, etc.)
4. Rule invalidation strategy

## Documentation Map

| Document | Purpose |
|----------|---------|
| `plan/PHASE3/README.md` | This file - phase overview |
| `plan/PHASE3/STEP_3_3_RULES_ENGINE/00_OVERVIEW.md` | Step 3.3 quick summary |
| `plan/PHASE3/STEP_3_3_RULES_ENGINE/01_FOCUSED_SCOPE.md` | Step 3.3 implementation plan |
| `plan/PHASE3/STEP_3_3_RULES_ENGINE/02_DECISIONS_AND_ANSWERS.md` | Step 3.3 design rationale |
| `plan/PHASE3/STEP_3_3_RULES_ENGINE/03_DEEP_DIVE_REFERENCE.md` | Step 3.3 technical reference |

## Key Decisions

### Step 3.3 Specific
1. ✅ Use json-logic-js for conditions (+8 KB, already in project)
2. ✅ Evaluate rules at Item construction (not on every change)
3. ✅ Cache results (rules are deterministic)
4. ✅ Component-scoped filtering (not stage-based)
5. ✅ Start with ERROR and WARNING only

### Phase 3 Overall
1. ✅ Pure JavaScript - no UI frameworks
2. ✅ TDD - write tests first
3. ✅ Modular - one concern per class/function
4. ✅ 363-test baseline - maintain coverage

## Success Metrics

- [ ] Step 3.3 complete (RulesCoordinator + Item integration)
- [ ] All 363 tests passing
- [ ] 15-20 new RulesCoordinator tests passing
- [ ] 3-5 new Item integration tests passing
- [ ] Code review approval
- [ ] Ready for Step 3.4

---

**Status:** Ready for Step 3.3 Implementation
**Time Estimate:** 2.5 hours
**Next:** `plan/PHASE3/STEP_3_3_RULES_ENGINE/00_OVERVIEW.md`
