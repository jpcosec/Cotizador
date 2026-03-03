# Changelog

## [Unreleased]

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
