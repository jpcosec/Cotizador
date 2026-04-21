# Changelog

## [Unreleased]

### 2026-04-21 (runtime redesign desk reset and validation gate)
- Added the runtime redesign task track to `desk/tasks/` around `GenericUnit`/`View`/`Container`/`Item` adoption.
- Cleared obsolete desk task files that no longer match the runtime-first migration path.
- Added context pills for runtime hierarchy, projection-first shell migration, and the final `user_flow.json` validation gate.
- Recorded `user_flow.json` + `tools/userFlowRunner.mjs` as the final redesign validation step after rebuild.

### 2026-04-21 (runtime redesign completion)
- Completed the runtime-first redesign for the quotation flow shell and playground stack.
- Added and integrated the generic runtime layer under `src/components/common/base/runtime/`, including shared signals, `GenericItemBase`, `GenericContainerBase`, and `GenericViewBase` wiring.
- Added `gas/scripts/QuotationFlowRuntimeView.js` and migrated quotation shell synchronization in `gas/scripts/createQuotationFlowComponent.js` to consume runtime projections safely.
- Fixed the GAS preview shell recursion issue caused by exposing `runtimeView` directly to Alpine, and fixed quotation save completion rendering so the completed state survives runtime synchronization.
- Regenerated runtime artifacts in `dist/` and `gas/`.
- Verified completion with:
  - `npm test`
  - `npm run build`
  - `node tools/userFlowRunner.mjs`
- Captured final E2E evidence in `auto_user_test/`, including a successful `report.json` for the full quotation lifecycle.

### 2026-04-17 (feature: database editors and rules management)
- **V-08: Pack Editor**: Created a specialized UI in `apps/sandbox/routes/pack-editor.html` to manage kit compositions. Integrated with `PersistencePort` to support saving kit components to local and remote storage.
- **V-09: Rules Visualization**: Enhanced the business rules popover in the basket UI. Users can now see the rule name, UI message, and the technical condition (JavaScript) directly in the popover.
- **V-10: Rules Creator**: Implemented a comprehensive rules editor in `apps/sandbox/routes/rules-editor.html`. Extended `PersistencePort`, `LocalPersistenceAdapter`, and `RemotePersistenceAdapter` with `saveRules` to support persistence.

### 2026-04-17 (feature: export tools and UI enhancements)
- **U-4: PDF Export**: Implemented browser-based PDF generation using `window.print()`. Created `apps/quotation/components/QuotationPrintStyles.html` with specialized `@media print` rules to hide UI elements and format the validation table for A4 paper.
- **V-06: Excel Export**: Added CSV export functionality via `apps/quotation/services/excelService.js`. Integrated "Export to Excel" buttons in the validation and completed stages to download quotation details and totals.
- **V-07: Detail Hover**: Enhanced the catalog hover experience in `playgroundItemSections.js`. The hover popover now includes both the item description and a human-readable "Política de Inicio" (initialization policy).

### 2026-04-17 (feature: kit and group logic)
- **V-04: Groups / Packs Logic**: Implemented full support for kit expansion and group management.
  - **Database & Resolution**: Updated `resolveItemDefinition.js` to fetch recursive children from `COMPOSICION_KIT`. Modified `Item.js` to handle child definitions and `ABSORBIDO` pricing logic.
  - **Basket State**: Updated `basketDayMachine.js` to support recursive kit expansion into the basket with `groupId` and `parentId` linking. Implemented atomic removal (removing parent removes children).
  - **Runtime & Cloning**: Updated `createQuotationInternalRuntime.js` to propagate overrides (like time and day) from parents to children and support group-aware cloning between days.
  - **Pricing & Quantity**: Implemented kit multiplier propagation in `quantity.js` and `ABSORBIDO` pricing ($0 total for child items) in `Item.js`.
  - **UI Implementation**: Updated basket rendering in `playgroundItemSections.js` to visually group children under parents with indentation and "Included" badges for absorbed items.
  - **Validation**: Added a "Full Day Pack" test kit to `localInitTables.js` and verified behavior with a new test suite in `packages/components/basket-day/tests/kitExpansion.test.js`.

### 2026-04-16 (feature: item comments, time adjustment, and duration resize)
- **V-01: Item Comments**: Added `setItemComment(entryId, text)` to the quotation runtime and flow component. Updated the basket card UI to bind the comment textarea to this new action, using the `comentarios` override key.
- **V-02: Time Adjustment (Move)**: Added `setItemTime(entryId, startTime)` to the quotation runtime and flow component. Updated the basket card time input to bind to this action, using the `hora` override key.
- **V-03: Time Adjustment (Resize)**: Added `setItemDuration(entryId, minutes)` to the quotation runtime and flow component. Updated the basket card duration input to bind to this action, using the `duracionMin` override key.
- **Validation**: Added `add_item_comment`, `adjust_item_time`, and `resize_item_duration` steps to `user_flow.json`. Verified the full flow with `tools/userFlowRunner.mjs`.

### 2026-04-15 (feature: U-2 editor baseline with timeline interactions)
- **Phase 01: Gesture Matrix**: Created `plan/U-2-editor/gesture_event_matrix.md` to define all editor interactions (drag, drop, move, resize), tagging them as `existing`, `to-add`, or `deferred`.
- **Phase 02: Timeline Grid**: Integrated a timeline UI layer into the quotation view (`apps/quotation/playground/QuotationFlowInternal.html`). Dragging an item from the catalog and dropping it on the timeline now adds it to the basket with the correct start time (`hora`).
- **Phase 03: Move and Resize**: Implemented move and resize interactions for items on the timeline. Users can now drag existing items to change their start time and use a resize handle to adjust their duration (`duracionMin`). All interactions are wired to the application runtime.

### 2026-04-15 (quality: e2e testbed hardening and docs review)
- Deferred U-3 GAS persistence task to `work/drawers/` due to account setup prerequisites.
- Added U-5 Source Code Quality Check task to audit the codebase for functionality and documentation issues.
- Ran `npm test` (all 592 unit tests passed) and `npm run test:e2e`.
- Diagnosed and fixed Playwright E2E test failures:
  - Ran `npx playwright install` to download required browser binaries.
  - Isolated `gas-preview.smoke.spec.js` from the default `playwright.config.mjs` to prevent server conflicts between sandbox and GAS environments.
  - Confirmed both `npm run test:e2e` (3 tests) and `npm run test:e2e:gas` (6 tests) now pass cleanly.
- Reviewed documentation and confirmed `pi`'s extension mechanism is the correct way to integrate tools like an MCP, but no such extension is currently installed.
- Marked U-5 as complete.

### 2026-03-21 (local disk persistence for full GAS app development)
- Added a disk-backed local GAS development mode via `tools/serve-local.mjs`.
- Added `tools/localPersistenceStore.js` to initialize `data/db.json` from CSV seed data, persist save operations, and serve `google.script.run` methods from a local JSON database.
- Updated `apps/gas/Local_GAS_Shim.html` to proxy `google.script.run` calls to the local server with `fetch`, preserving the GAS call shape while using local disk persistence.
- Updated `package.json` so `npm run dev:gas` now serves the integrated GAS app through the local disk-backed server.
- Marked U-1 save as completed in `plan/implementation-status.json`.
- Removed duplicate client seed rows from `data/init/CLIENTES.csv` and added a seed test to guard against repeated business identities.

