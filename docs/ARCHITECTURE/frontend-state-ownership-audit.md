# Frontend State Ownership Audit (Alpine vs XState)

Date: 2026-02-21
Status: Current runtime audit

## Goal

Document, with file-level evidence, what is currently owned by Alpine UI code and what is owned by XState orchestration, then identify duplication and define a clear single-source-of-truth direction.

## Executive Decision

Recommended direction: **XState owns business/workflow state; Alpine owns presentation/UI state only**.

Why:
- The machine already owns lifecycle, guards, pricing recalculation, and persistence transitions.
- Alpine already behaves as a projection layer in machine mode via `AlpineXStateBridge`.
- Moving core logic to Alpine would duplicate machine guards/actions and weaken deterministic orchestration.

## Ownership Matrix (Current)

### 1) Workflow and business state

- **XState-owned:** quotation workflow states and transitions (`browse`, `initialize`, `basket`, `validation`, `completed`, `error`) in `packages/xstate/src/Orchestration/quotationMachineBlueprint.js`.
- **Alpine-owned projection:** view routing helpers (`isMachineInBrowse`, `isMachineInBasket`, etc.) in `packages/frontend/Stores_App.html` and `x-show` checks in `packages/frontend/Index.html`.

Conclusion: healthy ownership split; Alpine should not own workflow transitions.

### 2) Basket/cart mutations

- **XState-owned:** `ADD_ITEM`, `UPDATE_ITEM`, `REMOVE_ITEM` actions and guards in `packages/xstate/src/Orchestration/quotationMachineBlueprint.js` and `packages/xstate/src/Orchestration/adapters/actions.js`.
- **Alpine-owned fallback logic:** local `carrito.push` and local mutations in `packages/frontend/Stores_App.html` when machine mode is unavailable.

Conclusion: duplicated paths exist (machine path + fallback path). In machine mode, this should be machine-only.

### 3) Totals and pricing

- **XState-owned:** totals in context via pricing/domain actions (`totals`) in `packages/xstate/src/Orchestration/adapters/actions.js`.
- **Alpine-owned fallback calc:** `totalNeto` and `totalFinal` fallback reduce + `*1.19` in `packages/frontend/Stores_App.html`.

Conclusion: machine is canonical in machine mode; fallback remains duplicated.

### 4) Catalog loading and shaping

- **XState-owned domain source:** `initCatalog` loads `Catalog` into machine context in `packages/xstate/src/Orchestration/adapters/actions.js`.
- **Alpine-owned shaping/loading orchestration:** `cargarCatalogo`, `normalizeCatalogItem`, `normalizeCatalogo`, grouping in `packages/frontend/Stores_App.html`.

Conclusion: mixed ownership. Data source is machine, but display shaping/filtering is Alpine; acceptable if Alpine is strictly projection and no pricing logic leaks in.

### 5) Quotation load/list

- **XState-owned capabilities:** `VIEW_PREVIOUS_QUOTATIONS`, `LOAD_QUOTATION`, and snapshot hydration actions in machine actions.
- **Alpine-owned direct store reads:** `loadPreviousQuotations` reads actor context/store directly in `packages/frontend/Stores_App.html`.

Conclusion: duplicated orchestration path. Prefer dispatching machine events and reading projected state only.

### 6) Database management UI

- **XState-defined region:** `database_management` with `OPEN_DATABASE`, `SELECT_ROW_TO_MODIFY`, `SAVE_ROW`, `CLOSE_DATABASE` in blueprint.
- **Alpine runtime reality:** database viewer reads tables directly from store; no usage of DB region events in `packages/frontend/Stores_App.html` and `packages/frontend/Components_DatabaseViewer.html`.

Conclusion: machine DB region exists but is mostly bypassed by frontend. This is a major ownership mismatch.

### 7) UI-only state

- **Alpine-owned and should remain Alpine-owned:** modal visibility, local filter text, focus indexes, currently selected day/tab, panel open/close states (`modalCliente`, `modalCotizaciones`, `databaseViewerOpen`, `focusClientIndex`, `busquedaCatalogo`, etc.) in `packages/frontend/Stores_App.html`.

Conclusion: correct Alpine ownership.

## Bridge Reality Check (Important)

There are two bridge implementations:

- Runtime include: `packages/frontend/Bridge_AlpineXState.html` (loaded by `packages/frontend/Index.html`).
- Source module: `packages/frontend/src/Bridge/AlpineXStateBridge.js`.

The source module includes explicit domain basket projection (`context.basket.toDisplayObject()`), while runtime behavior depends on the HTML bridge include. Keep these in sync or generate runtime from the source module to avoid drift.

## Duplication Hotspots

1. Basket mutations and totals have both machine and Alpine fallback paths.
2. Quotation list/load is partly done by direct Alpine store reads instead of machine events.
3. Database viewer bypasses machine `database_management` region.
4. Catalog shaping/normalization exists in Alpine even when machine/domain models are available.

## Recommended End State (Target Architecture)

### XState owns

- Workflow transitions and guards.
- Catalog, basket, totals, errors/messages, previous quotations.
- Quotation persistence/load behavior.
- Database edit workflows and recalculation triggers.

### Alpine owns

- UI rendering and user interactions.
- Ephemeral UI-only state (modals, search text, active tab/day, keyboard focus).
- Event dispatch to machine through bridge and consumption of projected snapshots.

## Migration Plan (Practical)

1. **Unify bridge source/runtime**
   - Make one canonical bridge implementation and consume it in runtime.

2. **Machine-first quotation listing/loading**
   - Replace direct `store.findAll` reads in Alpine with machine events (`VIEW_PREVIOUS_QUOTATIONS`, `LOAD_QUOTATION`) and bridge-projected state.

3. **Machine-backed database viewer workflows**
   - Wire UI actions to DB region events (`OPEN_DATABASE`, `SELECT_ROW_TO_MODIFY`, `SAVE_ROW`, `CLOSE_DATABASE`).

4. **Remove business fallbacks in machine mode**
   - Keep fallback code only for explicit non-machine/local mode; avoid mixed writes when `useStateMachine === true`.

5. **Projection cleanup**
   - Keep Alpine transformations purely presentational; avoid price/totals recomputation in Alpine when machine is active.

## File References

- `packages/frontend/Index.html`
- `packages/frontend/Stores_App.html`
- `packages/frontend/Bridge_AlpineXState.html`
- `packages/frontend/src/Bridge/AlpineXStateBridge.js`
- `packages/frontend/Components_DatabaseViewer.html`
- `packages/xstate/src/Orchestration/quotationMachineBlueprint.js`
- `packages/xstate/src/Orchestration/adapters/actions.js`
- `packages/xstate/src/Orchestration/adapters/guards.js`
