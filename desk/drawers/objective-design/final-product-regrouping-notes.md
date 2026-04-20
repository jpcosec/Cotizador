# Final Product Regrouping Notes

This note captures what the `component-view-stage-matrix-final-product.yaml` is assuming.

## Principle

The final-product matrix is **not** a clean-sheet invention.

It tries to answer:

> What future product structure can be reached mostly by regrouping current elements?

That means the matrix favors:

- re-composition of existing quotation units
- promotion of editor-like surfaces into first-class views
- explicit shell/view separation

and avoids assuming:

- entirely new domain engines
- entirely new persistence model
- entirely new runtime foundations

## Regrouping Assumptions

### 1. Existing quotation flow can be split into clearer outer views

Current shell behavior already suggests these reusable families:

- `Home`
- `Nueva Cotizacion`
- `Editor Cotizacion`
- `Validador`

### 2. Existing DB-related tools can be promoted into stable view families

Current and planned editor surfaces can be regrouped into:

- `Formulario Generico DB`
- `Formulario Especifico DB`

### 3. Current quotation internals can be renamed/re-grouped rather than rewritten first

Likely regroupable units:

- `ClientSelection`
- `GlobalContext`
- `Catalog`
- `Category`
- `DaySelector`
- `TimelineEditor`
- `Basket`
- `BasketDay`
- `ValidationSummary`

### 4. A reusable `View` meta-component is the missing outer-layer abstraction

Without that abstraction, the shell stays as ad-hoc route/screen glue.

With it, the product can move toward:

```text
AppShell
  -> View
    -> Stage
      -> Units
```

And more specifically, in the original intended model:

```text
Persistence / Export
  -> View
    -> Container
      -> Item
```

Where:

- `View` is the first orchestration unit
- `Container` means structures like `Basket` and `Catalog`
- containers may contain items or other containers (`Catalog -> Category -> Item`)
- `Item` computes local pricing from local quantities
- upper layers collect totals/results upward

## What Is Still Not Solved By Regrouping Alone

- full pack/group behavior semantics
- richer rule-authoring UX
- high-fidelity PDF export pipeline
- a fully unified Store facade in code
- complete separation between projection and shell orchestration

So the final-product matrix should be read as:

- structurally achievable soon
- not fully behaviorally complete yet

## Original Flow Rule To Preserve

- rules flow up and down
- quantities flow up and down
- pricing is calculated by each item from its quantities
- upper layers collect totals upward

This should remain true even after regrouping into clearer views.
