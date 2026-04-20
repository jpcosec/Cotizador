# Signal Vocabulary

## Goal

Standardize the signals flowing between `View`, `Container`, `Item`, `Store`, `Persistence`, and `Export`.

Signals should express intent, not implementation details.

---

## View-Level Signals

### Navigation / Stage

- `OPEN_VIEW`
- `CLOSE_VIEW`
- `ENTER_STAGE`
- `EXIT_STAGE`
- `NEXT_STAGE`
- `PREVIOUS_STAGE`
- `RESET_FLOW`

### Shell / Projection

- `REGISTER_UNIT`
- `UNREGISTER_UNIT`
- `REFRESH_PROJECTION`
- `SET_VISIBLE_UNITS`

### Persistence / Export

- `REQUEST_SAVE`
- `SAVE_DONE`
- `SAVE_ERROR`
- `REQUEST_LOAD`
- `LOAD_DONE`
- `LOAD_ERROR`
- `REQUEST_EXPORT_PDF`
- `REQUEST_EXPORT_EXCEL`

---

## Container-Level Signals

### Structure

- `ADD_CHILD_CONTAINER`
- `ADD_CHILD_ITEM`
- `REMOVE_CHILD`
- `REORDER_CHILD`
- `SELECT_CHILD`

### Context / Mutation

- `SET_CONTEXT`
- `PATCH_CONTEXT`
- `APPLY_MUTATION`
- `PROPAGATE_CONTEXT`
- `REQUEST_AGGREGATE`

### Child Feedback

- `CHILD_SNAPSHOT_UPDATED`
- `CHILD_QUANTITY_CHANGED`
- `CHILD_PRICING_CHANGED`
- `CHILD_RULES_CHANGED`
- `CHILD_AVAILABILITY_CHANGED`

---

## Item-Level Signals

### Core Mutation

- `SET_OVERRIDE`
- `CLEAR_OVERRIDE`
- `RESET_OVERRIDES`
- `SET_MODE`
- `SET_CONTEXT`

### Recalculation

- `REQUEST_QUANTITY_RECALC`
- `REQUEST_PRICING_RECALC`
- `REQUEST_RULE_EVAL`
- `REQUEST_SNAPSHOT`

### Emitted Upward

- `QUANTITY_CHANGED`
- `PRICING_CHANGED`
- `RULES_CHANGED`
- `AVAILABILITY_CHANGED`
- `SNAPSHOT_UPDATED`

---

## Store Signals

### Read

- `REQUEST_CLIENT`
- `REQUEST_CLIENTS`
- `REQUEST_ITEM`
- `REQUEST_ITEMS`
- `REQUEST_FAMILY`
- `REQUEST_CATEGORY`
- `REQUEST_QUOTATION`
- `REQUEST_QUOTATIONS`

### Write

- `PERSIST_QUOTATION`
- `PERSIST_ENTITY`
- `DELETE_ENTITY`

### Returned

- `STORE_RESULT`
- `STORE_ERROR`

---

## Semantics Rules

- Signals should be noun/verb intent oriented, not UI wording.
- A signal should be valid even if Alpine disappears and another UI layer is used.
- Containers and items should emit upward state-change signals instead of mutating parents directly.
- View-level signals should describe flow control, not domain calculations.
- Pricing/rule evaluation should be requested explicitly or triggered by mutation, then emitted upward as results.
