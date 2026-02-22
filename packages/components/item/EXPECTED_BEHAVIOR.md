# Item Expected Behavior

This document describes expected runtime behavior for `item` in the rebuilt stack.

## Scope

- Component: `packages/components/item/`
- Business class: `packages/pricing/src/ItemLogic.js`
- Interaction adapter: `packages/xstate/src/interactions/ItemXStateInteraction.js`

## 1. State modes

- `catalog`
  - show disaggregated pricing expression
  - do not show aggregated totals tied to global quotation context
- `basket`
  - show resolved quantity, line breakdown, aggregated total
  - allow user overrides

## 2. Pricing behavior

- Exactly one active pricing kind per item:
  - `NONE`, `PAX`, `UNITS`, or `TIME`
- `baseFijo` can always coexist with the active pricing kind.
- Basket total formula:
  - `total = baseFijo + (resolvedQuantity * activeRate)`

## 3. Initialization behavior

- Exactly one active initialization mode for the priced quantity:
  - `FIXED_AMOUNT`
  - `CONTEXT_PAX`
  - `CONTEXT_TIME`
- Setting one mode clears conflicting fields for the same dimension.

## 4. Quantity precedence in basket

1. explicit user override
2. initialization mode result

Expected effect:

- non-overridden lines follow initialization/context
- overridden lines keep user value until cleared/reset

## 5. Catalog card expectations

- Primary text: disaggregated price expression (e.g. `400 fijo + 3 und/pax x $1`).
- Secondary hint: initialization policy (`und/persona`, `und/hora`, `min/persona`).
- No global-pax/global-duration aggregation in catalog card display.

## 6. Basket line expectations

- Show only controls affecting the active pricing kind.
- Show breakdown rows only for contributing terms.
- Collapsed subtitle must show legend equivalent to expanded math.
- Overridden line must be visibly marked.

## 7. Rules behavior

- Rule output updates:
  - `available`
  - `appliedRules`
- Blocking rule -> line unavailable state.

## 8. Projection contracts

- `toCatalogCard()` -> catalog-ready object only
- `toBasketLine()` -> basket-ready object only
- `toMachineContext()` -> complete state for bridge/UI consumption

## 9. QA checklist

- Changing profile rates updates catalog expression and basket totals.
- Changing init mode updates catalog policy hint and basket quantity source.
- Overriding quantity adds override marker and changes basket legend.
- Reset overrides removes marker and restores initialized quantity.
- Hidden controls remain hidden when they do not affect pricing.
