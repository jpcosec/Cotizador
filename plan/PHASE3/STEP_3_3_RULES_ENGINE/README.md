# Step 3.3 - Rules Engine for Items

**Status:** Planning Complete | Ready for Implementation
**Estimated Time:** 2.5 hours
**Date Created:** 2026-02-23
**Author:** Claude Code (Deep Dive Analysis)

## What This Contains

Complete planning documentation for **Step 3.3: Item-Level Rules Engine**

### Documents

1. **00_OVERVIEW.md** - Quick summary (start here)
2. **01_FOCUSED_SCOPE.md** - Implementation plan with code (what to build)
3. **02_DECISIONS_AND_ANSWERS.md** - Why this approach (design rationale)
4. **03_DEEP_DIVE_REFERENCE.md** - Technical reference (background)
5. **04_BUNDLING_ANALYSIS.md** - How to bundle json-logic-js (research complete)
6. **README.md** - This file

## Quick Start

**Time:** 5 minutes

```
1. Read: 00_OVERVIEW.md
   └─ Get the big picture

2. Read: 01_FOCUSED_SCOPE.md
   └─ See exact implementation steps

3. Ready to code?
   └─ Follow the implementation checklist
```

## The One-Liner

Create a **RulesCoordinator** class that evaluates business rules at Item construction time, caches the result, and integrates with the Item component.

## Key Files to Create

```
packages/components/item/domain/rulesEngine/
├── coordinator.js          (Core class, ~240 lines)
└── coordinator.test.js     (Tests, ~180 lines)

packages/components/item/Item.js
└── Add rulesCoordinator property + evaluate() call

packages/components/item/tests/Item.test.js
└── Add 3-5 integration tests
```

## Implementation Phases

| Phase | Duration | What | Files |
|-------|----------|------|-------|
| 3.3a | 1 hour | RulesCoordinator class | coordinator.js |
| 3.3b | 45 min | Item integration | Item.js |
| 3.3c | 45 min | Testing | *.test.js |
| **Total** | **2.5 hours** | **Complete step** | **4 files modified/created** |

## Success Criteria

- [ ] RulesCoordinator filters rules by componentType ✅
- [ ] Rules evaluated once, cached ✅
- [ ] Item integration seamless ✅
- [ ] 363 existing tests pass ✅
- [ ] 15-20 new coordinator tests pass ✅
- [ ] 3-5 new Item integration tests pass ✅

## Key Design Decisions

1. ✅ **Use json-logic-js** (already in project, +8 KB gzipped)
2. ✅ **Evaluate at construction** (not on every property change)
3. ✅ **Cache results** (rules are deterministic)
4. ✅ **Component-scoped filtering** (not stage-based pipeline)
5. ✅ **Keep it simple** (ERROR and WARNING actions only)

## Scope Boundaries

### In Scope (Step 3.3)
- RulesCoordinator class
- Item integration
- ERROR and WARNING actions
- Caching mechanism
- Unit + integration tests

### Out of Scope (Later Steps)
- Inheritance mechanism (Step 3.4)
- Database integration (Step 3.5+)
- Other component types (Step 3.6+)
- Complex action types (MULTIPLY, ADD_FIXED, etc.)
- Rule invalidation/updates (future)

## Architecture Overview

```
Item Creation
    ↓
RulesCoordinator('ITEM', allRules)
    ↓ Filters to ITEM-scoped rules only
    ↓ Evaluates all conditions
    ↓ Caches result
    ↓
Item.ruleResult = { appliedRules, errors, available, warnings }
    ↓
toDisplayObject() includes rule results
    ↓
UI displays: ❌ Max 320 pax (violated) or ✅ (satisfied)
```

## Real Example

**Rule from CSV:**
```
ID_Regla: R_AUT_0001
Nombre: Maximo 320 pax - Salon Chinook
Condicion_JSON: { "and": [{ "===": [...] }, { ">": [{ "var": "pax" }, 320] }] }
actionType: ERROR
```

