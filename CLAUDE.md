# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

From-scratch rebuild of the SF Lodge Cotizador components — a quotation system for an event catering venue. Tech stack: XState v5.28.0 + Alpine.js v3.12.0 + pure JavaScript ES modules. Only 3 runtime deps: `xstate`, `json-logic-js`, Alpine.js (loaded via CDN in HTML files).

This is the active implementation worktree under `/home/jp/CotizadorLodge/`. The parent repo CLAUDE.md documents the full multi-worktree ecosystem.

## Task Management

Tasks are tracked in `work/tasks/Board.md`. Follow `WORKFLOW.md` for rituals
and conventions.

Key files:
- `work/tasks/Board.md` — Active task board
- `work/pills/README.md` — Context pill format
- `work/drawers/Board.md` — Deferred work

Current tasks:
- `work/tasks/U-1-save.md` — U-1 Save Vertical Slice
- `work/tasks/U-2-editor.md` — U-2 Editor Basic
- `work/tasks/U-3-gas.md` — U-3 GAS Persistence
- `work/tasks/U-4-pdf.md` — U-4 PDF Export

## Commands

```bash
# Start dev server at http://localhost:8090
npm run serve:sandbox

# Run all unit tests (Vitest)
npm test

# Watch mode
npm run test:watch

# Run a single test file
npx vitest run packages/components/item/tests/Item.test.js

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:headed
```

Key sandbox routes:
- `/step-I1-database` — Database browser
- `/step-03b` — Item playground
- `/step-I3-category-01` — Category playground
- `/step-04-quotation` — Quotation playground

## Architecture

### Layer Separation

```
Alpine.js (UI)           <- Reactive HTML templates, user events
     |
XState machine           <- State transitions, lifecycle, orchestration
     |
Domain functions         <- Pure calculations (pricing, quantity, formatting)
     |
Rules engine             <- JSON-Logic rule evaluation per component instance
     |
Database package         <- Schema-driven models, pluggable stores
```

Each layer is independently testable. Domain functions have zero I/O. Database is never accessed from domain logic.

### Repo Layout

```
packages/
  components/         <- UI components (item, category, basket, basket-day, catalog, quotation)
  pricing/            <- Pricing calculation pipeline (pure functions)
  xstate/             <- Shared machine patterns
  database/           <- createDatabase + InMemoryStore, Config_Schema.js, ModelFactory
apps/
  sandbox/            <- Dev/debug HTML playgrounds
  demo/               <- Demo app
  quotation/          <- Quotation flow app
  gas/                <- GAS local shims and adapters
docs/
  ARCHITECTURE/       <- Component architecture, item-component, rules-engine docs
  GUIDES/             <- creating-a-component, testing-components, writing-rules
  PACKAGES/           <- Per-package reference
work/
  tasks/              <- Active tasks (U-1 through U-4)
  drawers/            <- Deferred work and legacy archived plans
  pills/              <- Context pills for task rationale
plan/                 <- Implementation plans (U-series index)
gas/                  <- GAS source files (Code.gs, etc.)
tools/                <- serve-sandbox.mjs, generate_gas_code.mjs
```

### Component Structure

Every component under `packages/components/<name>/` follows:

```
<Component>.js                          <- Main class (lifecycle, public API)
machine/<component>Machine.js           <- XState machine definition
logic/create<Component>Component.js     <- Factory + DOM mounting
domain/
  index.js                              <- Re-exports pure functions
  pricing.js / quantity.js / formatting.js
  rulesEngine/coordinator.js            <- JSON-Logic rule evaluator
ui/<Component>.html                     <- Alpine.js template
tests/<Component>.test.js               <- Vitest unit + integration tests
STATE_CONTRACT.md                       <- Input/output contract (read before implementing)
```

### Item Component (Pattern Reference)

The `Item` class is the most developed component and serves as the canonical pattern.

- Two modes: `'catalog'` (browse) and `'basket'` (order)
- Constructed via `Item.fromDefinition(resolvedDbDef)` (DB-sourced) or `Item.fromSeed(seed)` (persisted)
- All mutations go through public methods: `setMode()`, `receiveContext(patch)`, `setOverride(key, value)`, `clearOverride(key)`, `resetOverrides()`
- Every mutation triggers `calculate()` which pushes updated state to `toDisplayObject()`
- External context (`paxGlobal`, `dia`, `hora`) flows in via `receiveContext()` — Item does not own these

Quantity override precedence: `userOverride ?? containerRuleOutput ?? itemRuleDefault`

### Database Layer

`packages/database/src/Config_Schema.js` is the single source of truth for all table schemas. Field names use Spanish schema format: `ID_*`, `Def_*`, `Nombre`, etc.

- `createDatabase(store)` — factory; accepts any `IStore` implementation
- `ModelFactory.js` — auto-generates models from schema
- `resolveItemDefinition.js` — joins item + categoria + rules into a normalized definition

Item domain functions use camelCase (e.g., `pricingProfile.porPersona`); DB fields are normalized by `fromDefinition()`.

### Rules Engine

Rules are evaluated per component instance. `packages/components/item/domain/rulesEngine/coordinator.js` filters rules by scope (ITEM, CATEGORY, etc.), applies `jsonLogic.apply()` conditions, and returns `{ appliedRules, isAvailable, errors, warnings }`. ERROR rules block availability; WARNING rules are informational.

## Key Conventions

- Field names in schema/DB: Spanish (`ID_Item`, `Def_Requiere_Pax`, `Nombre`)
- Domain/machine identifiers: English camelCase (`pricingKind`, `paxGlobal`, `userSetFields`)
- Private class fields use `#` prefix (`#machine`, `#overrides`, `#userSetFields`)
- `toDisplayObject()` — returns a flat snapshot for Alpine.js; computed fresh on each `calculate()`
- `toSeed()` / `fromSeed()` — serialization round-trip for persistence
- State contracts documented in `STATE_CONTRACT.md` per component — read before implementing
- Major changes go in `changelog.md`; module-local docs updated alongside behavior changes

## Documentation Map

| Question | Where to look |
|----------|--------------|
| Workflow & rituals | `WORKFLOW.md` |
| Task board | `work/tasks/Board.md` |
| Component pattern | `docs/ARCHITECTURE/component-architecture.md` |
| Item specifics | `docs/ARCHITECTURE/item-component.md` |
| Item I/O contract | `packages/components/item/STATE_CONTRACT.md` |
| Rules engine | `docs/ARCHITECTURE/rules-engine-integration.md` |
| Creating a component | `docs/GUIDES/creating-a-component.md` |
| Version history | `changelog.md` |
