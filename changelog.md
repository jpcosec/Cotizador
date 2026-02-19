# Changelog

## [Unreleased]

### 2026-02-19
- build/deps: added root bundler dependency `json-logic-js` so Rollup resolves pricing rules-engine imports without unresolved external warnings.
- xstate/architecture: refactored `packages/xstate/src/QuotationService.js` to remove filesystem + test-seed coupling; it now requires injected store/adapters and keeps xstate as middleware-only orchestration.
- xstate/examples: updated `packages/xstate/examples/examples/create-quotation.js` to inject store explicitly and stop using removed filesystem-based service helpers.
- architecture/testing: moved pricing `mock/` under `packages/pricing/tests/mock/` and updated all imports so runtime source no longer keeps mock scaffolding at package root.
- architecture/database: moved table-oriented in-memory testing store ownership to database via `packages/database/src/stores/TableInMemoryStore.js`; updated pricing/xstate test helpers to import from database and removed `packages/pricing/src/DataStore/InMemoryStore.js`.
- test-config: removed stale root Vitest alias pointing to deleted `packages/pricing/src/DataStore/`.
- frontend+database: added `CatalogService.getPricingReferenceData()` and GAS `getPricingReferenceData()` API; `Stores_App.html` now hydrates XState runtime store from backend reference tables before catalog use and normalizes catalog shape to avoid category/search casing mismatches.
- tooling: added `npm run dev:local` to build and serve local runtime in one command.
- xstate/test-seed: extended `createSeededStore()` with compatibility item IDs (`ITEM_CHINOOK`, `ITEM_COFFEE_BASIC`, `ITEM_ALMUERZO`) to prevent local bundle flows from failing on missing catalog references.
- build/frontend+gas: made `packages/frontend/*.html` + `packages/frontend/appsscript.json` the source for GAS templates via `tools/reset_gas_workspace.mjs`; `npm run build:gas` now deletes and regenerates the entire `gas/` workspace before rebuilding `Bundle_Runtime.html` and `Code.gs`.
- docs/deployment: rewrote `DEPLOYMENT_GUIDE.md` to match current build behavior (`build:gas` reset + regenerate), clarified local testing modes, and removed stale references to outdated local/deploy assumptions.
- frontend: completed Phase 3 TIER 1 integration in `packages/frontend` by fixing catalog-load race timing, setting local actor bootstrap to opt-in, enforcing client selection before add-item, adding machine-state helpers/conditional views, and creating validation/completion UI components for the save flow.
- docs: rewrote `README.md` as a concise integration-worktree guide with current state, IO contract, tech stack, structural differences, and active TODOs.
- pricing: removed Rollup circular-dependency warnings by extracting pricing recalculation primitives to `packages/pricing/src/Pricing/recalculation.js` and updating operations to import from that module.
- docs: moved root-level operational documentation into `docs/workspace/root_migration/` and centralized references in `docs/README.md`.
- docs: added runtime reality-check at `docs/ACTIVE/status-reality-2026-02-19.md` (GAS deployed, machine usage unverified, DB seeding/adaptation pending, missing HTML app entries).
- database: routed GAS service CRUD flows through the generic model/store layer via `GasSheetStore` + `ModelFactory`, added shared runtime model cache (`services/databaseRuntime.js`), and updated GAS code generation to embed the generic routing layer.
- database: removed MVP table filtering from GAS schema loading/generation, so initialization and CSV migration now work against the full `DATA_SCHEMA`.
- xstate: removed hardcoded table-to-primary-key mapping in `actions` adapter and now derive table metadata dynamically from `DATA_SCHEMA`; regenerated GAS runtime bundle.
- database: added `parseV1CsvToSchemaRows` to transform legacy `Cotizador - CLIENTES.csv` and `Cotizador - Items.csv` into the current schema shape (including `PERFILES_PRECIO` + category defaults), and updated `seedFromV1Csv` to seed all available schema tables from the parsed output.
- data: generated `data/init.parsed.v1.json` with legacy CSVs normalized to current schema table payloads for initialization workflows.
- data: replaced bulky parsed JSON with per-table initialization CSVs under `data/init/` and removed `data/init.parsed.v1.json`.
- gas/database: wired initializer wrappers to use bundled `data/init/*.csv` map (`INIT_CSV_DATA_MAP`) by default in GAS-generated `Code.gs`; added `initializeSheetDbFromInitCsv()` explicit entrypoint.

## [0.2.0] - 2026-02-17 — Event-Driven Architecture Rewrite

### Changed
- **Full rewrite** from linear pipeline to event-driven architecture
- **Pricing modules** (`src/Pricing/`) — independent pure functions ported from pipeline stages
- **Rules engine** (`src/RulesEngine/`) — pluggable action registry replacing monolithic switch
- **Config_Schema** — added `Hook` column and `SET_DEFAULT` action type to REGLAS_NEGOCIO

