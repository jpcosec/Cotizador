# App View to Units Map

## Outer Layer Pipeline

```text
browse -> client -> basket -> validation -> completed
```

This map only describes the **outer app views** and the conceptual **units** that exist inside each one.

---

## `browse`

### Primary role

Entry stage for starting, loading, or searching quotations.

### Units present

- `QuotationFlow`
- `Persistence`

### Notes

- This is the shell entrypoint.
- It exposes start/load/search affordances, but does not yet host the working quotation units.

---

## `client`

### Primary role

Select the active client before entering quotation editing.

### Units present

- `QuotationFlow`
- `ClientSelection`
- `Store`

### Notes

- `ClientSelection` queries/selects client records through the store boundary.
- The result of this stage is an active client passed back into the flow.

---

## `basket`

### Primary role

Main quotation construction stage. This is the densest app view.

### Units present

- `QuotationFlow`
- `Catalog`
- `Category`
- `Item` (catalog mode)
- `Basket`
- `BasketDay`
- `Item` (basket mode)
- `PricingEngine`
- `Store`

### Notes

- `Catalog` is the source of selectable sellable units.
- `Category` groups catalog items.
- `Item` exists twice conceptually here:
  - as a catalog unit
  - as a basket/scheduled unit
- `Basket` and `BasketDay` hold the working quotation state.
- `PricingEngine` and rule evaluation are exercised mainly through item behavior in this stage.
- `Store` is used for selective data access and resolved definitions.

---

## `validation`

### Primary role

Review the quotation before saving/exporting.

### Units present

- `QuotationFlow`
- `ValidationSummary`
- `Persistence`
- `Export`

### Notes

- `ValidationSummary` is the review/read-model surface.
- `Persistence` is triggered from here for final save.
- `Export` is exposed from here for CSV/PDF-print actions.

---

## `completed`

### Primary role

Final confirmation stage after save succeeds.

### Units present

- `QuotationFlow`
- `Persistence`

### Notes

- This stage reflects the successful result of the persistence boundary.
- It is a terminal confirmation view, not a quotation editing surface.

---

## Cross-View Notes

- `QuotationFlow` exists in every outer-layer view because it is the app shell unit.
- `Store` is not a visual unit, but it participates where selective data access is required.
- `PricingEngine` is not an outer-layer visual unit either, but it is especially active in `basket` through item computation and rules.
- `Persistence` appears conceptually in `browse`, `validation`, and `completed` because those are the stages where load/save outcomes are surfaced at the shell level.