### 2026-03-21 (home quotation search by client, pax and date)
- Added quotation search support across the persistence boundary:
  - `PersistencePort.listQuotations()`
  - local implementation in `packages/database/src/persistence/LocalPersistenceAdapter.js`
  - GAS normalization in `packages/database/src/persistence/GasSheetAdapter.js`
- Extended the quotation runtime API in `apps/quotation/state/createPersistedQuotationRuntime.js` with `listQuotations()` so UI search stays adapter-agnostic.
- Updated Home/Browse quotation UI to include a functional `Buscar cotizacion` flow modeled after the existing client selector:
  - modal search from `apps/quotation/playground/QuotationFlowInternal.html`
  - wired in both `bundling/createQuotationFlowComponent.js` and `apps/quotation/playground/mountQuotationFlow.js`
  - each result shows client name, pax, quotation date, and ID
  - selecting a result loads the quotation directly.
- Added search support to the local GAS shim and generated GAS backend contract:
  - `apps/gas/Local_GAS_Shim.html`
  - `tools/generate_gas_code.mjs`
- Added/updated tests for local adapter search, GAS adapter normalization, runtime passthrough, UI component behavior, and local GAS shim listing.
- Hid sandbox-only database editing controls from GAS preview/product runtime while keeping them available in the local sandbox route.
- Split runtime ownership more explicitly:
  - `apps/gas/Quotation_App_Source.html` is now the GAS app shell source,
  - `tools/reset_gas_workspace.mjs` builds GAS from that source instead of reusing the sandbox quotation template,
  - `apps/gas/Stores_QuotationApp.html` now passes explicit GAS capabilities into the bundled app component.
- Removed `Local_GAS_Shim` from the real GAS app template; it is now injected only by `tools/serve-gas.mjs` for local preview.
- Added `docs/ARCHITECTURE/runtime-environments.md` to define sandbox vs GAS responsibilities and boundary rules.

### 2026-03-21 (phase 03 consolidation: save/load as real quotation runtime states)
- Refactored `apps/quotation/state/createPersistedQuotationRuntime.js` so the quotation flow is now governed by an internal XState machine instead of `stageOverride` patching.
- Added explicit async runtime stages for persistence orchestration:
  - `validation -> saving -> completed` for successful save,
  - `* -> loadingQuotation -> basket` for successful load,
  - save/load errors return to the appropriate editable stage while preserving visible error state.
- Kept layer boundaries intact:
  - Alpine/UI still calls runtime methods only,
  - `serializeQuotation()` remains inside runtime orchestration,
  - adapters stay behind `PersistencePort`.
- Expanded runtime coverage in `apps/quotation/state/createPersistedQuotationRuntime.test.js` to assert the intermediate `saving` and `loadingQuotation` states.
- Updated active U-1 save plan docs to reflect the implemented runtime ownership and remaining real-GAS validation work:
  - `plan/U-1-save/phases/03_runtime_wiring.md`
  - `plan/U-1-save/phases/README.md`
  - `plan/U-1-save/objectives.md`
  - `plan/implementation-status.json`

### 2026-03-17 (entry-page database access + hover layering + save flow hardening)
- Added explicit database editing entrypoint on quotation home screen (`Edit Database`) in `apps/quotation/playground/QuotationFlowInternal.html`, wired through:
  - `bundling/createQuotationFlowComponent.js`
  - `apps/quotation/playground/mountQuotationFlow.js`
- Added environment-aware database editor URL resolution:
  - local sandbox/GAS preview are routed to the DB editor,
  - unsupported runtimes now show a clear inline error instead of opening a dead route.
- Added direct basket-stage save action (`Save Quotation`) and kept validation review path intact.
- Hardened `saveQuotation()` in both runtime wrappers to wait until stage becomes `validation` before calling `confirmSave()`, preventing stage-transition race failures in preview/runtime wiring.
- Enforced runtime boundary: no cross-routing between GAS preview and sandbox routes; `Edit Database` remains sandbox-only and unavailable in GAS preview/production runtimes.
- Fixed hover layering/popover visibility issues in quotation UI by:
  - enabling visible overflow on basket accordion container,
  - adding explicit `glosa-popover` overlay styling and z-index behavior,
  - preserving popover readability over neighboring cards/panels.
- Fixed local GAS shim method-chain contract in `apps/gas/Local_GAS_Shim.html` so `withSuccessHandler()/withFailureHandler()` continue returning proxy-aware RPC methods (`guardar/cargar/getReferenceData`) correctly.
- Updated local GAS shim to expose `google.script.run` as a fresh caller per access (getter-based), avoiding callback cross-talk under overlapping RPC calls.
- Added regression tests for the new safeguards:
  - `apps/gas/Local_GAS_Shim.test.js` validates fresh-caller semantics and concurrent callback isolation.
  - `bundling/createQuotationFlowComponent.test.js` validates DB-editor unavailability handling and explicit URL override behavior.
- Regenerated artifacts after changes:
  - `dist/quotation-engine.iife.js` + map
  - `gas/Quotation_App.html`, `gas/Bundle_Runtime.html`, `gas/Code.gs`, `gas/Local_GAS_Shim.html`
- Verification:
  - Vitest: `58` files passed, `572` tests passed, `1` skipped.
  - Playwright (sandbox + GAS preview):
    - database editor entrypoint reachable from home,
    - quotation save completes and returns ID,
    - saved quotation reload by ID succeeds,
    - rules popover is visible and not clipped by ancestor containers.

### 2026-03-17 (runtime reference bootstrap + catalog normalization + timeline controls)
- Added runtime reinitialization support in `apps/quotation/state/createPersistedQuotationRuntime.js` to allow safe runtime rebuilds while preserving current settings.
- Added optional remote reference-data bootstrap in `bundling/createQuotationRuntime.js` and async startup wiring in `bundling/createQuotationFlowComponent.js`:
  - runtime now attempts `persistencePort.loadReferenceData()` when available,
  - falls back safely to bundled seed tables when reference data is unavailable.
- Extended persistence adapters with reference-data loading:
  - `packages/database/src/persistence/GasSheetAdapter.js` now supports `getReferenceDataV2 -> getReferenceData` fallback,
  - `packages/database/src/persistence/LocalPersistenceAdapter.js` now exposes deterministic seed entries from local models,
  - `packages/database/src/persistence/PersistencePort.js` includes `loadReferenceData()` contract method.
