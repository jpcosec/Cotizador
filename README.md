# CotizadorLodge: Quotation System for SF Lodge

A production-ready quotation system for event catering. Built with XState, Alpine.js, and deploying to Google Apps Script.

**Status:** Phase 3 in progress (95% complete) | **Tests:** 209 passing ✅ | **Branch:** v2

---

## Quick Links

### 📋 Current Work (Start Here)
- **[PLAN.md](PLAN.md)** - Phase 3 roadmap and next immediate tasks
- **[FUTURE.md](FUTURE.md)** - Phase 4 vision and advanced features
- **[changelog.md](changelog.md)** - Version history and changes

### 📚 Documentation by Topic

**Architecture & Technical Specs:**
- [docs/ARCHITECTURE/state-machine.md](docs/ARCHITECTURE/state-machine.md) - 18-state machine with 65 tests
- [docs/PACKAGES/xstate.md](docs/PACKAGES/xstate.md) - Orchestration layer details
- [docs/PACKAGES/pricing.md](docs/PACKAGES/pricing.md) - Pricing pipeline (5 stages)
- [docs/PACKAGES/database.md](docs/PACKAGES/database.md) - IStore interface & persistence
- [docs/PACKAGES/frontend.md](docs/PACKAGES/frontend.md) - Alpine.js UI components

**Phase 3: Frontend Integration**
- [docs/PHASE3/fixes.md](docs/PHASE3/fixes.md) - 3 critical fixes (race condition, bootstrap, validation)
- [docs/PHASE3/checklist.md](docs/PHASE3/checklist.md) - Step-by-step verification & implementation
- [docs/PHASE3/components.md](docs/PHASE3/components.md) - Missing HTML components (state-aware views)

**Phase 4: Advanced Features**
- [docs/PHASE4/database-management.md](docs/PHASE4/database-management.md) - Catalog editor
- [docs/PHASE4/pdf-generation.md](docs/PHASE4/pdf-generation.md) - PDF export
- [docs/PHASE4/email-delivery.md](docs/PHASE4/email-delivery.md) - Email service

**Business & Domain:**
- [docs/BUSINESS/quotation-workflow.md](docs/BUSINESS/quotation-workflow.md) - User journey
- [docs/BUSINESS/features.md](docs/BUSINESS/features.md) - Feature list
- [docs/BUSINESS/schema.md](docs/BUSINESS/schema.md) - Data model overview

**Deployment & Testing:**
- [docs/DEPLOYMENT/gas-checklist.md](docs/DEPLOYMENT/gas-checklist.md) - GAS deployment guide
- [docs/TESTING/strategy.md](docs/TESTING/strategy.md) - Testing approach
- [docs/TESTING/integration.md](docs/TESTING/integration.md) - Integration testing

---

## 30-Second Architecture Overview

```
┌─────────────────────┐
│  Alpine.js UI       │  (Lightweight reactive components)
└──────────┬──────────┘
           │ (events)
           ▼
┌─────────────────────┐
│  XState Machine     │  (18 states, 26 actions, 65 tests)
│  (orchestrator)     │  ✅ 100% complete
└──────────┬──────────┘
           │ (cached data as params)
           ▼
┌─────────────────────┐
│  Pricing Pipeline   │  (5-stage pure function, 147 tests)
│  (pure functions)   │  ✅ 100% complete
└─────────────────────┘
           │ (prices)
           ▼
┌─────────────────────┐
│  Database Layer     │  (IStore interface, 3 adapters)
│  (pluggable)        │  ✅ 100% complete
└─────────────────────┘
```

---

## Project Status

| Phase | Component | Status | Tests |
|-------|-----------|--------|-------|
| 1 | Database abstraction | ✅ Complete | 3 |
| 2 | Pricing pipeline | ✅ Complete | 147 |
| 2 | Orchestration (XState) | ✅ Complete | 65 |
| 3 | Frontend integration | ⏳ In progress | - |
| 4 | PDF + Email + Polish | 📋 Planned | - |

**Total:** 209 tests passing

---

## Next Immediate Step

→ **Read [PLAN.md](PLAN.md)** for Phase 3 roadmap (5 min)
→ **Follow [docs/PHASE3/fixes.md](docs/PHASE3/fixes.md)** for 3 critical fixes (1 hour)

---

## Quick Commands

```bash
# Run all tests
npm run test:integration

# Build bundle
npm run build

# Test individual worktrees
cd packages/xstate && npm test       # 65 tests
cd packages/pricing && npm test      # 147 tests
cd packages/database && npm test     # 3 tests
```