### Added
- `src/Pricing/` — expand, defaults, pricing, adjustments, manual, taxes (pure, no framework dependency)
- `src/RulesEngine/` — registry pattern with self-registering action handlers (9 actions)
- `src/Core/` — AbstractEvent (lifecycle hooks), EventBus, AbstractScenario, QuotationState
- `src/Events/quotation/` — 12 event orchestrators (init, basket, finalization steps)
- `src/Scenarios/Quotation.js` — 3-step scenario (init → basket → finalization)
- 117 tests across 20 files (unit + integration), all passing
- Numerical parity verified against v0.1.0 (same dollar amounts)
- Event history / audit log via EventBus
- Step gating — events validated against current scenario step

### Removed
- `src/Pipeline/` — replaced by `src/Pricing/` + event orchestrators
- Old pipeline tests (replaced by new unit/pricing/ and unit/events/ tests)

### Architecture note
State management (events, scenarios, bus) will migrate to `claps_codelab_xstate`. The event layer here serves as a reference/mock implementation.

---

## [0.1.0] - 2026-02-17 — Pricing Engine Core

### Added
- **Project setup:** Node.js + Vitest (ES modules, `test` and `test:watch` scripts)
- **InMemoryStore** (`src/DataStore/InMemoryStore.js`): table-based in-memory store with `seed`, `insert`, `findById`, `findAll`, `findByFK`, `all`
- **Test fixtures** from real SF Lodge Excel catalog (20+ items, 7 categories, 21 pricing profiles)
- **Pipeline stages:**
  - `01_context.js` — create quotation context, update pax
  - `02_expand.js` — recursive composition/pack expansion
  - `03_defaults.js` — Q/T/P dimension resolution with inheritance chain
  - `04_pricing.js` — universal formula `Neto = Base + P×Cp + T×Ct + Q×Cq`
  - `05_adjustments.js` — automatic line/global adjustments (overtime surcharge)
  - `06_manual_adjustments.js` — user overrides (price override, line discount)
  - `07_taxes.js` — tax calculation (IVA 19%)
  - `rules_engine.js` — shared condition evaluator + action executor
  - `pipeline.js` — full recalculation orchestrator
  - `add_item.js` — user-facing add-to-cart with expand→defaults→price flow
- **71 tests** across 13 files (unit + integration), all passing
- **Plan docs** (`docs/plan/step_01.md` through `step_14.md`)

---

## [Unreleased] - v2 Design Phase

### 2026-02-18
- **XState upgraded from v4.38 to v5.x** across all documentation:
  - Updated version references in README.md, TECHNICAL_DEPENDENCIES_AND_MOCKING.md, worktrees.md
  - Fixed state machine definition in worktrees.md: replaced non-standard `regions: [...]` array with correct v5 `type: 'parallel', states: {...}` syntax
  - Updated bundle size estimates (v5 is smaller: ~14-15KB gzipped vs v4's ~16.4KB)
  - Updated all package.json templates from `"xstate": "^4.38.0"` to `"xstate": "^5.0.0"`
  - Added "Why XState v5?" section to README.md
  - Verified all code examples already use v5 API (`createActor()`, `createMachine()`)

### 2026-02-16
- **db_docs.md updated to v2.3**: Flexible tax system
  - New table 1.7 REGLAS_IMPUESTO (IVA, ILA, Exento, etc.)
  - ITEM_CATALOGO: added `ID_Impuesto` FK
  - COTIZACIONES: added `Total_Impuestos_Adic`, `Desglose_Impuestos` JSON
  - LINEA_DETALLE: added `Impuesto_Monto`, `Impuesto_Tasa_Snapshot`, `Es_Descuento`, `ID_Regla_Descuento`
  - REGLAS_DESCUENTO: added `Origen`, `Permite_Editar_Valor`, `Requiere_Aprobacion`
  - RESTRICCION: field renames (`ID_Item_A` → `ID_Item_Trigger`, `ID_Item_B` → `ID_Item_Target`)
  - COMPOSICION renamed to COMPOSICION_KIT
  - COTIZACIONES Estado: added `Pendiente_Aprobacion`
  - Relationships updated (now 9 relationships across 10 entities)
- Added discount and bundles engine design document (v2.1)
- Added quotation pipeline flow document (4-phase assembly line)
- Created README.md with documentation guide and known gaps
- Created changelog.md
- Removed duplicate `docs/data` file (was identical to `docs/db_docs.md`)
- Fixed broken references in IMPLEMENTATION_ROADMAP.md (removed nonexistent mermaid/plan files, linked actual docs)

### 2026-02-14
- Added data dictionary (db_docs.md) - v2 schema with 7 entities
- Added composition logic document - recursive kit/bundle system
- Added pricing and constraints document - universal formula + constraint validator
- Added technical design document - modular architecture with repository pattern

### 2026-02-12
- Added implementation roadmap - 4-phase execution plan
- Added TODO list - granular feature checklist
- Added current state assessment - gap analysis between v1 and v2
- Moved v1 source code to `old/` directory
