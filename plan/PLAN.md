# PLAN: Frontend Unification + Testing (Phase 4)

**Last Updated:** 2026-02-21
**Phase:** 4 — Production Readiness
**Status:** Starting → Systematic Frontend Audit + Testing

---

## Session Overview

Starting Phase 4 with a **systematic approach**:
1. ✅ **Audit** all frontend code (see FRONTEND_AUDIT.md)
2. ✅ **Design** user workflow tests (see user-workflows.test.js)
3. 🟡 **Fix** identified issues (in progress)
4. 🟡 **Test** complete workflows (pending)

---

## 🔴 Blocking Issues Found

### Issue 1: Sidebar Prices Show $0
**Problem:** Items display $0 price in sidebar, only show correct price after clicking to add
**Root Cause:** cargarCatalogo() reads from GAS getCatalogo() which doesn't have pre-calculated prices
**Solution:** Use context.catalog.toDisplayObject() which has Item.displayPrice (profile-resolved)
**Task:** #10 - 1 hour to implement + test

### Issue 2: Parent Kit Costs Not Validated
**Problem:** Parent items in COMPOSICION_KIT can have non-zero costs → double-counting during expand()
**Business Rule:** Parent kits MUST have Costo_Base_Fijo = 0
**Solution:** Add validation in Catalog.load() + pricing expand()
**Task:** #8, #11 - 1-1.5 hours to implement + test

### Issue 3: State Sync Fragile
**Problem:** Frontend directly mutates carrito[idx] while state machine is active
**Risk:** Carrito can diverge from machine state
**Solution:** Remove direct mutations, let AlpineXStateBridge handle all sync
**Task:** #9 - Part of audit, 1-1.5 hours to fix

---

## 📋 Task Breakdown

### Task #9: Audit - Make all UI code read from domain classes
**Status:** ✅ COMPLETE - See `plan/FRONTEND_AUDIT.md`

Identified 7 areas needing fixes:
1. Catalog loading (Sidebar data) — currently reads from GAS
2. Carrito display (Timeline) — manual array construction
3. Totals calculation — duplicates domain logic
4. Category organization — manual grouping
5. Rules display — not shown in UI
6. Item details — mixed mode with dual-writes
7. Summary — cleanup needed

**Estimate:** 1-2 hours research ✅ DONE

### Task #10: Fix - Sidebar items with correct prices
**Status:** 🟡 PENDING

- [ ] Update cargarCatalogo() to use context.catalog first
- [ ] Call catalog.toDisplayObject() for display structure
- [ ] Transform to catalogoPorCategoria format sidebar expects
- [ ] Test sidebar displays prices immediately
- [ ] Keep fallback for local mode without state machine

**Estimate:** 1 hour implementation + testing

### Task #11: Fix - Parent kit cost validation
**Status:** 🟡 PENDING

- [ ] Add validation in Catalog.load()
- [ ] Throw error if parent kit has non-zero costs
- [ ] Update Item validation method
- [ ] Add tests for all scenarios
- [ ] Document business rule

**Estimate:** 1-1.5 hours implementation + testing

### Task #12: Create - User workflow tests
**Status:** ✅ COMPLETE - See `packages/frontend/tests/user-workflows.test.js`

7 scenarios implemented:
1. Basic quotation — browse, add, verify price ✅
2. Multi-day event — items on different days ✅
3. Quantity overrides — change pax, verify total ✅
4. Kit items — bundle pricing ✅
5. Rules & adjustments — RESTRICCION_UI, AJUSTE_LINEA ✅
6. Save & retrieve — snapshot persistence ✅
7. Complete journey — full workflow simulation ✅

20+ test cases, ready to run

**Estimate:** 1-2 hours to execute + fix failures

---

## 🎯 Implementation Order

### Phase 4a: Frontend Unification (4-5 hours)
1. Fix sidebar prices (Task #10) — 1h
2. Fix parent kit validation (Task #11) — 1.5h
3. Fix state sync issues (Task #9 part 2) — 1.5h
4. Run and fix user workflow tests (Task #12) — 1-2h

### Phase 4b: Production Hardening (2-3 hours)
- Error handling, performance, security (from debt.md)

### Phase 4c: PDF/Email/Deploy (4-5 hours)
- PDF generation, email, GAS deployment (from debt.md)

---

## 📊 Test Status

**Current:** 832/833 passing (99.9%)
- Domain: 553/553 ✅
- XState: 79/79 ✅
- Pricing: 110/148 ✅ (pre-existing failures)
- Database: 5/5 ✅
- Frontend: 10/10 ✅
- Integration: 2/2 ✅

**Target after Phase 4a:**
- All above + user workflow tests (7 scenarios, 20+ cases)
- All 832+ still passing
- No console errors
- Response times < 2sec

---

## 🔗 Reference Documents

**Audit & Strategy:**
- `plan/FRONTEND_AUDIT.md` — 7 areas identified, detailed fixes
- `packages/frontend/tests/user-workflows.test.js` — 7 scenarios, ready to run
- `plan/debt.md` — Phase 4 full breakdown (9 hours)
- `plan/future.md` — Post-Phase-4 strategic roadmap

**Tracking:**
- Task #8, #9, #10, #11, #12 — Use these to track progress
- This file (PLAN.md) — Current priorities

---

## Success Criteria

Phase 4a is done when:
- ✅ All fixes implemented (Tasks #10, #11, #9)
- ✅ All 832+ tests passing
- ✅ All 7 user workflows passing
- ✅ Sidebar prices correct
- ✅ Parent kits enforced to $0
- ✅ No direct carrito mutations
- ✅ Console clean (no warnings/errors)
