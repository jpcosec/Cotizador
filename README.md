# Rebuild Components Worktree

From-scratch reconstruction of the SF Lodge Cotizador components using XState v5.28.0 + Alpine.js v3.12.0.

## Status: ✅ Steps 1-3 Complete (3.1 & 3.2 Done), 363 Tests Passing

Roadmap: See `ROADMAP.md` for the agreed 10-step sequence and progress tracking.

### Completed:
- ✅ **Step 01:** standalone `counter-basic` (XState + Alpine)
- ✅ **Step 02:** composed counters (`global + local`)
- ✅ **Step 03:** standalone `item` (external context simulation, no DB)
  - ✅ **3.1:** Catalog card + basket line UI layout
  - ✅ **3.2:** User override protection (`isUserSet` tracking)
  - 📝 **3.3:** JSON-Logic rules engine (pending)
  - 📝 **3.4:** Category profile inheritance (pending)

## Quick Start

```bash
# Run dev server (http://localhost:8090)
npm run serve:sandbox

# Run all tests (363 passing)
npm test

# Watch mode for tests
npm run test:watch
```

Visit:
- `http://localhost:8090/` — Landing page
- `http://localhost:8090/step-01-counter` — XState + Alpine counter
- `http://localhost:8090/step-02-counter-composed` — Composed counters (global + local)
- `http://localhost:8090/step-03-item` — Standalone item with catalog/basket modes

## Documentation

- **[ROADMAP.md](./ROADMAP.md)** — 10-step sequence, current progress
- **[PLAN_NEXT_STEPS.md](./PLAN_NEXT_STEPS.md)** — Detailed implementation plan for each step
- **[changelog.md](./changelog.md)** — Version history and features added
- **[PLAN_ITEM_REFACTOR.md](./PLAN_ITEM_REFACTOR.md)** — Architecture decision: one XState actor per item

## Test Suite (363 Tests, All Passing)

Located in `packages/components/item/tests/`:
- `pricing.test.js` — 82 tests (enums, type conversion, kind detection)
- `quantity.test.js` — 80 tests (context resolution, override precedence)
- `rules.test.js` — 44 tests (rule evaluation, blocking behavior)
- `formatting.test.js` — 69 tests (display string generation)
- `Item.test.js` — 88 tests (factories, modes, calculations, serialization, **NEW userSetFields tracking**)
