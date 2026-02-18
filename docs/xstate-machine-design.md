# Quotation State Machine (XState Design) - v3

## Parallel Regions Design

This redesign uses **parallel states** to manage quotation workflow and database management independently, yet coordinated.

### Root Structure

```
Root (parallel)
├─ Region 1: quotation_workflow
│  ├─ browse (hub)
│  └─ quotation (hierarchy: initialize → basket → validation → completed)
│
└─ Region 2: database_management
   ├─ closed (initial)
   └─ open (hierarchy: browse_database ↔ modify_row ↔ add_new_row)
```

**Key benefit:** Database changes can be made without losing quotation context. When `CLOSE_DATABASE` is sent, full recalculation catches price changes.

## Region 1: Quotation Workflow

### Browse (Entry Point)
- View previous quotations
- Start new quotation
- Load existing quotation

### Quotation Hierarchy

#### Initialize
- **chooseSource** → **loadingPrevious** | **creatingNew**
- Load previous quotation and initialize basket, or
- Create new blank quotation with client/pax/date/duration

#### Basket (Main Editing State)
- **4 main operations:**
  1. `ADD_ITEM` → Expand compositions → Resolve defaults → Calculate price → Apply item rules → Update totals
  2. `UPDATE_ITEM` → Resolve defaults → Calculate price → Apply rules → Update totals
  3. `REMOVE_ITEM` → Soft-delete (mark `_removed: true`, keep in history) → Update totals
  4. Each mutation triggers **Level 1 recalculation** (incremental, fast)

- Transitions:
  - `ADVANCE_TO_VALIDATION` → validation (guard: has items, no blocking errors)
  - `RETURN_TO_BROWSE` → browse (discard quotation)

#### Validation (Checkout)
- `VALIDATE_AND_SAVE` → Triggers **Level 2 recalculation** (full from scratch):
  1. Strip computed fields
  2. Resolve all item defaults
  3. Calculate all prices
  4. Apply all rules (RESTRICCION_UI, AJUSTE_LINEA, AJUSTE_GLOBAL, IMPUESTO)
  5. Filter out soft-deleted items
  6. Save snapshot to store
  7. Mark quotation as 'Guardada'

- Transitions:
  - `BACK_TO_BASKET` → basket (edit more items)

#### Completed
- Quotation saved and marked as 'Guardada'
- `RETURN_TO_BROWSE` → browse

#### Error
- Catch any errors during initialization or recalculation
- `RETRY` → basket
- `RETURN_TO_BROWSE` → browse

## Region 2: Database Management

Independent parallel region for managing master data.

### Closed (Initial State)
- `OPEN_DATABASE` → open

### Open
- **browse_database** (initial):
  - List and browse clients, catalog items, rules, compositions
  - `SELECT_ROW_TO_MODIFY` → modify_row
  - `SELECT_ADD_NEW` → add_new_row

- **modify_row**:
  - Edit existing row (client, item, rule, etc.)
  - `SAVE_ROW` → browse_database
  - `CANCEL` → browse_database

- **add_new_row**:
  - Create new row
  - `SAVE_ROW` → browse_database
  - `CANCEL` → browse_database

- **Global (from any substate)**:
  - `CLOSE_DATABASE` → closed
    - **Action:** `fullRecalculateOnDatabaseClose` (if quotation is active in Region 1)
    - Catches any price changes from rule/catalog updates

## Context

```js
{
  // Quotation workflow context
  previousQuotations: [],
  quotation: null,                    // null until initialized
  lineas: [],                         // Current line items
  totals: { subtotal: 0, taxes: [], total: 0 },
  store: null,                        // InMemoryStore reference
  messages: [],                       // Informational messages
  errors: [],                         // Error messages (blocking or non-blocking)

  // Database management context
  databaseOpen: false,
  databaseUIState: null,              // 'browse_database' | 'modify_row' | 'add_new_row'
  selectedRowId: null,
  selectedRowData: null,
}
```

## TWO LEVELS OF RECALCULATION

### Level 1: Item-Level (Basket mutations)
**Triggered by:** ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM

**Orchestration (in adapters/actions.js):**
1. Expand compositions (if applicable)
2. Resolve defaults (Q/T/P)
3. Calculate line price
4. Apply item-level rules (RESTRICCION_UI, AJUSTE_LINEA)
5. Update global totals

**Implementation:** Calls pipeline functions directly
- `expandItemCompositions(line, store)`
- `resolveItemDefaults(line, paxGlobal, store)`
- `recalculateItemPrice(line, store)`
- `applyItemRules(line, store)`
- `aggregateBasketTotals(lineas, ajustesManuales, store)`

