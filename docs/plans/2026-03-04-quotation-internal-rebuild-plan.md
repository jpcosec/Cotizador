# Quotation Internal Rebuild Plan (No Persistence Yet)

Objective: reconstruct the full quotation UI internal behavior (including client setting) on rebuild runtimes, while explicitly deferring save/load/PDF integration.

## Scope

### In Scope (this step)

- Browse/start flow and client selection.
- Quotation settings (date, days, pax global, base hour).
- Full catalog behavior (search, category expand/collapse, per-item rule visibility).
- Shipping items from catalog into basket/day.
- Day tabs and per-day basket editing.
- Entry operations: override/clear/reset/remove.
- Day operations: duplicate entry, copy entry to day, move entry, copy full day.
- Validation preview stage (internal summary only, no persistence).

### Out of Scope (next step)

- Save quotation.
- Load quotation.
- PDF generation.
- External service adapters for persistence.

## Architecture Plan

1. Build a quotation runtime coordinator in `apps/quotation/state/` that composes:
   - `createCatalogActor` (catalog orchestration),
   - `createBasketActor` (day-wide basket orchestration).
2. Keep UI as projection-only:
   - one snapshot contract (`toDisplayObject`) for Alpine,
   - no pricing/rules/business logic in template handlers.
3. Keep identity boundary strict:
   - item definition identity by `itemId`,
   - entry mutation identity by `entryId`.

## Event Contract (UI -> Runtime)

- Flow: `openClientModal`, `selectClient`, `startQuotation`, `advanceToValidation`, `backToBasket`, `resetToBrowse`.
- Settings: `setQuotationSettings`.
- Catalog: `setCatalogSearch`, `toggleCategory`, `shipItemToSelectedDay`.
- Day navigation: `selectDay`.
- Entry mutations: `setEntryOverride`, `clearEntryOverride`, `resetEntryOverrides`, `removeEntry`.
- Day operations: `duplicateEntryInDay`, `copyEntryToDay`, `moveEntryToDay`, `copySelectedDayToNextDay`.

## Implementation Sequence

1. Runtime coordinator + projection contract.
2. Full quotation template shell (legacy behavior-first layout).
3. Mount wiring and Alpine handlers.
4. Step-04 route update (imports required by item rules runtime).
5. Regression tests (`npm test`) and manual flow check.

## Acceptance Criteria

- User can complete: browse -> select client -> configure -> build multi-day basket -> validation preview.
- Catalog item rules and basket item rules remain visible.
- Day and entry operations preserve independent `entryId` behavior.
- No persistence calls are required to use the flow.
- Existing test suite remains green.
