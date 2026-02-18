# SF Lodge Quotation System — Pricing Engine

**Purpose:** Pure calculation engine for the quotation system. Zero I/O, 100% testable.

**Status:** ✅ Phase 2 Complete — 147 tests passing (2.26s)

---

## Quick Start

```bash
npm test                    # Run all 147 tests
npm run test:watch          # Watch mode
npm run interactive         # Interactive calculator REPL
npm run demo                # Scripted demo with real data
```

## What This Worktree Does

This is the **pure calculation layer** of the quotation system:

- **6-stage pricing pipeline** - expand → defaults → pricing → adjustments → manual → taxes
- **Pluggable rules engine** - 9 action types for business rules
- **Zero external dependencies** - No xstate, no database access
- **100% deterministic** - Same inputs = same outputs (testable)
- **147 integration tests** - Full coverage of all pricing scenarios
- **Reusable library** - Can be used in CLI, API, UI, or Node.js context

## Key Files

| File | Purpose |
|------|---------|
| `src/Pricing/pipeline.js` | 6-stage pipeline orchestration |
| `src/Pricing/expand.js` | Composition/bundle expansion |
| `src/Pricing/defaults.js` | Q/T/P defaults resolution |
| `src/Pricing/pricing.js` | Base price formula |
| `src/Pricing/adjustments.js` | Rule-driven adjustments |
| `src/Pricing/taxes.js` | IVA calculation |
| `src/RulesEngine/RulesEngine.js` | Pluggable rules evaluation |
| `src/RulesEngine/actions/` | 9 rule action handlers |

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/pricing-engine.md` | Complete pricing pipeline documentation |
| `docs/pipeline.md` | Stage-by-stage breakdown |
| `docs/README.md` | Full documentation index |

## Architecture

```
┌─────────────────────────────────────┐
│  XState Machine                     │
│  Calls pricing functions as needed  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Pricing Pipeline (THIS LAYER)      │
│  Pure functions, no side effects    │
│  expand() → defaults() → pricing()  │
│  → adjustments() → manual() → taxes()
└─────────────────────────────────────┘
```

## Usage Example

```javascript
import { calculateFull } from './src/Pricing/pipeline.js';

const result = calculateFull({
  header: {
    pax_global: 50,
    evento_fecha: '2026-03-01'
  },
  lineas: [
    { ID_Item: 'SALON', Q: 1, P: 50, T: 240 }
  ],
  catalog: { SALON: { /* ... */ } },
  rules: REGLAS_NEGOCIO
});

// Returns: { lineas, totals, appliedRules }
console.log(result.totals.total);  // Final price
```

## Interactive Exploration

```bash
npm run interactive
# REPL: test pricing calculations manually
> const result = calculateFull({ ... })
> result.totals
```

## Test Coverage

```
147 tests across:
- Composition expansion
- Defaults resolution (Q/T/P)
- Base price calculation
- Rule-based adjustments
- Manual overrides
- Tax calculations
- Full pipeline integration
- Historical data validation
```
