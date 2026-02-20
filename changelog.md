# Changelog

## [Unreleased]

### 2026-02-20 (session 4 — UI testing & fixes)
- fix/local-seed: seeded 3 clients (CLI_CORP, CLI_DEMO, CLI_TEST) in `store_factory.js` so client search works out-of-the-box in local preview.
- fix/local-seed: `bundling/createCotizadorActor.js` now populates `window.localClientes`, `window.localCatalogItems`, and `window.localPricingReferenceData` from the seeded store using the store's `all()` API; the GAS shim can now serve local data for client search and catalog.
- fix/item-name: added `Nombre` field to `baseLine` in `addItem` action so the bridge can display the human-readable item name instead of the `ID_Item` string.
- fix/bridge: updated `mapLineasToCarrito` in `AlpineXStateBridge.js` and `Bridge_AlpineXState.html` to check `linea.Nombre` as fallback before `linea.ID_Item`.
- fix/accordion: removed `x-collapse` directive from `.accordion-body` in `Components_Timeline.html` — the Alpine collapse plugin is not loaded, causing `x-show` to never update the display; body now expands/collapses correctly on header click.

### 2026-02-20 (session 3)
- docs: reorganized documentation into `docs/` (stable technical) and `plan/` (planning/status/roadmap); deleted 3 stale status files (`CONSOLIDATION_SUMMARY.md`, `DEPLOYMENT_STATUS.md`, `PHASE3_COMPLETION_SUMMARY.md`), moved 7 phase/planning files to `plan/`, cleaned empty `docs/PHASE3/` dir.
- frontend/debug: added fixed-position XState debug badge to GAS sidebar (`packages/frontend/Index.html`) showing machine state path, pax, item count, and subtotal/total; green `● XState` when bridge is active, yellow `○ fallback` otherwise; click to expand details panel.
- tooling: replaced custom `LOCAL_DEPLOYMENT` harness with real GAS preview server — `npm run dev` (build + serve) and `npm run serve:gas` (serve only) via `tools/serve-gas.mjs` which recursively processes `<?!= include('Name'); ?>` GAS template directives from `gas/` and serves at `http://localhost:8082`. Zero custom shim divergence from production.
- tooling: deleted `LOCAL_DEPLOYMENT.html` and `LOCAL_DEPLOYMENT_SIMPLE.html` (custom test harnesses replaced by the real GAS preview workflow).
- docs/deployment: created `docs/DEPLOYMENT/local-development.md` as the authoritative local dev guide; deleted stale `local-deployment.md`.

### 2026-02-20 (session 2)
- pricing/rules: added 31 Vitest tests for `humanize.js` covering `humanizeCondition` (15 cases: all comparators, AND/OR/NOT/in, null, JSON string, fallback), `humanizePayload` (12 cases: all 9 action types + unknown + JSON string), and `humanizeRule` (3 cases: compound condition, always-true, JSON string fields).
- pricing/rules: exported `humanizeCondition`, `humanizePayload`, `humanizeRule` from `RulesEngine.js` so consumers can import them from the same entry point.
- docs/architecture: updated `docs/ARCHITECTURE/rules-engine.md` with a new "Human-Readable Rule Display" section documenting all three humanize functions with input/output examples.
- docs/architecture: updated `docs/ARCHITECTURE/ui-machine-context-sync-plan.md` status header from "proposal only (not implemented)" to "IMPLEMENTED (Feb 2026)" with references to the actual implementation files.
- build: regenerated `dist/quotation-engine.iife.js` (198KB, 46.3KB gzipped); verified clean build.

### 2026-02-20
- xstate/sync-fix: added `UPDATE_QUOTATION_SETTINGS` event in `quotation.basket.on` with `updateQuotationSettings` action that persists `paxGlobal`, `Pax_Global`, `Fecha_Evento`, and `Duracion_Dias` into machine context; default policy `recalculateExistingLines=false` leaves existing line totals untouched.
- xstate/sync-fix: extended `addItem` to store `overrides.Dia` and `overrides.Hora` on the created basket line; extended `updateItem` to accept and persist `overrides.Dia` and `overrides.Hora` without disturbing other line fields.
- frontend/sync-fix: added `syncQuotationSettingsToMachine()` in `Stores_App.html` to emit `UPDATE_QUOTATION_SETTINGS` with current UI values; called defensively before `ADD_ITEM` and wired to `fechaInicio`/`duracionDias` `@change` in `Components_Timeline.html`.
- frontend/sync-fix: added `actualizarHora(idx, hora)` in `Stores_App.html` and wired the timeline time input `@change` to it, routing hour edits through `UPDATE_ITEM` so line `Hora` is persisted in machine context.
- xstate/tests: added `tests/integration/quotation_settings_sync.test.js` with 14 tests covering paxGlobal/fechaEvento/duracionDias persistence across snapshots, Dia/Hora round-trips via ADD_ITEM/UPDATE_ITEM, survival through add/remove cycles, and recalculation policy (false=stable, true=recomputed).