- Added GAS backend reference-data endpoints in `tools/generate_gas_code.mjs` output (`getReferenceData`, `getReferenceDataV2`) to provide seed entries for runtime bootstrap.
- Updated local GAS shim (`apps/gas/Local_GAS_Shim.html`) with reference-data methods for contract parity.
- Hardened basket shipping against unknown item IDs in `packages/components/basket-day/machine/basketDayMachine.js` to avoid crashes from invalid/missing item references.
- Normalized catalog entry projections in `apps/quotation/state/createQuotationInternalRuntime.js` and `packages/components/category/machine/categoryMachine.js` to keep stable `id/item/nombre/categoria/categoriaId` fields.
- Moved quotation action controls (`Copy Day`, `Validate`) above basket cards and introduced a timeline control bar in `apps/quotation/playground/QuotationFlowInternal.html` for closer legacy-aligned interaction flow.
- Added/updated tests:
  - `apps/quotation/state/createPersistedQuotationRuntime.test.js`
  - `packages/database/src/persistence/LocalPersistenceAdapter.test.js`
  - `packages/database/src/persistence/GasSheetAdapter.test.js`
  - `packages/components/basket-day/tests/basketDayMachine.test.js`

### 2026-03-15 (docs: legacy UI recovery policy + planning rule scope)
- Added `docs/ARCHITECTURE/legacy-ui-recovery.md` to formalize legacy parity policy with explicit scope split:
  - backend/service compatibility remains migration-first,
  - frontend implementation remains rebuild-native (Alpine/XState/domain/adapters).
- Added `docs/ARCHITECTURE/design-principles.md` as the canonical cross-cutting principles document for layer boundaries, mutation ownership, adapter-first I/O, testability, and documentation discipline.
- Deepened and documented architecture principles for UI recovery work (mutation boundary, adapter-first integration, screen/state/event discipline, no backend knowledge in templates).
- Updated `plan/README.md` Planning Rule to clarify that migration-first applies to backend contracts, while UI implementation must follow rebuild component architecture.
- Updated `docs/README.md` Architecture index with the new policy document.

### 2026-03-13 (U-1 save phases 01-02: contract, serializer, persistence boundary)
- Expanded persistence contract documentation in `packages/database/src/persistence/SavePayload.md` with:
  - extracted legacy save/load semantics from `claps_codelab` (`guardarCotizacion`, `cargarCotizacion`, save-first PDF dependency),
  - rebuild mapping from runtime snapshot to transactional tables (`COTIZACIONES`, `LINEA_DETALLE`),
  - normalized `PersistencePort` success/error response contract,
  - pluggable ID strategy policy contract.
- Refactored `packages/database/src/persistence/serializeQuotation.js` into a deterministic pure mapper with:
  - explicit normalization helpers,
  - day/order-stable line flattening,
  - injectable ID policy (`createDefaultIdPolicy` exported),
  - stricter validation for required client identity.
- Hardened persistence boundary implementation:
  - added normalized result helpers and error codes in `packages/database/src/persistence/PersistencePort.js`,
  - updated `packages/database/src/persistence/LocalPersistenceAdapter.js` to validate inputs, upsert quotation headers, replace prior detail lines on re-save, and normalize save/load responses.
- Added test coverage for U-1 phases 01-02 artifacts:
  - `packages/database/src/persistence/serializeQuotation.test.js`,
  - `packages/database/src/persistence/LocalPersistenceAdapter.test.js`.
- Exported persistence modules from `packages/database/index.js` for runtime/adapters integration in upcoming U-1 phase 03.

### 2026-03-13 (U-1 phase 03 + U-3 GAS wiring)
- Added persisted runtime orchestration wrapper `apps/quotation/state/createPersistedQuotationRuntime.js` that keeps quotation runtime storage-agnostic while providing:
  - `confirmSave()` and `loadQuotation(id)` through `PersistencePort`,
  - persisted state projection (`isSaving`, `isLoading`, `error`, `quotationId`, `lastLoadedId`),
  - completed-stage transition after successful confirm save.
- Wired persistence-aware runtime into both local playground and bundle runtime factories:
  - `apps/quotation/playground/mountQuotationFlow.js`
  - `bundling/createQuotationRuntime.js`
  - `bundling/createQuotationFlowComponent.js`
- Updated quotation flow UI shell `apps/quotation/playground/QuotationFlowInternal.html` with:
  - load-by-ID controls,
  - active `Confirm & Save` action,
  - save/load error visibility,
  - completed screen with saved quotation ID.
- Implemented GAS persistence adapter `packages/database/src/persistence/GasSheetAdapter.js` with method fallback (`guardar/cargar` v2 -> legacy) and normalized boundary mapping.
- Extended local GAS shim `apps/gas/Local_GAS_Shim.html` to simulate save/load contract parity (`guardarCotizacion*`, `cargarCotizacion*`) with in-memory data.
- Implemented generated GAS server contract in `tools/generate_gas_code.mjs` (output `gas/Code.gs`) including:
  - router-level save/load functions with legacy-compatible names,
  - spreadsheet resolution (`COTIZADOR_SHEET_ID` script property or active spreadsheet fallback),
  - upsert header + replace detail persistence behavior for `COTIZACIONES` and `LINEA_DETALLE`.
- Added tests:
  - `apps/quotation/state/createPersistedQuotationRuntime.test.js`
  - `packages/database/src/persistence/GasSheetAdapter.test.js`

### 2026-03-11 (plan: U-series realigned to legacy implementation)
- Reworked urgent plans to explicitly start from `claps_codelab` decisions and existing code for save/load/PDF flow.
- Removed inline review comments from active U-series documents and converted them into concrete constraints and baseline references.
- Completed missing phase documents for:
  - `plan/U-2-editor/phases/01_gesture_matrix.md`, `02_timeline_grid.md`, `03_move_and_resize.md`
  - `plan/U-3-gas/phases/01_gas_server.md`, `02_gas_adapter.md`, `03_integration.md`
  - `plan/U-4-pdf/phases/01_pdf_template.md`, `02_gas_server_pdf.md`, `03_ui_wiring.md`
- Added `plan/U-2-editor/gesture_event_matrix.md` to anchor drag interactions to existing runtime events.
- Updated `plan/README.md` and `plan/implementation-status.json` to reflect migration-first strategy and revised phase focus.

### 2026-03-11 (plan: urgent track U-series for save/editor/GAS/PDF)
- Moved legacy plans (I-1, I-3, III-1, 0-cleanup) to `plan/legacy/`.
- Created urgent implementation plan with 4 tracks:
  - `plan/U-1-save/` — save vertical slice (local persistence via PersistencePort).
  - `plan/U-2-editor/` — editor basic drag&drop (timeline grid mapped to existing events).
  - `plan/U-3-gas/` — GAS persistence (Google Sheets via GasSheetAdapter).
  - `plan/U-4-pdf/` — PDF export (server-side generation via HtmlService + DriveApp).
- Each track follows established plan structure: `objectives.md`, `agent_guideline.md`, `phases/README.md`, individual phase specs.
- Added `plan/README.md` with dependency graph and execution order.
- Updated `plan/implementation-status.json` to reflect U-series status.
- Updated `docs/README.md` with active plan references.

### 2026-03-11 (docs: add Vistas parallel design graph)
- Added `docs/plans/2026-03-11-vistas-parallel-design-graph.md` with a dependency graph for parallel implementation paths from current rebuild state to full `Vistas.md` parity.
- Included explicit gates and a critical path to separate strict blockers from parallelizable tracks.
- Linked the new graph from `docs/README.md` under Plans and Design Maps.

