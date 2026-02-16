# SF Lodge Cotizador

Quotation system for SF Lodge (events and catering venue). Built on Google Apps Script with Google Sheets as the data layer.

## Project Status

**Branch `v2`** - Complete architectural redesign in progress. The v1 implementation lives in `old/` for reference. No v2 code has been written yet; the `docs/` folder contains the full design specification.

### What v1 Has (old/)
- 4 tables: CLIENTES, COTIZACIONES, DETALLE_COTIZACION, ITEMS
- Basic CRUD via SheetDB micro-ORM
- Simple price lookup (hardcoded price columns)
- PDF generation via Google Docs API
- AlpineJS frontend with sidebar UI

### What v2 Adds (designed, not yet implemented)
- Rule-based pricing engine (universal formula)
- Recursive item composition (bundles, kits, menus)
- Business constraint validation (min/max pax, dependencies, exclusions)
- Automatic discount engine (pattern-based, negative lines)
- 4-phase processing pipeline: Expansion > Valuation > Adjustment > Audit
- Repository pattern with in-memory caching
- Multi-day event support
- Audit trail (history tracking)

## Documentation Guide

Read in this order to understand the full system:

### 1. Current State Assessment
| Document | Purpose |
|----------|---------|
| [Current State & Next Tasks](docs/CURRENT_STATE_&_NEXT_TASKS.md) | Gap analysis between v1 and v2, proposed execution phases |

### 2. Architecture & Data Model
| Document | Purpose |
|----------|---------|
| [Technical Design: Modular Architecture](docs/technical-design-v2-modular-architecture.md) | Repository pattern, caching strategy, file structure |
| [Data Dictionary](docs/db_docs.md) | All v2 entities: master data and transactional tables |

### 3. Business Logic (by pipeline phase)
| Document | Pipeline Phase | Purpose |
|----------|----------------|---------|
| [Composition Logic](docs/composition_logic.md) | Phase 1: Expansion | Recursive kit/bundle/menu decomposition |
| [Pricing & Constraints](docs/PRICING_AND_CONSTRAINTS_v2.md) | Phase 2: Valuation + Phase 4: Audit | Universal pricing formula + constraint validator |
| [Discount & Bundles Engine](docs/discount-bundles-engine-design-v2-1.md) | Phase 3: Adjustment | Rule-based discount system with negative lines |

### 4. Process Flow
| Document | Purpose |
|----------|---------|
| [Quotation Pipeline Flow](docs/quotation-pipeline-flow.md) | Complete 4-phase assembly line with worked examples |

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
