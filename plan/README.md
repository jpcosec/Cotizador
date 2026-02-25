# CotizadorLodge Project Planning

This directory contains planning documentation for the CotizadorLodge quotation system.

## Quick Navigation

### Current Phase
**Phase 3 - Frontend Bridge & Component Implementation**

Status: In Progress (Step 3.1-3.2 Complete, Step 3.3 Planning Complete)

👉 **Next:** `PHASE3/README.md` - Phase overview

---

## Planning Directory Structure

```
plan/
├── README.md                           ← You are here
└── PHASE3/
    ├── README.md                       ← Phase 3 overview
    └── STEP_3_3_RULES_ENGINE/
        ├── 00_OVERVIEW.md              ← Start here (5 min)
        ├── 01_FOCUSED_SCOPE.md         ← Implementation (20 min)
        ├── 02_DECISIONS_AND_ANSWERS.md ← Why (10 min)
        ├── 03_DEEP_DIVE_REFERENCE.md   ← Details (20 min)
        └── README.md                   ← Full docs
```

## Phase Timeline

| Phase | Status | Start | Est. Duration | Next |
|-------|--------|-------|---------------|------|
| 1 | ✅ Complete | - | - | - |
| 2 | ✅ Complete | - | - | - |
| 3.1 | ✅ Complete | Feb 2026 | 2h | ✓ |
| 3.2 | ✅ Complete | Feb 2026 | 1.5h | ✓ |
| 3.3 | 📋 Planning | Feb 2026 | 2.5h | **Now** |
| 3.4 | 🔄 Queue | TBD | 3h | After 3.3 |
| 3.5 | 🔄 Queue | TBD | 2h | After 3.4 |
| 3.6 | 🔄 Queue | TBD | 2.5h | After 3.5 |

## Phase 3 Roadmap

### ✅ Step 3.1: Catalog Card UI
Item display modes - catalog browsing vs basket editing

### ✅ Step 3.2: User Override Protection
Track manual vs auto-calculated quantities

### 📋 Step 3.3: Rules Engine (Current)
Business rules evaluated at Item construction, cached

**Docs:**
- `PHASE3/STEP_3_3_RULES_ENGINE/00_OVERVIEW.md` - Quick summary
- `PHASE3/STEP_3_3_RULES_ENGINE/01_FOCUSED_SCOPE.md` - Implementation plan
- `PHASE3/STEP_3_3_RULES_ENGINE/02_DECISIONS_AND_ANSWERS.md` - Design decisions
- `PHASE3/STEP_3_3_RULES_ENGINE/03_DEEP_DIVE_REFERENCE.md` - Technical reference

### 🔄 Step 3.4: Inheritance
Rules cascade from Category → DayCategory → Item

### 🔄 Step 3.5: Database
Fetch rules from Google Sheets, handle updates

### 🔄 Step 3.6: Containers
DayCategory and Basket rule logic

---

## How to Read the Documentation

### For Getting Started (5 minutes)
1. Read: `PHASE3/README.md` - Phase overview
2. Read: `PHASE3/STEP_3_3_RULES_ENGINE/00_OVERVIEW.md` - Step 3.3 summary

### For Understanding Design (15 minutes)
1. Read: `PHASE3/STEP_3_3_RULES_ENGINE/02_DECISIONS_AND_ANSWERS.md`

### For Implementation (45 minutes)
1. Read: `PHASE3/STEP_3_3_RULES_ENGINE/01_FOCUSED_SCOPE.md`
2. Follow the implementation checklist

### For Technical Details (30 minutes)
1. Read: `PHASE3/STEP_3_3_RULES_ENGINE/03_DEEP_DIVE_REFERENCE.md`

---

## Current Project Status

### Phase 3 Progress

```
Step 3.1: Catalog UI ████████████ 100% ✅
Step 3.2: Overrides  ████████████ 100% ✅
Step 3.3: Rules      █░░░░░░░░░░░  10% 📋 (planning done, ready to code)
Step 3.4+: Queue     ░░░░░░░░░░░░   0% 🔄
```

### Component Test Status
- **Total Tests:** 363 passing ✅
- **Test Files:** 5 domain modules
- **Coverage:** 100% (all logic testable)

### Key Milestones
- ✅ Phase 1: Database abstraction complete
- ✅ Phase 2: Pricing & orchestration complete
- ✅ Phase 3.1-3.2: Item UI components complete
- 📋 Phase 3.3: Rules engine (planning complete, ready for code)
- 🔄 Phase 3.4+: Inheritance & database integration

---

## Quick Reference

### Step 3.3 Key Points

**What:** Create RulesCoordinator class for business rules
**Why:** Evaluate rules once at construction, cache results
**How:** Component-scoped filtering, JSON-Logic conditions
**Time:** 2.5 hours
**Tests:** +18-25 new tests

**Files to Change:**
```
packages/components/item/domain/rulesEngine/
├── coordinator.js (new)
└── coordinator.test.js (new)

packages/components/item/Item.js (update)
packages/components/item/tests/Item.test.js (update)
```

---

## Getting Started with Step 3.3

### Read First (Pick One)
- **5-minute version:** `PHASE3/STEP_3_3_RULES_ENGINE/00_OVERVIEW.md`
- **Implementation version:** `PHASE3/STEP_3_3_RULES_ENGINE/01_FOCUSED_SCOPE.md`
- **Design rationale:** `PHASE3/STEP_3_3_RULES_ENGINE/02_DECISIONS_AND_ANSWERS.md`

### Implementation Steps
1. Create `coordinator.js` with RulesCoordinator class
2. Update `Item.js` to use coordinator
3. Add tests
4. Verify 363 tests still pass

### Success Criteria
- [ ] RulesCoordinator filters and evaluates rules
- [ ] Item integration seamless
- [ ] 363 existing tests pass
- [ ] 18-25 new tests pass
- [ ] Code ready for review

---

## Documentation Standards

All planning documents follow this structure:
1. **Clear objective** - What are we building?
2. **Why this approach** - Design decisions explained
3. **Implementation details** - Code examples, checklist
4. **Test strategy** - What needs testing?
5. **Success criteria** - How do we know it works?

---

## Next Steps

1. **Read:** `PHASE3/STEP_3_3_RULES_ENGINE/00_OVERVIEW.md` (5 min)
2. **Decide:** Ready to implement or want to understand more?
3. **If ready:** Follow `01_FOCUSED_SCOPE.md` checklist
4. **If questions:** Check `02_DECISIONS_AND_ANSWERS.md` or `03_DEEP_DIVE_REFERENCE.md`

---

**Last Updated:** 2026-02-23
**Status:** Step 3.3 Planning Complete - Ready for Implementation