### 2026-03-11 (docs: prune legacy and completed planning artifacts)
- Removed legacy/comment-only inline notes from mixin architecture docs and converted them into explicit guidance:
  - `docs/ARCHITECTURE/mixin-arch/01_system_overview.md`
  - `docs/ARCHITECTURE/mixin-arch/03_critique.md`
- Deleted planning artifacts that were legacy or already implemented to reduce navigation noise:
  - `plan/antecedents/**`
  - `plan/I-2-item/**`
  - `plan/I-2b-item-cleanup/**`
  - `docs/plans/2026-02-24-ui-component-flow-design.md`
  - `docs/plans/2026-03-01-item-db-integration-design.md`

### 2026-03-11 (docs: cleanup pass for active references)
- Updated top-level docs entrypoints to remove dead links and stale test references:
  - `README.md`
  - `docs/README.md`
  - `docs/PACKAGES/components.md`
  - `docs/GUIDES/testing-components.md` (Playwright-first guidance).
- Removed legacy/planning-heavy docs from active `docs/` root to reduce ambiguity:
  - `docs/COMPONENT_ARCHITECTURE.md`
  - `docs/FINAL_COMPONENT_HIERARCHY.md`
  - `docs/MIXINS_COMPLETE_INVENTORY.md`
  - `docs/documentation-gaps.json`

### 2026-03-11 (docs: Vistas design map against rebuild status)
- Added `docs/plans/2026-03-11-vistas-design-map.md` to translate `Vistas.md` into a processing-ready implementation map.
- Included a capability matrix with `DONE/NEAR/MISSING` status, ownership typing (`COMPONENT`, `SCREEN`, `WORKFLOW`, `SERVICE`, `TOOL`), and explicit gap-to-close notes.
- Documented evidence sources including runtime validation on GAS preview (`http://localhost:8082`) via Playwright to avoid code-only assessment.

### 2026-03-08 (build: GAS bundling pipeline)
- Added full bundling pipeline scripts in `package.json`: `build`, `build:bundle`, `build:gas`, `serve:gas`, and `dev:gas`.
- Added Rollup IIFE build for browser/GAS runtime in `rollup.config.mjs` and new bundling entrypoints:
  - `bundling/entry.js`
  - `bundling/createQuotationRuntime.js`
  - `bundling/createQuotationFlowComponent.js`
- Added build tooling for GAS artifacts:
  - `tools/generate_local_init_tables.mjs`
  - `tools/reset_gas_workspace.mjs`
  - `tools/generate_gas_runtime_bundle.mjs`
  - `tools/generate_gas_code.mjs`
  - `tools/serve-gas.mjs`
- Added GAS source templates and manifest under `apps/gas/` and wired quotation template generation from `apps/quotation/playground/QuotationFlowInternal.html` with injected shared runtime sections.
- Added deployment documentation: `docs/DEPLOYMENT/gas-bundling.md`.

### 2026-03-07 (docs: actor ownership drift diagnostics)
- Added `docs/ARCHITECTURE/actor-ownership-drift-diagnostics.md` documenting the architecture drift between the intended actor-owned class pattern and current split/factory implementations.
- Included evidence timeline, probable causes, impact analysis, and a staged convergence plan to migrate back to actor-owned component classes with compatibility wrappers.

### 2026-03-07 (docs: mixins style-drift assessment)
- Added `docs/ARCHITECTURE/mixins-style-drift-assessment.md` with a full diagnosis of the mixin strategy gap, its relationship to style drift, target mixin/base mapping per component role, and per-component drift scoring against an ideal mixin-integrated architecture.

### 2026-03-07 (docs: ideal mixin migration idea)
- Added `docs/ARCHITECTURE/mixin-arch/05_ideal_mixin_migration_idea.md` outlining a class-tree migration plan centered on a new `ComponentBase`, scenario/context ownership, and an `AppFlow` layer.
- Included phased effort estimates (fast path and full alignment), reuse strategy for existing common mixins/base classes, and risk controls for incremental migration.

### 2026-03-07 (docs: app flow state vs screen foundation)
- Added `docs/ARCHITECTURE/app-flow-state-screen-foundation.md` to formalize the distinction between screen, state, and event/action for quotation flow design.
- Captured the agreed node classification, baseline navigation flow, and initial AppFlow state set to guide upcoming per-screen detailing.

### 2026-03-07 (docs: app flow screen-by-screen spec)
- Added `docs/ARCHITECTURE/app-flow-screen-by-screen-spec.md` with full per-screen wireframes, state mapping, event contracts, guards, and transition matrix for the quotation flow.
- Consolidated the agreed navigation (`Entry -> DB/New/Load`, `New -> Select/New Client -> Quotation`, `Quotation -> Save/Validate`, `Validate -> Print -> Save`) into implementation-ready state definitions.

### 2026-03-04 (step-04 rebuild: full quotation internal flow, no persistence)
- Added implementation plan doc `docs/plans/2026-03-04-quotation-internal-rebuild-plan.md` for urgent reconstruction scope (client + internal behavior now, save/load/PDF deferred).
- Replaced quotation playground wiring with a runtime coordinator that composes catalog and basket actors:
  - `apps/quotation/state/createQuotationInternalRuntime.js`
  - `apps/quotation/playground/mountQuotationFlow.js`
- Added full quotation internal UI template with legacy behavior-first layout:
  - `apps/quotation/playground/QuotationFlowInternal.html`
  - includes browse/client stage, basket stage (catalog + day tabs + line editor), validation preview stage, and client selector modal.
- Simplified quotation basket UI controls per flow constraints:
  - removed redundant entry transfer section,
  - removed global/base hour input from header controls (hour remains item-level override only).
- Improved quotation UI sizing and controller placement:
  - moved global controllers (start date, days, pax global, copy day, validate) into the left sidebar,
  - reduced typography and control sizing in quotation shell for denser, legacy-aligned readability.
- Grouped client + quotation settings into a collapsible `global context` box in the sidebar; collapsed header now shows only selected client name and expander.
- Adjusted sidebar layout behavior to prevent clipping: settings stack vertically, sidebar uses internal scroll, and two-column workspace is preserved until narrower breakpoints so the left area remains a real sidebar.
- Imported I-3 draft visual language into Step-04 quotation flow: DM Sans/DM Mono typography, shared color tokens, denser catalog/timeline styling, and timeline header/hints.
- Added draft-inspired drag behavior for catalog shipping: catalog cards are draggable and can be dropped into selected day timeline or specific day tabs.
- Updated step-04 sandbox route imports for XState + json-logic runtime compatibility:
  - `apps/sandbox/routes/step-04-quotation/index.html`.
- Extended shared item playground sections for quotation interactions:
  - catalog cards can ship entries via optional `shipCatalogEntry` handler,
  - basket cards call optional `copyBasketEntry` / `duplicateBasketEntry` handlers.

### 2026-03-04 (docs: legacy external quotation UI blueprint)
- Added `docs/plans/2026-03-04-legacy-quotation-ui-blueprint.md` with a compact layout/control blueprint of the legacy `claps_codelab` UI (sidebar, timeline, validation/completion, and modal surfaces) for Step 05 integration reference.

