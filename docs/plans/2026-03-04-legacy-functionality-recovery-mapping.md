# Legacy Functionality Recovery Mapping

Purpose: recover the legacy `claps_codelab` quotation UX functionality on top of the rebuild runtime stack, without reintroducing business logic into Alpine/UI.

## Recovery Graph

```mermaid
flowchart LR
  subgraph L["Legacy UI Functionalities (claps_codelab)"]
    L1["Catalog: search + categories + add item"]
    L2["Timeline: day tabs + line overrides + remove"]
    L3["Line copy/duplicate + copy full day"]
    L4["Validation + completion flow"]
    L5["Previous quotations modal + DB viewer"]
    L6["Save quotation + Generate PDF"]
  end

  subgraph R["Rebuild Runtime Contracts (already available)"]
    R1["createCatalogActor\n(catalog/category composition)"]
    R2["createBasketDayActor\n(entry-level runtime)"]
    R3["createBasketActor\n(day-wide quotation composition)"]
    R4["Item runtime + shared rule UI sections"]
    R5["Quotation app shells/modals in apps/quotation"]
  end

  subgraph G["Recovery Gaps (Step 05+)"]
    G1["Unify final quotation route shell"]
    G2["Wire catalog click -> basket ship events"]
    G3["Complete duplicate/copy semantics\n(line copy + copy full day)"]
    G4["Bind validation/completion to real basket projections"]
    G5["Load previous quotations adapter"]
    G6["Persistence adapter (save/load)"]
    G7["PDF adapter after save"]
    G8["E2E parity suite vs legacy flows"]
  end

  L1 --> R1
  L1 --> R4
  L2 --> R2
  L2 --> R3
  L3 --> R3
  L4 --> R5
  L5 --> R5
  L6 --> R5

  R1 --> G1
  R3 --> G1
  R4 --> G1

  R1 --> G2
  R3 --> G2

  R3 --> G3

  R5 --> G4
  R3 --> G4

  R5 --> G5
  R5 --> G6
  G6 --> G7

  G2 --> G8
  G3 --> G8
  G4 --> G8
  G5 --> G8
  G6 --> G8
  G7 --> G8
```

## Target Runtime Stack (Rebuild)

- Catalog composition: `packages/components/catalog/machine/catalogMachine.js`
- Basket single day: `packages/components/basket-day/machine/basketDayMachine.js`
- Basket by days: `packages/components/basket/machine/basketMachine.js`
- Item runtime/rules/pricing: `packages/components/item/**`

## Functional Parity Matrix

