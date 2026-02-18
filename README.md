# SF Lodge Quotation System — Frontend UI

**Purpose:** Alpine.js user interface for the SF Lodge quotation system. Bridges reactive UI with XState orchestration.

**Status:** 🚀 Phase 3 In Progress — Bridge implementation and component tests

## Quick Start

```bash
npm test                    # Run bridge tests
npm run dev                 # Local dev server (port 8081)
```

## What This Worktree Does

This is the **user interface layer** of the quotation system:

- **Alpine.js reactive components** - Responsive UI updates
- **AlpineXStateBridge** - Syncs Alpine state with XState machine
- **Event dispatching** - Sends user actions to state machine
- **Real-time pricing display** - Shows calculation results as user edits

## Key Files

| File | Purpose |
|------|---------|
| `src/bridge/AlpineXStateBridge.js` | Connects Alpine.js to XState actor |
| `src/local/createCotizadorActor.local.js` | Local actor factory for development |
| `tests/bridge/AlpineXStateBridge.test.js` | Bridge integration tests |
| `integration_concerns.md` | Phase 3 design specification |

## Documentation

| Document | Purpose |
|----------|---------|
| `integration_concerns.md` | Complete Phase 3 design and architecture |
| `docs/PHASE3_ISSUES_AND_BLOCKERS.md` | Known issues and current blockers |
| `docs/README.md` | Documentation index |

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Alpine.js Component                │
│  x-data="quotationApp()"            │
│  @click="addItem(item)"             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  AlpineXStateBridge (THIS LAYER)    │
│  - Subscribe to snapshots           │
│  - Sync to Alpine properties        │
│  - Dispatch events to actor         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  XState Machine                     │
│  (in claps_codelab_xstate)          │
└─────────────────────────────────────┘
```

### 5. Implementation Planning
| Document | Purpose |
|----------|---------|
| [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) | 4-phase execution plan with tasks and deliverables |
| [TODO](docs/TODO.md) | Granular feature checklist with open questions |

## Known Documentation Gaps

These topics are mentioned across docs but lack dedicated specification:

1. **Tax/IVA Calculation** - v1 hardcodes 19% IVA. v2 schema has `Total_IVA` and `Total_Final` fields but no algorithm spec. Need to decide: always 19%? Configurable? Exempt items?

2. **API Contract** - No request/response schemas defined for the Controller functions. The Frontend-to-Controller interface is undocumented.

3. **Migration Strategy** - IMPLEMENTATION_ROADMAP mentions a migration script (Task 1.5) but doesn't specify: how to map old ITEMS to new ITEM_CATALOGO, how to create REGLA_PRECIO from old pricing columns, or data validation during migration.

4. **Frontend/UI Specification** - No mockups or component specs for the v2 UI. The v1 UI (AlpineJS + sidebar) is in `old/` but v2 UI requirements are scattered across multiple docs.

5. **PDF Generation (v2)** - v1 generates PDFs via Google Docs API. v2 docs mention "professional output" but don't specify the new format, template structure, or how discount/composition lines render.

6. **Open Business Questions** - Listed in [CURRENT_STATE_&_NEXT_TASKS.md](docs/CURRENT_STATE_&_NEXT_TASKS.md) Section 5: pax logic (per-day vs fixed), item category defaults, multi-day cost distribution, and feature priority.

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