### 2026-03-04 (docs: legacy functionality recovery mapping)
- Added `docs/plans/2026-03-04-legacy-functionality-recovery-mapping.md` with a parity matrix (legacy capability -> rebuild contract -> status -> remaining work), an event mapping section, and a concrete "what is left" recovery scope for Step 05.
- Added a Mermaid recovery graph to the same mapping doc to visualize legacy capabilities, current rebuild contracts, and pending Step 05+ gaps.

### 2026-03-04 (docs: synced I-3 phase completion status)
- Updated checklists in `plan/I-3-category/phases/02_full_catalog.md`, `03_basket_single_day.md`, and `04_basket_by_days.md` to reflect implemented and verified scope.
- Added current progress snapshot in `plan/I-3-category/phases/README.md` (steps 01-04 complete, step 05 pending).

### 2026-03-04 (I-3 step-04: full basket composed by day-wide runtimes)
- Added basket composition machine in `packages/components/basket/machine/basketMachine.js` that orchestrates multiple day runtimes (`createBasketDayActor`) into one full quotation basket.
- Implemented day-level orchestration APIs/events: day selection, item shipping to selected/specific day, per-entry override/clear/reset dispatch, cross-day entry move, and global context fan-out to all days.
- Added coverage in `packages/components/basket/tests/basketMachine.test.js` for day isolation, shipping behavior, cross-day move with override preservation, and multi-day context propagation.
- Added full basket-by-days playground:
  - template `packages/components/basket/ui/BasketStandalone.html`
  - mount `apps/sandbox/playground/basket/mountBasketPlayground.js`
  - route `apps/sandbox/routes/step-I3-basket-02/index.html`
  - navigation + server wiring in `apps/sandbox/index.html` and `tools/serve-sandbox.mjs`.

### 2026-03-04 (I-3 step-03 foundation: basket/day granular item unit)
- Added day-basket runtime machine in `packages/components/basket-day/machine/basketDayMachine.js` as the granular basket unit owner (entry shipping, duplicate entry independence, per-entry override/clear/reset, context fan-out, and child rule aggregation).
- Added machine coverage in `packages/components/basket-day/tests/basketDayMachine.test.js` for duplicate shipping, remove-by-entryId isolation, override lock/reset behavior under context changes, and warning/error aggregation.
- Added dedicated playground for the basket/day granular unit:
  - template `packages/components/basket-day/ui/BasketDayStandalone.html`
  - mount `apps/sandbox/playground/basket-day/mountBasketDayPlayground.js`
  - route `apps/sandbox/routes/step-I3-basket-day-01/index.html`
  - navigation + server wiring in `apps/sandbox/index.html` and `tools/serve-sandbox.mjs`.

### 2026-03-04 (I-3 step-02: catalog machine + playground route)
- Removed all autogenerated hybrid-price warning rules (`Precio hibrido detectado ...`) from `data/init/REGLAS_NEGOCIO.csv` so catalog popovers only show real business restriction rules.
- Added `createCatalogActor()` in `packages/components/catalog/machine/catalogMachine.js` as a composition layer over category runtimes with lazy expand/collapse lifecycle, context fan-out (`SET_CONTEXT`), and aggregated catalog summary state.
- Added coverage in `packages/components/catalog/tests/catalogMachine.test.js` for lazy initialization, expand/collapse teardown, and child snapshot propagation.
- Added full catalog playground UI and mount wiring:
  - `packages/components/catalog/ui/CatalogStandalone.html`
  - `apps/sandbox/playground/catalog/mountCatalogPlayground.js`
  - route `apps/sandbox/routes/step-I3-category-02/index.html`
  - navigation + server wiring in `apps/sandbox/index.html` and `tools/serve-sandbox.mjs`.
- Fixed catalog item rendering after expand: shared item runtime section now reads a reactive `catalogEntries` getter per category expansion block, so expanded categories show their item cards immediately.
- Removed subtotal display from catalog/category playground UI for now, since price collection is not owned at the category/catalog layer in this phase.

### 2026-03-04 (docs: I-3 phase plan rewrite for shared adapters)
- Updated `plan/I-3-category/phases/README.md` with explicit split constraints (packages reusable logic vs app playground wiring) and no-duplication rules for item/database integration.
- Updated phase docs `01`-`05` under `plan/I-3-category/phases/` to require shared adapter/template reuse (`seedToResolverDb`, shared item catalog HTML sections) and avoid local DB/UI forks.

### 2026-03-04 (phase-01 gate hardening: category teardown test)
- Added dependency-injection hook `createItemActorImpl` to `createCategoryActor()` in `packages/components/category/machine/categoryMachine.js` for deterministic teardown testing.
- Added teardown regression coverage in `packages/components/category/tests/categoryMachine.test.js` to assert child unsubscribe/stop on category switch and actor stop.
- Marked Step 01 objectives as completed in `plan/I-3-category/phases/01_category_loader.md`.

### 2026-03-04 (structure split: components vs playground)
- Moved sandbox orchestration out of component/database packages into app-level playground modules:
  - `apps/sandbox/playground/item/mountItemPlayground.js`
  - `apps/sandbox/playground/category/mountCategoryPlayground.js`
  - `apps/sandbox/playground/database/mountDatabasePlayground.js`
  - `apps/quotation/playground/mountQuotationFlow.js`
- Moved sandbox-only HTML templates out of packages:
  - `apps/sandbox/playground/database/DatabasePlayground.html`
  - `apps/quotation/playground/QuotationFlowDemo.html`
- Removed item dual playground mount files from `packages/components/item/logic/` and kept a single playground entrypoint (`mountItemPlayground`) at app level.
- Removed counter demo components and routes (`counter-basic`, `counter-composed`, `/step-01-counter`, `/step-02-counter-composed`) per cleanup request.
- Updated sandbox routes to import playground modules from `/apps/...` paths and updated `tools/serve-sandbox.mjs` to serve `/apps/` assets directly.
- Updated `packages/components/quotation/index.js` to export reusable quotation parts only (no playground mount export).
- Verified with tests: `npm test` => `48` files passed, `529` tests passed, `1` skipped.

### 2026-03-04 (category uses exact shared item catalog HTML)
- Removed duplicated category card markup from `packages/components/category/ui/CategoryStandalone.html` and replaced it with an injection placeholder.
- Wired category playground mount (`apps/sandbox/playground/category/mountCategoryPlayground.js`) to import `catalogRuntimeHtml` from `packages/components/item/ui/playgroundItemSections.js` and inject that exact shared item catalog template into the category view at mount time.
- Added `catalogEntries` mapping in category playground state so the shared item template can render without local HTML forks.
- Result: category catalog rendering now uses the same item HTML source as item playground (no duplicated card template).

### 2026-03-04 (database adapter dedupe for playgrounds)
- Added shared database playground helpers in `packages/database/src/playgroundAdapter.js`:
  - `seedToResolverDb(seed)` to map CSV seed arrays into resolver DB shape.
  - `getPrimaryKeyForTable(tableName)` to derive PK field names from schema.
- Updated item and category playground mounts to use `seedToResolverDb()`:
  - `apps/sandbox/playground/item/mountItemPlayground.js`
  - `apps/sandbox/playground/category/mountCategoryPlayground.js`