| Legacy capability | Legacy source | Rebuild target contract | Status | Remaining work |
|---|---|---|---|---|
| Browse/start flow (new, load previous, DB viewer) | `packages/frontend/Index.html` | App shell + quotation flow state in `apps/quotation/**` | Partial | Wire real basket/catalog runtime into quotation flow shell.
| Client selector modal + create client | `Components_ModalCliente.html` | `packages/components/quotation/modals/ClientSelector*` | Partial | Connect to real store/API adapter in rebuild flow.
| Catalog grouped by category + search | `Components_Sidebar.html` | `createCatalogActor` + sandbox route `/step-I3-category-02` | Done (sandbox) | Embed this catalog projection in final Step 05 layout.
| Expand/collapse category lifecycle | `Components_Sidebar.html` (details accordion) | `TOGGLE_CATEGORY`, `EXPAND_CATEGORY`, `COLLAPSE_CATEGORY` | Done | Keep exact behavior in final route.
| Item rule hover indicator | sidebar/timeline cards | Shared sections `playgroundItemSections.js` + item state rules | Done | Keep shared template in final UI to avoid drift.
| Add item from catalog to basket | `agregarItem()` in `Stores_XStateApp.html` | `SHIP_SELECTED_ITEM` / `SHIP_ITEM_TO_DAY` on `basketMachine` | Partial | Connect catalog item click to basket actor event bridge.
| Day tabs + per-day filtering | `Components_Timeline.html` | `SELECT_DAY` + `state.selectedDayState` in `basketMachine` | Done | Style/placement alignment in Step 05 shell.
| Per-line overrides (pax/units/duration/time/comment) | `actualizar*` methods in `Stores_XStateApp.html` | `SET_ENTRY_OVERRIDE`, `CLEAR_ENTRY_OVERRIDE`, `RESET_ENTRY_OVERRIDES` | Done (runtime) | Complete final UI bindings for all fields.
| Remove line | `eliminarItem()` | `REMOVE_ENTRY` (day-aware in basket machine) | Done | Maintain entryId-only targeting.
| Duplicate line in same day | `duplicarItemEnDia()` | `SHIP_ITEM_TO_DAY` with same day + optional override copy | Partial | Add dedicated duplicate action in final shell.
| Copy line to next day | `copiarItemAlDiaSiguiente()` | `MOVE_ENTRY_TO_DAY` or ship+override clone | Partial | Add explicit copy-vs-move semantics in UI.
| Copy full day to next day | `copiarDiaCompletoAlSiguiente()` | batch `SHIP_ITEM_TO_DAY` with override cloning | Missing | Implement batch command at basket orchestration/UI layer.
| Move entry between days | timeline workflow | `MOVE_ENTRY_TO_DAY` in `basketMachine` | Done | Add drag/drop or action UX in final route.
| Basket/day aggregates | timeline + summary bar | `basketMachine.state.summary` + day projections | Partial | Restore full totals panel and formatting in Step 05.
| Validation screen (review + confirm/back) | `Components_ValidationSummary.html` | quotation app stage + basket snapshot projection | Partial | Bind to rebuild basket projections and save action.
| Completion screen | `Components_CompletionSuccess.html` | quotation app completed stage | Partial | Connect to real save response payload.
| Previous quotations modal + filters + load | `Components_ModalCotizaciones.html` | quotation app modal + data service | Partial | Implement load/list adapters on rebuild side.
| Database viewer modal | `Components_DatabaseViewer.html` | `packages/components/quotation/modals/databaseViewer*` + DB adapter | Partial | Connect to active data source in final app route.
| Save quotation | `guardarCotizacion()` / `confirmarYGuardar()` | quotation app command -> persistence adapter | Missing | Implement persistence integration endpoint in rebuild flow.
| Generate PDF | `generarPDF()` | post-save action in app service layer | Missing | Implement PDF service adapter and action wiring.

## Event Mapping (Legacy -> Rebuild)

- `agregarItem(item)` -> `basket.send({ type: 'SHIP_ITEM_TO_DAY', dayIndex, itemId })`
- `actualizarCantidad/Unidades/Duracion/Hora/Comentario` -> `SET_ENTRY_OVERRIDE` per key
- clear field -> `CLEAR_ENTRY_OVERRIDE`
- reset line -> `RESET_ENTRY_OVERRIDES`
- `eliminarItem` -> `REMOVE_ENTRY`
- day tab click -> `SELECT_DAY`
- global pax/hour/duration changes -> `SET_CONTEXT`
- move entry day -> `MOVE_ENTRY_TO_DAY`

## Recovery Scope Left (High Level)

1. Step 05 full planned layout integration (shell + panel composition).
2. End-to-end wiring: catalog selection -> basket actor shipping in one route.
3. Batch day operations parity (copy whole day, duplicate/copy semantics).
4. App-level workflow parity (validation/completion, previous quotations, DB viewer).
5. External services parity (save/load quotation and PDF generation adapters).

## Definition of Recovered State

Legacy functionality is considered recovered when:

- every interaction in the legacy UI has a mapped command in the rebuild route,
- no pricing/rules logic is duplicated in UI handlers,
- entry identity (`entryId`) remains the mutation boundary,
- parity flows (catalog -> basket -> validation -> completion) pass manual and automated checks.
