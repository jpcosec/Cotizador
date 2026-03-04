# Rebuild Components Worktree

From-scratch reconstruction of the SF Lodge Cotizador components using XState v5.28.0 + Alpine.js v3.12.0.

## Status: ✅ Rebuild in progress, 529 tests passing

Roadmap: See `ROADMAP.md` for the agreed 10-step sequence and progress tracking.

### Current focus:
- Item component domain + machine (`catalog` and `basket` modes)
- Category loader over item actors
- Database browser playground
- Quotation playground composition

## Quick Start

```bash
# Run dev server (http://localhost:8090)
npm run serve:sandbox

# Run all tests
npm test

# Watch mode for tests
npm run test:watch
```

Visit:
- `http://localhost:8090/` — Landing page
- `http://localhost:8090/step-I1-database` — Database browser playground
- `http://localhost:8090/step-03b` — Item playground
- `http://localhost:8090/step-I3-category-01` — Category playground
- `http://localhost:8090/step-04-quotation` — Quotation playground

## Documentation

- **[ROADMAP.md](./ROADMAP.md)** — 10-step sequence, current progress
- **[PLAN_NEXT_STEPS.md](./PLAN_NEXT_STEPS.md)** — Detailed implementation plan for each step
- **[changelog.md](./changelog.md)** — Version history and features added
- **[PLAN_ITEM_REFACTOR.md](./PLAN_ITEM_REFACTOR.md)** — Architecture decision: one XState actor per item

## Test Suite

Located in `packages/components/item/tests/`:
- `pricing.test.js` — 82 tests (enums, type conversion, kind detection)
- `quantity.test.js` — 80 tests (context resolution, override precedence)
- `formatting.test.js` — display string generation
- `Item.test.js` — factories, modes, calculations, serialization