- Updated database machine + mount to use shared PK resolution helper:
  - `packages/database/src/machine/databaseMachine.js`
  - `apps/sandbox/playground/database/mountDatabasePlayground.js`
- Exported new helpers in `packages/database/index.js` and added tests in `packages/database/src/playgroundAdapter.test.js`.

### 2026-03-04 (hotfix: fixed-rate labeling + Vitest/Playwright suite isolation)
- Fixed `lineRateLabel` fallback regression in `packages/components/item/domain/formatting.js`:
  - `PricingKind.NONE` now maps to `"Fijo"`,
  - unknown/null/undefined kinds map to `"Cantidad"`,
  - `UNITS + CONTEXT_PAX` keeps `"por Pax"` behavior.
- Updated item display projections in `packages/components/item/Item.js` so fixed-only items render as a single rate row (`Fijo`) instead of splitting into separate base/rate lines.
- Updated item UI templates in `packages/components/item/ui/ItemDisplay.html` and `packages/components/item/logic/createItemMultiComponent.js` to show the rate row only when value > 0 and use `"Fijo"` fallback label.
- Added/updated tests in `packages/components/item/tests/formatting.test.js` and `packages/components/item/tests/Item.test.js` to cover fixed-only display behavior and `por Pax` labeling.
- Added `vitest.config.mjs` excluding `tests/e2e/**` from unit test runs, preventing Playwright specs from being executed by Vitest (`npm test` now passes cleanly).

### 2026-03-04 (category UI aligns to item-playground card HTML)
- Updated `packages/components/category/ui/CategoryStandalone.html` to render category items with the same catalog-card visual structure used in the item playground (`mini-card runtime-card catalog-card`, hover description popover, rules dot + rules popover).
- Updated category Alpine helpers in `packages/components/category/logic/createCategoryStandaloneComponent.js` to use shared rule status helpers (`ruleClass`, `ruleIcon`) matching item playground semantics.
- Preserved category-specific aggregate metrics (subtotal, warnings/errors totals) while reusing item card presentation patterns.

### 2026-03-04 (refactor: extract item runtime sections from playground shell)
- Extracted item runtime markup out of `packages/components/item/logic/createItemMultiComponent.js` into new UI module `packages/components/item/ui/playgroundItemSections.js`.
- Split catalog and basket entry sections into reusable exports (`catalogRuntimeHtml`, `basketRuntimeHtml`) and wired them back into the playground shell via imports.
- Kept runtime behavior unchanged (all item/category tests and full test suite pass).

### 2026-03-03 (step-03b playground orchestration: factory + global context + catalog + basket)
- Rebuilt `packages/components/item/logic/createItemMultiComponent.js` into a true playground orchestrator:
  - factory inventory (`db` + `custom resolver`) as source definitions,
  - shared global context broadcast via `SET_CONTEXT`,
  - independent catalog and basket entity registries.
- Shipping now creates **two separate runtime entities** (one catalog actor and one basket actor) from the same factory definition seed.
- Added custom resolver modal flow to generate `ResolvedItemDefinition`-compatible custom items and ship them through the same pipeline as DB items.
- Added rule indicator parity in both columns using actor snapshot fields (`available`, `ruleErrors`, `ruleWarnings`, `appliedRules`).
- Hardened lifecycle management by storing actor/subscription handles outside Alpine reactive data to avoid recursive proxy stack issues.
- Added plan document: `packages/components/item/ITEM_PLAYGROUND_IMPLEMENTATION_PLAN.md`.
- Added Playwright acceptance coverage for `step-03b`:
  - config: `playwright.config.mjs`,
  - spec: `tests/e2e/step-03b.acceptance.spec.js`,
  - scripts: `test:e2e` and `test:e2e:headed` in `package.json`.
- Added CI workflow `.github/workflows/step-03b-e2e.yml` to run `npm run test:e2e` on pull requests and pushes to `main/master`.
- Restored `step-03b` visual language based on `plan/I-2-item/html_playground_draft.html` item patterns:
  - catalog uses draft-style mini cards,
  - basket uses draft-style accordion layout with quantity/editor controls,
  - rule state chips + alerts shown in both views.
- Updated `apps/sandbox/routes/step-03b/index.html` and playground styles to render full-width (edge-to-edge shell).
- UX cleanup requested after review:
  - removed catalog hint text,
  - removed catalog delete action,
  - changed basket reset to icon action,
  - hid variable-rate line for fixed-price items,
  - replaced inline rule alerts with hover popovers on `.rules-dot` for both catalog and basket using item-owned rules (`definition.rules`) and applied-rule highlighting.
- Rules-per-item fix:
  - updated `packages/database/src/resolveItemDefinition.js` to avoid passing unrelated global ITEM rules when `ID_Componente` is null but `Condicion_JSON` explicitly targets another `item.id`,
  - added test coverage in `packages/database/src/resolveItemDefinition.test.js`,
  - made rules popover scrollable for long rule lists.
- Updated item module docs:
  - refreshed `packages/components/item/README.md`,
  - expanded `packages/components/item/tests/README.md` with Playwright acceptance flows,
  - updated `packages/components/item/STEP_03B_MULTI_VIEW_ISSUE_DIAGNOSIS.md` to reflect the orchestrated model.

### 2026-03-03 (HOTFIX: step-03b multi-view Alpine initialization)
- Fixed Alpine.js initialization failure in `step-03b` multi-view route (broken after UI split).
- Root cause: `ItemDisplay.html` template had no queryable `x-data` element, so `createItemMultiComponent.js` couldn't initialize Alpine.
- Solution: Wrapped template in `<div class="item-root">` and updated querySelector from `[x-data]` to `.item-root` in `createItemMultiComponent.js`.
- Verified: Both `/step-03-item` and `/step-03b` routes now work correctly with full Alpine reactivity.
- Updated `STEP_03B_MULTI_VIEW_ISSUE_DIAGNOSIS.md` to reflect resolution.

