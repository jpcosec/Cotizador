# Parallel State Diagram

## Full State Hierarchy

```
Root (parallel)
│
├─ quotation_workflow
│  │
│  ├─ browse
│  │  │ (entry point)
│  │  ├─ VIEW_PREVIOUS_QUOTATIONS → browse (action: listPreviousQuotations)
│  │  ├─ START_NEW_QUOTATION → quotation.initialize
│  │  └─ LOAD_QUOTATION → quotation.initialize (action: loadPreviousQuotation)
│  │
│  └─ quotation
│     ├─ initial: initialize
│     │
│     ├─ initialize
│     │  ├─ initial: chooseSource
│     │  │
│     │  ├─ chooseSource
│     │  │  ├─ LOAD_PREVIOUS → loadingPrevious
│     │  │  └─ CREATE_NEW → creatingNew
│     │  │
│     │  ├─ loadingPrevious
│     │  │  ├─ QUOTATION_LOADED → basket (action: initializeBasketFromLoaded)
│     │  │  └─ ERROR → error (action: captureError)
│     │  │
│     │  └─ creatingNew
│     │     ├─ QUOTATION_INITIALIZED → basket (action: initializeEmptyBasket)
│     │     └─ ERROR → error (action: captureError)
│     │
│     ├─ basket
│     │  │ (main editing state - Level 1 recalculation on each mutation)
│     │  │
│     │  ├─ ADD_ITEM
│     │  │  ├─ guard: canMutateBasket
│     │  │  ├─ target: basket (self-transition)
│     │  │  └─ action: addItem
│     │  │     └─ Calls: expand → resolve → price → rules → aggregate
│     │  │
│     │  ├─ UPDATE_ITEM
│     │  │  ├─ guard: canMutateBasket
│     │  │  ├─ target: basket (self-transition)
│     │  │  └─ action: updateItem
│     │  │     └─ Calls: resolve → price → rules → aggregate
│     │  │
│     │  ├─ REMOVE_ITEM
│     │  │  ├─ guard: canMutateBasket
│     │  │  ├─ target: basket (self-transition)
│     │  │  └─ action: removeItem
│     │  │     └─ Soft-delete + aggregate
│     │  │
│     │  ├─ ADVANCE_TO_VALIDATION
│     │  │  ├─ guard: canAdvanceToValidation
│     │  │  └─ target: validation
│     │  │
│     │  └─ RETURN_TO_BROWSE
│     │     ├─ target: quotation_workflow.browse
│     │     └─ action: discardQuotation
│     │
│     ├─ validation
│     │  │ (checkout state - Level 2 recalculation)
│     │  │
│     │  ├─ VALIDATE_AND_SAVE
│     │  │  ├─ guard: canSaveQuotation
│     │  │  ├─ target: completed
│     │  │  └─ action: validateAndSave
│     │  │     ├─ Calls: fullRecalculateBasket()
│     │  │     ├─ Saves to store
│     │  │     └─ Marks quotation as 'Guardada'
│     │  │
│     │  └─ BACK_TO_BASKET
│     │     └─ target: basket
│     │
│     ├─ completed
│     │  │ (quotation saved)
│     │  │
│     │  └─ RETURN_TO_BROWSE
│     │     ├─ target: quotation_workflow.browse
│     │     └─ action: clearQuotationContext
│     │
│     └─ error
│        │ (error recovery)
│        │
│        ├─ RETRY
│        │  └─ target: basket
│        │
│        └─ RETURN_TO_BROWSE
│           └─ target: quotation_workflow.browse
│
└─ database_management
   │
   ├─ initial: closed
   │
   ├─ closed
   │  │ (database not open)
   │  │
   │  └─ OPEN_DATABASE
   │     └─ target: open
   │
   └─ open
      ├─ initial: browse_database
      │
      ├─ browse_database
      │  │ (view/list mode)
      │  │
      │  ├─ SELECT_ROW_TO_MODIFY
      │  │  ├─ target: modify_row
      │  │  └─ action: selectRowToModify
      │  │
      │  └─ SELECT_ADD_NEW
      │     └─ target: add_new_row
      │
      ├─ modify_row
      │  │ (edit existing row)
      │  │
      │  ├─ SAVE_ROW
      │  │  ├─ target: browse_database
      │  │  └─ action: saveRowModification
      │  │
      │  └─ CANCEL
      │     ├─ target: browse_database
      │     └─ action: cancelRowModification
      │
      ├─ add_new_row
      │  │ (create new row)
      │  │
      │  ├─ SAVE_ROW
      │  │  ├─ target: browse_database
      │  │  └─ action: saveNewRow
      │  │
      │  └─ CANCEL
      │     ├─ target: browse_database
      │     └─ action: cancelAddRow
      │
      └─ [From any substate in open]
         └─ CLOSE_DATABASE
            ├─ target: closed
            └─ action: fullRecalculateOnDatabaseClose
               └─ If quotation active in Region 1:
                  ├─ Calls: fullRecalculateBasket()
                  ├─ Updates lineas, totals, errors
                  └─ Catches price changes from rule/catalog updates
```

