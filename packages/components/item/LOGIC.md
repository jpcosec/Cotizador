# Item Pricing + Initialization Logic (Step 03 spec)

This document defines the simplified behavior requested for item cards in `catalog` and `basket`.

## 1) Core principles

- An item has exactly **one** pricing quantity kind.
- Quantity initialization has exactly **one** active mode.
- Catalog is **disaggregated** and **not coupled to global context values**.
- Basket is **aggregated**, context-aware, and override-aware.
- UI must hide controls/values that do not affect current price.

## 2) Pricing quantity kind

Exactly one of these:

- `NONE`: no variable quantity pricing, only fixed base.
- `PAX`: quantity priced by people count.
- `UNITS`: quantity priced by item/unit count.
- `TIME`: quantity priced by minutes (or duration).

`baseFijo` can coexist with any kind.

## 3) Initialization mode (exclusive)

Exactly one active initialization mode per item:

- `FIXED_AMOUNT`
  - quantity is a fixed numeric amount (e.g. `cantidad = 60`, `pax = 20`, `duracion = 120`).
- `CONTEXT_PAX`
  - quantity depends on pax context (e.g. `unitsPerPax`, `minutesPerPax`).
- `CONTEXT_TIME`
  - quantity depends on time context (e.g. `unitsPerHour`, `minutesPerHour`).

## 4) Resolver formulas

Let:

- `B` = `baseFijo`
- `R` = rate for the pricing kind (`porPersona`, `porUnidad`, or `porMinuto`)
- `Q` = resolved quantity
- `Total = B + (Q * R)`

### Basket quantity resolution

Priority:

1. `overrideQuantity` (if user changed the line)
2. initialization mode (`FIXED_AMOUNT` or context-driven)

Rules:

- `FIXED_AMOUNT` -> `Q = fixedAmount`
- `CONTEXT_PAX` -> `Q = contextPax * amountPerPax` (or direct `contextPax` when kind=`PAX`)
- `CONTEXT_TIME` -> `Q = contextTimeHours * amountPerHour` (or direct `contextMinutes` when kind=`TIME`)

### Catalog disaggregated expression

Catalog must avoid concrete global context values. Show formula terms as rates:

- Example: `B + (unitsPerPax x R) por pax`
- Example: `B + (unitsPerHour x R) por hora`
- Example fixed: `B + (fixedAmount x R)`

Catalog can show a synthetic interpreted label (derived rate), for example:

- `400 fijo + 3 und/pax x $1` (or equivalent `400 fijo + $3 por pax`)

## 5) Catalog rendering contract

Each card shows:

1. **Primary line**: disaggregated price expression for the active logic.
2. **Secondary line**: initialization policy hint (`und/pax`, `und/h`, `min/pax`, etc).
3. No aggregated total from global quotation context.

## 6) Basket rendering contract

Each line shows:

- Effective quantity controls relevant to active logic.
- Price breakdown terms that actually contribute to total.
- Aggregated total with resolved quantity.

Collapsed legend must include a concise active-pricing summary, for example:

- `400 fijo + (60 und x 1) = 460`
- `400 fijo + (3 und/pax x 20 pax x 1) = 460`

## 7) UI visibility rules

Hide non-affecting controls and rows.

Examples:

- If kind=`PAX`, hide unit/time quantity controls.
- If kind=`UNITS`, show only unit-driving controls.
- If init=`FIXED_AMOUNT`, hide context dependency fields.
- If init=`CONTEXT_PAX`, hide fixed amount for that same dimension.

## 8) Override semantics

- Any user change to priced quantity in basket sets `isOverridden=true` for that line.
- Overridden lines display a clear marker (badge/outline/icon).
- Reset action restores initialized behavior and clears override marker.

## 9) Consistency constraints

- Do not allow mixed initialization modes simultaneously for the same priced quantity.
- Do not allow more than one active pricing quantity kind.
- Do not display values that are not used in current total.

## 10) Acceptance criteria

- Changing initialization logic updates catalog disaggregated expression immediately.
- Catalog expression does not depend on `paxGlobal`/global duration values.
- Basket total changes with global context only for non-overridden lines.
- Override marker appears/disappears correctly.
- Collapsed basket legend matches expanded breakdown math.