### 2026-03-03 (I-2b item cleanup + init profiles + UI split)
- Removed dead item artifacts: `packages/components/item/ItemComponent.js`, `packages/components/item/ItemComponent.html`, `packages/components/item/ui/RulesEditor.html`, `packages/components/item/ITEMCOMPONENT_README.md`, `packages/components/item/ITEMCOMPONENT_DESIGN.md`, and `packages/components/item/ITEMCOMPONENT_QUICK_START.md`.
- Added `PERFILES_INICIALIZACION` to `packages/database/src/Config_Schema.js`, updated `CATEGORIAS` + `ITEM_CATALOGO` to FK-based init-profile references, and introduced `data/init/PERFILES_INICIALIZACION.csv`.
- Migrated CSV seed shape: `data/init/CATEGORIAS.csv` now uses `ID_Perfil_Init_Default`; `data/init/ITEM_CATALOGO.csv` now uses `ID_Perfil_Init_Override`.
- Updated seed/coercion pipeline in `packages/database/src/seed.js`, `packages/database/src/csvSeed.js`, and `packages/database/src/csvSeed.browser.js` to support init profiles.
- Upgraded resolver to 5-way join in `packages/database/src/resolveItemDefinition.js` and refreshed resolver tests in `packages/database/src/resolveItemDefinition.test.js`.
- Updated `Item.fromDefinition()` in `packages/components/item/Item.js` to map init defaults from `perfilInit` and expose `perfilInit` in `toDisplayObject()`.
- Fixed context/override parsing and wired missing machine events from the standalone API in `packages/components/item/logic/createItemStandaloneComponent.js`.
- Split item UI into `packages/components/item/ui/ItemDisplay.html` (production view) and `packages/components/item/ui/ResolverPanel.html` (sandbox panel), updated `apps/sandbox/routes/step-03-item/index.html`, and removed `packages/components/item/ui/ItemStandalone.html`.
- (2026-03-03 followup cleanup) Removed dead `/item-playground/` route from `tools/serve-sandbox.mjs` and updated stale documentation references in `docs/README.md`, `docs/GUIDES/writing-rules.md`, `docs/ARCHITECTURE/item-component.md`, and `docs/plans/2026-03-01-item-db-integration-design.md` to reference `ItemDisplay.html` instead of deleted `ItemStandalone.html`.

### 2026-03-01 (resolveItemDefinition — 4-way join for item DB integration)
- Created `packages/database/src/resolveItemDefinition.js` — pure function that joins ITEM_CATALOGO + CATEGORIAS + PERFILES_PRECIO + REGLAS_NEGOCIO into the `ResolvedItemDefinition` contract (see `plan/III-1-resolver/field_contracts.md`).
- Profile resolution: `item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default` (item wins).
- Rules filter: `Activo=true AND Scope='ITEM' AND Etapa='RESTRICCION_UI' AND (ID_Componente IS NULL OR ID_Componente = itemId)`, sorted by `Prioridad ASC`.
- Strips `Updated_At` from all nested objects (item, categoria, perfil, each rule row).
- Throws descriptive errors for missing item, dangling categoria FK, or unresolvable perfil.
- Added 19 tests in `packages/database/src/resolveItemDefinition.test.js` (happy path, rules filtering, output shape, error handling).
- Exported from `packages/database/index.js` as `resolveItemDefinition`.
- **Total tests: 514 passed, 1 skipped.**

### 2026-03-01 (database seed — all 11 tables wired)
- Expanded `packages/database/src/csvSeed.browser.js` `COERCE` map from 4 to all 11 schema tables (added CLIENTES, COMPOSICION_KIT, COTIZACIONES, LINEA_DETALLE, AJUSTES_COTIZACION, CACHE_COTIZACION, HISTORIAL_COTIZACION).
- Added 6 new coerce functions in `packages/database/src/csvSeed.js` (`coerceComposicion`, `coerceCotizacion`, `coerceLinea`, `coerceAjuste`, `coerceCache`, `coerceHistorial`) and updated `LOADERS` to cover all 11 tables.
- Expanded `BROWSER_TABLES` in `packages/database/src/machine/databaseMachine.js` from 4 to 11 tables; `allRows()` iterator auto-covers new tables.
- `DEFAULT_TABLES = Object.keys(COERCE)` in the browser loader auto-updates from the expanded map.
- Transactional tables (COTIZACIONES, LINEA_DETALLE, AJUSTES_COTIZACION, CACHE_COTIZACION, HISTORIAL_COTIZACION) and COMPOSICION_KIT have header-only CSVs; playground renders them with 0 rows as expected.
- Note on REGLAS_NEGOCIO: `ID_Componente` is hardcoded `null` in the coercer — the CSV column is absent; item targeting is encoded inside `Condicion_JSON` (JSON-Logic).

### 2026-03-01 (step-I1 database full-width correction)
- Fixed `apps/sandbox/routes/step-I1-database/index.html` so the sandbox route now renders edge-to-edge by removing horizontal body padding on `body.sandbox-page`.
- Preserved header readability by keeping local spacing on the route title row while allowing table/content area to use full viewport width.
- Added route-level notes in `apps/sandbox/routes/step-I1-database/README.md` documenting root cause, fix, and Playwright verification.

### 2026-02-25 (step-04 quotation flow route wiring)
- Added live quotation flow mount logic at `packages/components/quotation/logic/createQuotationFlowComponent.js` wiring `AppState`, modal components, and quotation view components into one Alpine runtime.
- Added demo template `packages/components/quotation/ui/QuotationFlowDemo.html` to exercise Home -> Client Selector -> Initializer -> Quotation flow with live basket + totals updates.
- Added sandbox route `apps/sandbox/routes/step-04-quotation/index.html`, updated `apps/sandbox/index.html` navigation, and extended `tools/serve-sandbox.mjs` route resolution/logging for `/step-04-quotation`.
- Exported `mountQuotationFlow` from `packages/components/quotation/index.js` for package-level integration.

### 2026-02-25 (quotation path consolidation cleanup)
- Refactored `apps/quotation/components/HomePage.js` and `apps/quotation/components/ClientSelector.js` into compatibility wrappers over `packages/components/quotation/*` to avoid duplicated behavior.
- Removed self-import cycle risk in `packages/components/quotation/logic/createQuotationFlowComponent.js` by importing from `modals/index.js` and `views/index.js` directly.
- Added migration/readiness notes in `apps/quotation/components/README.md`, `packages/components/quotation/modals/README.md`, and `packages/components/quotation/views/README.md` to clearly mark template stubs vs live mounted flow.

### 2026-02-25 (app state unification)
- Merged app-level and package-level quotation state logic by upgrading `packages/components/quotation/modals/AppState.js` with `send()` + `getState()` state-machine behavior used by the legacy app tests.
- Replaced `apps/quotation/state/AppStateMachine.js` implementation with a compatibility export that now delegates to `createAppState()` from the package layer.
- Preserved the existing app-state transition contract (`BROWSE -> CLIENT_SELECTOR -> INITIALIZE -> QUOTATION -> VALIDATION -> COMPLETED`) while keeping package-first ownership of state context.

### 2026-02-24 (item-playground route loading fix)
- Fixed `apps/sandbox/routes/item-playground/index.html` so selecting a featured item now mounts a live component into `#component-root`.
- Added dynamic import + mount flow in `selectItem(item)` and proper cleanup in `resetPlayground()` to avoid stale mounted state between selections.
- Added an import map for `json-logic-js` on the playground page so rules engine module imports resolve correctly in browser.
- Updated `packages/components/item/logic/createItemStandaloneComponent.js` to accept optional seed overrides, enabling per-example item definitions from the playground.
- Added mount cleanup handling in `createItemStandaloneComponent` to unsubscribe actor listeners and support safe remounts.

### 2026-02-22 (step-03.1 catalog card + basket line UI)
- Rewrote `ItemStandalone.html` with actual item visual representation:
  - **Catalog mode:** Shows mini-card with category badge, item name, pricing formula, policy hint, description, clickable add-to-basket
  - **Basket mode:** Shows full accordion with time input, quantity controls (pax/units/duration), price breakdown (base + rate subtotal = total), comments, delete/reset buttons
  - Right sidebar: Mock container context (paxGlobal, dia, hora) + intrinsic property editors (pricing profile, default initialization)
