# Changelog

## [Unreleased]

### 2026-02-25 (step-04 quotation flow route wiring)
- Added live quotation flow mount logic at `packages/components/quotation/logic/createQuotationFlowComponent.js` wiring `AppState`, modal components, and quotation view components into one Alpine runtime.
- Added demo template `packages/components/quotation/ui/QuotationFlowDemo.html` to exercise Home -> Client Selector -> Initializer -> Quotation flow with live basket + totals updates.
- Added sandbox route `apps/sandbox/routes/step-04-quotation/index.html`, updated `apps/sandbox/index.html` navigation, and extended `tools/serve-sandbox.mjs` route resolution/logging for `/step-04-quotation`.
- Exported `mountQuotationFlow` from `packages/components/quotation/index.js` for package-level integration.

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
