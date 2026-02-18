# SF Lodge Quotation Engine — XState Orchestration

**Purpose:** Orchestration layer for the SF Lodge quotation system. Owns all database access and coordinates pricing calculations via the pricing module.

**Status:** ✅ Phase 2 Complete — 59 tests passing

## Quick Start

```bash
npm test                    # Run all 59 tests
npm run inspect             # Visualize state machine
npm run example             # Demo end-to-end workflow
```

## What This Worktree Does

This is the **orchestration/state management layer** of the quotation system:

- **Owns all database access** - Acts as service layer
- **Coordinates pricing calculations** - Calls pricing module functions
- **Manages quotation workflow** - Browse → Initialize → Basket → Validation → Completed
- **Parallel regions** - Independent quotation workflow + database management
- **59 integration tests** - Full state transition coverage

## Key Files

| File | Purpose |
|------|---------|
| `src/Orchestration/quotationMachineBlueprint.js` | XState machine definition (parallel regions) |
| `src/Orchestration/adapters/actions.js` | 15+ state machine actions |
| `src/Orchestration/adapters/guards.js` | 8+ state machine guards |
| `src/Orchestration/quotationMachine.xstate.js` | Machine factory function |
| `src/QuotationService.js` | High-level service API |

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/xstate-machine-design.md` | Complete machine architecture and design |
| `docs/SYSTEM_READY_FOR_UI.md` | Architecture for UI developers (Phase 3 entry point) |
| `docs/QUICKSTART_CREATING_QUOTATIONS.md` | Usage examples with code |
| `docs/TESTING_SUMMARY.md` | Test coverage breakdown |

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Frontend (Alpine.js)               │
│  Sends events                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  XState Machine (THIS WORKTREE)     │
│  - Owns all DB access              │
│  - Routes events                   │
│  - Updates context                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Pricing Pipeline                   │
│  Pure functions, zero I/O           │
└─────────────────────────────────────┘
```

## Directory Structure

```
/
├── README.md              # This file
├── changelog.md           # Version history
├── .clasp.json            # Google Apps Script project config
├── docs/                  # All v2 design documentation
│   ├── CURRENT_STATE_&_NEXT_TASKS.md
│   ├── technical-design-v2-modular-architecture.md
│   ├── db_docs.md
│   ├── composition_logic.md
│   ├── PRICING_AND_CONSTRAINTS_v2.md
│   ├── discount-bundles-engine-design-v2-1.md
│   ├── quotation-pipeline-flow.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   └── TODO.md
└── old/                   # v1 implementation (reference only)
    ├── SheetDB.js         # Micro-ORM for Google Sheets
    ├── Models.js          # Cliente, Cotizacion, DetalleCotizacion, Item
    ├── Controller_Cotizacion.js  # Save, Load, PDF generation
    ├── Config.js          # DB configuration
    ├── Codigo.js          # Entry points
    ├── Tests.js           # Test suite
    ├── *.html             # Frontend components (AlpineJS)
    └── appsscript.json    # GAS manifest
```