- Tested with Puppeteer: Both modes render correctly, mode transitions work, calculations accurate

### 2026-02-22 (step-03.2 user override protection with isUserSet tracking)
- Added per-field user-set tracking for quantities (pax, cantidad, duracionMin):
  - `Item.js`: Add `#userSetFields` Set, track in `setOverride()`, clear in `clearOverride()`/`resetOverrides()`
  - Expose `userSetFields`, `isUserSetPax`, `isUserSetCantidad`, `isUserSetDuracion` in `toDisplayObject()` and `toSeed()` for persistence
  - `ItemStandalone.html`: Add per-field badges and orange border highlights
- Added comprehensive test suite (363 tests, 100% passing):
  - `pricing.test.js`: 82 tests (enums, type conversion, kind/mode detection, utilities)
  - `quantity.test.js`: 80 tests (context resolution, override precedence, exclusive defaults)
  - `rules.test.js`: 44 tests (rule evaluation, blocking behavior, multiple rules)
  - `formatting.test.js`: 69 tests (display string generation for all kinds/modes)
  - `Item.test.js`: 88 tests (factories, modes, calculations, context, overrides, NEW userSetFields tracking, projections, serialization)
- Installed vitest, configured `npm test` and `npm run test:watch` scripts

### 2026-02-21 (step-01 minimal reset)
- reset worktree to minimal files only for Step 01.
- added standalone sandbox server (`tools/serve-sandbox.mjs`).
- added first component package `packages/components/counter-basic/` with:
  - xstate machine
  - alpine component logic
  - html template
  - test placeholder

### 2026-02-21 (step-02 composed counters)
- added `packages/components/counter-composed/` module with one global counter actor and two child counter actors (reusing step-01 counter machine), showing `global + local` per child.
- added sandbox route `apps/sandbox/routes/step-02-counter-composed/index.html` and updated index navigation.
- updated sandbox server route resolution for `/step-02-counter-composed`.

### 2026-02-21 (step-03 item standalone)
- added `packages/components/item/` with standalone item machine + ui + logic, simulating external context (`paxGlobal`, `duracionMin`, `dia`, `hora`) and item definition (`name`, `category`, `description`, `rules`, `pricing profile`, default quantity policies).
- item mode toggle (`catalog`/`basket`) now shows human pricing profile text (e.g. `$400 fijo + $20 por persona`) and computed totals from resolved quantities.
- added sandbox route `apps/sandbox/routes/step-03-item/index.html`, index navigation entry, and server route support.

### 2026-02-21 (styling alignment with claps_codelab)
- imported full global styling baseline into `packages/components/common/styles/claps-global.css` (ported from `packages/frontend/Styles_Global.html`).
- updated sandbox pages (`/`, step-01, step-02, step-03) to load shared claps global stylesheet.
- updated step component templates to use claps button utility classes for visual consistency.
- refactored `step-03-item` UI to timeline-style accordion layout (global initializers on left, item accordion on right) matching `Components_Timeline.html` interaction patterns.
- added pricing profile editor in `step-03-item` (base fijo, por persona, por unidad, por minuto) with live machine recalculation and human-readable profile preview.
- basket accordion pricing box now shows per-quantity breakdown terms (base, pax, unidades, duracion) instead of ambiguous `unitario` line.
- moved pricing profile editor to the top of carrito area and added a sibling column for default initialization logic (pax/cantidad/duracion defaults + unidades/minutos policies) with live recalculation.
- catalog mini-card price label now prioritizes per-quantity profile text (`por persona`, `por unidad`, `por minuto`, plus fixed when present) instead of showing only a scalar base value.
- catalog mini-card now computes and displays a default-initialized price preview (using current default initialization logic + external context), with a secondary colored hint showing initialization policy (`und/persona`, `und/hora`, `min/persona`, or fixed defaults).
- catalog mini-card now includes explicit pricing formula detail (example style: `$400 + (3 und/pax x 20 pax) x $1`) so base and quantity-driven terms remain visible alongside initialization hints.
- fixed catalog preview reactivity when editing initialization logic by treating fixed cantidad/duracion defaults as active only when > 0 and allowing blank inputs to clear those fixed-default keys.
- updated default coffee demo to emphasize quantity-driven pricing (`baseFijo: 400`, `porUnidad: 1`, `unidadesPorUsuario: 3`) so catalog formula visibly reacts to initialization edits.
- catalog secondary initialization hint now only shows rate policies (`und/persona`, `und/hora`, `min/persona`) and no longer shows fixed defaults (`cantidad fija`, `duracion fija`).
- catalog pricing is now explicitly disaggregated and decoupled from global context: it no longer computes a global-pax total preview, and instead shows formula-style price terms derived only from item profile + initialization policy.
- default initialization editor now enforces exclusive modes (fixed vs dependent) for quantity and duration to avoid mixed conflicting logic.
- added `packages/components/item/LOGIC.md` as the canonical spec for simplified item behavior (single pricing kind, single initialization mode, catalog disaggregated semantics, basket aggregated semantics, override marker expectations, and visibility rules).
- added shared pricing abstraction module `packages/pricing/src/itemPricingPolicy.js` and moved item pricing/initialization resolution there to decouple UI/XState-facing state from pricing logic.
- item standalone now consumes pricing abstraction outputs: single active quantity kind, exclusive initialization mode, hidden non-affecting controls, override badge in basket, and collapsed legend based on active pricing terms.
- refactored abstraction to class-based design:
  - `packages/pricing/src/ItemLogic.js` now holds item business logic
  - `packages/xstate/src/interactions/XStateInteractionBase.js` + `packages/xstate/src/interactions/ItemXStateInteraction.js` bridge XState events to `ItemLogic`
  - `packages/components/item/machine/itemMachine.js` now delegates state projection/reduction to `ItemXStateInteraction`.
- `ItemLogic` is now stateful (front-state holder) with lifecycle methods (`initialize`, `modifyQuantities`) and render projections (`toCatalogCard`, `toBasketLine`, `toMachineContext`), matching domain-style class behavior.
- added JSDoc blocks across `ItemLogic`, `ItemXStateInteraction`, and `XStateInteractionBase` to document responsibilities, method contracts, and expected inputs/outputs.
- reduced business logic leakage from `packages/components/item/logic/createItemStandaloneComponent.js` by consuming `state.catalogCard` and `state.basketLine` projections generated by `ItemLogic` (`toCatalogCard` / `toBasketLine`) via machine context.
- documented explicit component/interaction/logic boundary rules in `packages/components/item/LOGIC.md`.
- moved item default business seed/definition from `packages/components/item/machine/itemMachine.js` into pricing layer (`packages/pricing/src/ItemLogic.js`) and kept item machine as orchestration-only initializer.
- added `packages/components/item/EXPECTED_BEHAVIOR.md` documenting expected runtime behavior for catalog/basket, pricing/init precedence, override semantics, projections, and QA checklist.
- added `ROADMAP.md` in rebuild worktree with the agreed 10-step sequence and explicit progress tracking (steps 1-3 done; step 4 next).