**Characteristics:**
- Quick, incremental
- Only affects the item(s) being mutated
- Runs immediately after each user action in basket

### Level 2: Basket-Level (Validation)
**Triggered by:** VALIDATE_AND_SAVE (on checkout)
**Also triggered by:** CLOSE_DATABASE (if quotation active in Region 1)

**Orchestration (in adapters/actions.js):**
1. Call `fullRecalculateBasket()` from pricing module
2. If no blocking errors, save snapshot to store
3. Mark quotation as 'Guardada'

**Implementation:** Delegates to pricing module
- `fullRecalculateBasket(lineas, quotation, store)` does:
  - Strip computed fields (keep structural metadata)
  - Resolve all item defaults
  - Calculate all prices
  - Apply all rules (RESTRICCION_UI, AJUSTE_LINEA, AJUSTE_GLOBAL, IMPUESTO)
  - Return lineas, totals, messages, errors

**Characteristics:**
- Deterministic: same input → same result
- Full recalculation from scratch
- Ensures pricing consistency before persistence
- Catches effects of database changes (new rules, updated prices, etc.)

## Events

### Region 1: Quotation Workflow

#### Browse Level
- `VIEW_PREVIOUS_QUOTATIONS` - List previous quotations
- `START_NEW_QUOTATION` - Begin new quotation
- `LOAD_QUOTATION` - Load existing quotation

#### Quotation Initialize
- `LOAD_PREVIOUS` - Choose to load previous
- `CREATE_NEW` - Choose to create new
- `QUOTATION_LOADED` - Previous quotation loaded (payload: quotation data)
- `QUOTATION_INITIALIZED` - New quotation created (payload: paxGlobal, clienteId, etc.)
- `ERROR` - Error during initialization

#### Basket
- `ADD_ITEM` - Add item to basket (payload: itemId, overrides)
- `UPDATE_ITEM` - Update item (payload: lineId, overrides)
- `REMOVE_ITEM` - Remove item (payload: lineId)
- `ADVANCE_TO_VALIDATION` - Move to checkout
- `RETURN_TO_BROWSE` - Abandon quotation

#### Validation
- `VALIDATE_AND_SAVE` - Save quotation
- `BACK_TO_BASKET` - Return to editing

#### Completed
- `RETURN_TO_BROWSE` - Return to browse

### Region 2: Database Management

#### Database Control
- `OPEN_DATABASE` - Open database manager (closed → open)
- `CLOSE_DATABASE` - Close database manager (open → closed, triggers recalc if quotation active)

#### Database Browse
- `SELECT_ROW_TO_MODIFY` - Select row to edit (payload: rowId, rowData)
- `SELECT_ADD_NEW` - Choose to add new row

#### Database Save/Cancel
- `SAVE_ROW` - Save (either new or modified)
- `CANCEL` - Discard changes

## Adapter Architecture

### Guards (adapters/guards.js)
Pure context/event predicates:
- `canMutateBasket`: quotation !== null
- `canAdvanceToValidation`: quotation initialized, has items, no blocking errors
- `canSaveQuotation`: has items, no blocking errors

### Actions (adapters/actions.js)
Thin `assign()` functions that:
1. Parse event parameters
2. Call pricing module functions
3. Return updated context

**Basket mutations:**
- `addItem`: calls pipeline functions for expand → resolve → price → rules → aggregate
- `updateItem`: calls pipeline functions for resolve → price → rules → aggregate
- `removeItem`: soft-delete and aggregate

**Validation:**
- `validateAndSave`: calls `fullRecalculateBasket()`, saves to store, marks 'Guardada'

**Database:**
- `fullRecalculateOnDatabaseClose`: calls `fullRecalculateBasket()` if quotation active, catches price changes

### Services (adapters/services.js)
Async operations (optional for now):
- `saveQuotationService`: Save to store (already done in action)
- `sendQuotationService`: Send via email/webhook (stub)

## Thin Adapter Philosophy

All orchestration logic lives in the **pricing module** (pipeline.js, operations/):
- State machine only routes events and updates context
- Adapters are minimal: parse event → call pricing function → assign result
- No duplicate business logic
- Pricing module is testable independently
- Works as library in external codebases

## Events: How State Interacts With Database

When `CLOSE_DATABASE` occurs while quotation is in basket:
1. `fullRecalculateOnDatabaseClose` action fires
2. Calls `fullRecalculateBasket()` to recalculate with latest rules/prices
3. Updates context with new totals and any new errors/messages
4. Quotation stays in **basket** (or error) state
5. User can proceed to validation or continue editing

This design allows:
- Making catalog/rule/pricing changes while quotation is in progress
- Seeing impact immediately when database closes
- Full pricing consistency without manual "reload"