## Example Flows

### Flow 1: Basic Quotation (No Database Access)

```
browse
  ↓ [START_NEW_QUOTATION]
quotation.initialize.chooseSource
  ↓ [CREATE_NEW]
quotation.initialize.creatingNew
  ↓ [QUOTATION_INITIALIZED]
quotation.basket
  ↓ [ADD_ITEM] (Level 1 recalc)
quotation.basket
  ↓ [UPDATE_ITEM] (Level 1 recalc)
quotation.basket
  ↓ [ADVANCE_TO_VALIDATION]
quotation.validation
  ↓ [VALIDATE_AND_SAVE] (Level 2 recalc + save)
quotation.completed
  ↓ [RETURN_TO_BROWSE]
browse
```

**Result:** Quotation saved and marked as 'Guardada'

### Flow 2: With Database Changes

```
quotation.basket (editing items)
  ↓
database_management.closed [parallel]
  ↓ [OPEN_DATABASE]
database_management.open.browse_database
  ↓ [SELECT_ROW_TO_MODIFY]
database_management.open.modify_row
  ↓ [SAVE_ROW]
database_management.open.browse_database
  ↓ [CLOSE_DATABASE] ← Triggers fullRecalculateOnDatabaseClose
  ↓
quotation.basket (with updated prices from new rules!)
database_management.closed [parallel]
  ↓ [ADVANCE_TO_VALIDATION]
quotation.validation
  ↓ [VALIDATE_AND_SAVE]
quotation.completed
```

**Key:** Quotation stays in basket while database is open. When closed, prices are automatically recalculated.

### Flow 3: Error Recovery

```
quotation.initialize.creatingNew
  ↓ [ERROR]
quotation.error
  ↓ [RETRY]
quotation.basket (OR)
  ↓ [RETURN_TO_BROWSE]
browse
```

## Parallel Region Behavior

While in quotation.basket AND database is closed:
- Region 1 is active in quotation_workflow.quotation.basket
- Region 2 is active in database_management.closed

When OPEN_DATABASE is sent:
- Region 1 stays in quotation.basket
- Region 2 moves to open.browse_database
- **Both regions progress independently**

When CLOSE_DATABASE is sent:
- Region 2 moves to closed
- fullRecalculateOnDatabaseClose runs
- If Region 1 is in basket, prices update immediately
- User sees new totals without leaving basket

## Level 1 vs Level 2 Recalculation Triggers

### Level 1 (Incremental - during basket editing)
Triggered by:
- ADD_ITEM
- UPDATE_ITEM
- REMOVE_ITEM

Process:
1. Expand compositions
2. Resolve defaults
3. Calculate prices
4. Apply item-level rules
5. Update totals

### Level 2 (Full - before saving)
Triggered by:
- VALIDATE_AND_SAVE (checkout)
- CLOSE_DATABASE (if quotation active)

Process:
1. Strip computed fields
2. For each line: resolve → price → rules
3. Apply global rules
4. Apply manual adjustments
5. Calculate taxes
6. Save snapshot (on VALIDATE_AND_SAVE)