### 2026-02-19
- frontend/timeline-layout: redesigned expanded timeline item body into a compact 3-column layout (controls, comments, icon-only actions), added per-line copy actions (duplicate + copy to next day), and added global "copy day to next day" action in the timeline toolbar.
- docs/state-sync: added `docs/ARCHITECTURE/ui-machine-context-sync-plan.md` with root-cause analysis and implementation proposal to persist quotation settings (`paxGlobal`, `fechaInicio`, `duracionDias`) and line scheduling fields (`Dia`, `Hora`) into XState context.
- frontend/ux: redesigned client selector modal with keyboard-friendly result navigation and preview panel, added dedicated quotations browser modal with filters/actions, replaced prompt-based load flow, and wired quotation list loading from machine cache/store in `Stores_App.html`.
- database/init: updated `cleanAllTables()` to delete/recreate only schema-managed tabs (matching table names) and preserve non-schema spreadsheet tabs; keeps single-sheet safety behavior by clearing when required.
- data/rules-migration: implemented automatic extraction in `packages/database/src/csvSeed.js` from legacy `Cotizador - Items.csv` to generated `REGLAS_NEGOCIO` seed rows (min/max pax `ERROR` constraints + hybrid price expression `WARNING` metadata), and regenerated `data/init/REGLAS_NEGOCIO.csv` with valid JSON payload/conditions.
- docs/data-migration: added `docs/ARCHITECTURE/legacy-items-rule-migration-matrix.md` with extraction patterns from `data/Cotizador - Items.csv` and mapping to v3 schema/engines (`PERFILES_PRECIO`, `ITEM_CATALOGO`, `REGLAS_NEGOCIO`, `RESTRICCION_UI`).
- frontend/comments+dataset: surfaced `ITEM_CATALOGO.Default_Glosa` in database viewer and sidebar hover tooltip, prefilled new basket lines with item comment, added editable line comment textarea in timeline, and wired comment edits through `UPDATE_ITEM` so `Comentarios` is updated in line state for `LINEA_DETALLE` persistence.
- data/schema: restored item-level description field by adding `ITEM_CATALOGO.Default_Glosa` in `src/Config/Config_Schema.js`, mapping legacy `Cotizador - Items.csv` column `Detalle de servicios.` in `packages/database/src/csvSeed.js`, and updating `data/init/ITEM_CATALOGO.csv` to include/preserve item comments.
- docs/architecture: added `docs/ARCHITECTURE/database-logic.md` consolidating SF Lodge v3.0 data architecture, entity ecosystem, defaults cascade, core engines, and end-to-end quotation calculation pipeline.
- frontend/database-viewer: added `Components_DatabaseViewer.html` with tabbed read-only views for `ITEM_CATALOGO`, `CATEGORIAS`, `COMPOSICION_KIT`, and `REGLAS_NEGOCIO`; wired open/close/load/filter helpers in `Stores_App.html` using `getPricingReferenceData()` and added quick access button in timeline config toolbar.
- frontend/hardening: added defensive `x-for` array guards, stable key fallbacks, and normalized display fallbacks in sidebar/timeline/modal/validation components to prevent Alpine `:key` undefined loops and `Cannot read properties of undefined (reading 'after')` crashes.
- frontend/gas-fix: included `Bundle_Runtime` in `packages/frontend/Index.html` so GAS runtime exposes `createCotizadorActor`; hardened `Components_Sidebar.html` item rendering keys/fields to support normalized catalog shape and prevent Alpine x-for key/undefined crashes.
- docs: refreshed `README.md`, `docs/README.md`, and `PLAN.md` to reflect merged-repo reality (active build pipeline, current priorities, valid doc links, and current architecture boundaries).
- docs/subfolders: refreshed `docs/ARCHITECTURE/state-machine.md`, `docs/PACKAGES/{database,pricing,xstate,frontend}.md`, and `docs/DEPLOYMENT/LOCAL_vs_GAS.md` to remove stale worktree-era assumptions and align with current merged repository architecture.
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