**At Item creation:**
```javascript
const item = new Item({ ID_Item: 'SALON_CHINOOK', ... }, { pax: 350 });
// → Evaluates rule: pax (350) > max (320)? YES → ERROR
// → item.ruleResult.available = false
// → item.ruleResult.errors = [{ message: '...' }]
```

**On pax change:**
```javascript
item.setPax(100);
// → Does NOT re-evaluate rules
// → Returns cached result (available: true)
```

## Reading Guide

### For Implementation
1. **First:** Read **04_BUNDLING_ANALYSIS.md** - Decide on json-logic-js approach
2. Read **01_FOCUSED_SCOPE.md** (has all the code)
3. Follow the implementation checklist
4. Run tests after each phase

### For Understanding
1. Read **00_OVERVIEW.md** (5 min)
2. Read **02_DECISIONS_AND_ANSWERS.md** (10 min)
3. Read **03_DEEP_DIVE_REFERENCE.md** if needed (background)
4. Read **04_BUNDLING_ANALYSIS.md** for integration details (10 min)

### For Reference During Coding
- **01_FOCUSED_SCOPE.md** - Implementation plan
- **03_DEEP_DIVE_REFERENCE.md** - Technical details

## Testing Strategy

```
RulesCoordinator Tests (15-20 tests)
├── Constructor
│   ├── Filters by componentType
│   ├── Sorts by priority
│   └── Skips inactive rules
├── Evaluate
│   ├── Evaluates conditions
│   ├── Executes actions
│   ├── Caches results
│   └── Returns cached on re-eval
└── Action Handlers
    ├── ERROR action
    ├── WARNING action
    └── Unknown action throws

Item Integration Tests (3-5 tests)
├── Creates RulesCoordinator in constructor
├── Evaluates rules at construction
├── Includes rules in toDisplayObject()
└── Existing 363 tests still pass
```

## Development Checklist

- [ ] Create coordinator.js (90 lines implementation + 150 lines comments)
- [ ] Import json-logic-js properly
- [ ] Implement RulesCoordinator class
- [ ] Add constructor (filter + sort)
- [ ] Add evaluate() with caching
- [ ] Add evaluateCondition() with json-logic-js
- [ ] Add executeAction() with handlers
- [ ] Add humanize methods
- [ ] Create coordinator.test.js (15-20 tests)
- [ ] Update Item.js constructor
- [ ] Update Item.calculate()
- [ ] Update Item.toDisplayObject()
- [ ] Add Item integration tests (3-5)
- [ ] Run full test suite
- [ ] Verify 363 existing tests pass
- [ ] Code review

## Common Questions

**Q: Why cache if rules don't change?**
A: Multiple calls to evaluate() with different snapshots happen in tests and debugging. Caching ensures result consistency and improves performance.

**Q: Why only ERROR and WARNING?**
A: CSV data only uses these 2. MULTIPLY, ADD_FIXED, etc. are for price adjustments (Step 3.5+).

**Q: What about inheritance?**
A: That's Step 3.4. This step just makes Item rules work independently and testably.

**Q: Can we update rules at runtime?**
A: Not in Step 3.3. Cache is immutable. Future step if needed.

**Q: Why json-logic-js instead of simpler conditions?**
A: Real rules in CSV use it. Eliminates need to hardcode 30+ rule types. Flexibility worth the 8 KB.

## Next Steps After 3.3

1. **Step 3.4:** Inheritance mechanism
   - Category inherits rules from config
   - DayCategory inherits from Category + Item rules
   - Basket aggregates all rule results

2. **Step 3.5:** Database integration
   - Pull rules from Google Sheets
   - Initialize RulesCoordinator with real data

3. **Step 3.6:** Other component types
   - CATEGORY rules
   - KIT rules
   - CONTAINER rules
   - BASKET rules

---

**Ready to implement?** Start with 00_OVERVIEW.md, then 01_FOCUSED_SCOPE.md.

For questions about design: see 02_DECISIONS_AND_ANSWERS.md

For technical details: see 03_DEEP_DIVE_REFERENCE.md
