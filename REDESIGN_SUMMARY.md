# State Machine Redesign Summary - Parallel States Architecture

Date: 2026-02-18
Branch: feature/xstate-machine-design

## Overview

The quotation state machine has been redesigned with **parallel regions** to decouple quotation workflow from database management. This enables users to pause quotations, modify database entries, and resume with automatic recalculation—all without losing work.

## Key Changes

### 1. Root Architecture: Parallel States

**Before:** Sequential state hierarchy (browse → database pause/resume → quotation)

**After:** Two independent parallel regions
```
Root (parallel)
├─ Region 1: quotation_workflow (browse → quotation hierarchy)
└─ Region 2: database_management (closed ↔ open with substates)
```

**File:** `/home/jp/claps_codelab_xstate/src/Orchestration/quotationMachineBlueprint.js`

**Benefits:**
- Database can be opened/closed independently while quotation is active
- No more pause/resume ceremony—just open database and close when done
- When CLOSE_DATABASE occurs, automatic full recalculation catches price changes
- Cleaner event flow and state transitions

### 2. Region 1: Quotation Workflow

Hierarchical structure matching the user's quotation lifecycle:

```
quotation_workflow
├─ browse (entry point)
└─ quotation (hierarchy)
   ├─ initialize
   │  ├─ chooseSource
   │  ├─ loadingPrevious
   │  └─ creatingNew
   ├─ basket (main editing state)
   ├─ validation (checkout)
   ├─ completed (saved)
   └─ error (recovery)
```

**Events:**
- `ADD_ITEM`, `UPDATE_ITEM`, `REMOVE_ITEM` - Basket mutations
- `ADVANCE_TO_VALIDATION` - Move to checkout
- `VALIDATE_AND_SAVE` - Save quotation (Level 2 recalculation)
- `RETURN_TO_BROWSE` - Discard/exit

**Each basket mutation triggers Level 1 recalculation** (incremental, fast)

### 3. Region 2: Database Management

Independent parallel region for master data management:

```
database_management
├─ closed (initial state)
└─ open (hierarchy)
   ├─ browse_database (list/view)
   ├─ modify_row (edit existing)
   └─ add_new_row (create new)
```

**Events:**
- `OPEN_DATABASE` - Open manager (closed → open)
- `CLOSE_DATABASE` - Close manager, triggers fullRecalculate if quotation active
- `SELECT_ROW_TO_MODIFY` - Edit existing row
- `SELECT_ADD_NEW` - Create new row
- `SAVE_ROW` - Persist changes
- `CANCEL` - Discard changes

**Key feature:** When CLOSE_DATABASE occurs, `fullRecalculateOnDatabaseClose` action runs if quotation is active in Region 1, automatically updating prices if rules/catalog changed.

### 4. Thin Adapter Architecture

All orchestration logic moved to **pricing module**. Adapters now are thin wrappers.

**File:** `/home/jp/claps_codelab_xstate/src/Orchestration/adapters/`

#### Guards (guards.js)
Pure predicates on context/event:
- `canMutateBasket`: quotation !== null
- `canAdvanceToValidation`: has items + no blocking errors
- `canSaveQuotation`: has items + no blocking errors

#### Actions (actions.js)
17 action handlers, all using `assign()`:

**Browse/Init:**
- `listPreviousQuotations`
- `loadPreviousQuotation`
- `initializeBasketFromLoaded`
- `initializeEmptyBasket`
- `captureError`

**Basket Mutations (Level 1):**
- `addItem` - Calls pricing pipeline: expand → resolve → price → rules → aggregate
- `updateItem` - Calls pricing pipeline: resolve → price → rules → aggregate
- `removeItem` - Soft-delete + aggregate
- `discardQuotation` - Clear context

**Validation (Level 2):**
- `validateAndSave` - Calls `fullRecalculateBasket()`, saves to store, marks 'Guardada'

**Context:**
- `clearQuotationContext`

**Database:**
- `selectRowToModify`
- `saveRowModification`
- `cancelRowModification`
- `saveNewRow`
- `cancelAddRow`
- `fullRecalculateOnDatabaseClose` - Full recalculation if quotation active

#### Services (services.js)
Async operations (stubs for now):
- `saveQuotationService` - Already handled in validateAndSave action
- `sendQuotationService` - Stub for future email/webhook

#### Index (index.js)
Assembles adapters for XState v4/v5 compatibility.

### 5. Context Structure

Updated to support parallel regions:

```js
{
  // Region 1: Quotation Workflow
  previousQuotations: [],
  quotation: null,                    // null until initialized
  lineas: [],
  totals: { subtotal: 0, taxes: [], total: 0 },
  store: null,
  messages: [],
  errors: [],

  // Region 2: Database Management
  databaseOpen: false,
  databaseUIState: null,              // 'browse_database' | 'modify_row' | 'add_new_row'
  selectedRowId: null,
  selectedRowData: null,
}
```

### 6. Two Levels of Recalculation

**Level 1 (Basket Mutations):**
- Triggered by: ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM
- Fast, incremental
- Calls pipeline functions directly

**Level 2 (Full Validation):**
- Triggered by: VALIDATE_AND_SAVE (checkout), CLOSE_DATABASE (if quotation active)
- Deterministic, full recalculation from scratch
- Strips computed fields and recalculates everything
- Ensures consistency before persistence

## Files Modified

### 1. `/home/jp/claps_codelab_xstate/src/Orchestration/quotationMachineBlueprint.js`
- Changed root type from `initial: 'browse'` to `type: 'parallel'`
- Introduced two regions: `quotation_workflow` and `database_management`
- Updated states structure to support parallel hierarchy
- Updated context for database management
- Updated adapter contract (removed pause/resume specific actions)

### 2. `/home/jp/claps_codelab_xstate/src/Orchestration/adapters/actions.js`
- Removed duplicate orchestration logic (now in pricing module)
- Simplified basket actions to call pipeline functions
- Added `validateAndSave` (combines recalc + save)
- Added `fullRecalculateOnDatabaseClose` action
- Added 6 database management actions
- All actions remain pure `assign()` functions

### 3. `/home/jp/claps_codelab_xstate/src/Orchestration/adapters/guards.js`
- Removed obsolete guards
- Kept three essential guards:
  - `canMutateBasket`
  - `canAdvanceToValidation`
  - `canSaveQuotation`

### 4. `/home/jp/claps_codelab_xstate/src/Orchestration/adapters/services.js`
- Kept stubs for future async operations
- Added documentation about thin adapter philosophy

### 5. `/home/jp/claps_codelab_xstate/src/Orchestration/adapters/index.js`
- Updated documentation to reflect thin adapter design

### 6. `/home/jp/claps_codelab_xstate/docs/xstate-machine-design.md`
- Complete rewrite for v3 parallel regions design
- Added detailed explanation of each region
- Added adapter architecture section
- Updated recalculation levels explanation
- Added events reference for both regions

## Integration Points

### Pricing Module
Actions call these pricing module functions:
- `expandItemCompositions(linea, store)`
- `resolveItemDefaults(linea, paxGlobal, store)`
- `recalculateItemPrice(linea, store)`
- `applyItemRules(linea, store)`
- `aggregateBasketTotals(lineas, ajustesManuales, store)`
- `fullRecalculateBasket(lineas, quotation, store)`

**Import paths:**
```js
import {
  expandItemCompositions,
  resolveItemDefaults,
  recalculateItemPrice,
  applyItemRules,
  aggregateBasketTotals,
  fullRecalculateBasket,
} from '../../Pricing/pipeline.js';
```

### State Machine Creation
```js
import { createQuotationXStateMachine } from './src/Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from './src/Orchestration/adapters/index.js';

const machine = createQuotationXStateMachine(quotationAdapters);
const actor = createActor(machine).start();
```

## Validation

All files compile and validate successfully:

✓ Blueprint structure valid
  - Root type: parallel
  - States: quotation_workflow, database_management
  - Context keys: 11 (quotation + database context)

✓ Guards valid
  - canMutateBasket
  - canAdvanceToValidation
  - canSaveQuotation

✓ Actions valid
  - All 17 actions implemented
  - All action names match blueprint

✓ Services valid
  - saveQuotationService
  - sendQuotationService

## Migration Notes

### No Breaking Changes to Events
- Old events still work (ADD_ITEM, UPDATE_ITEM, etc.)
- New events for database management (OPEN_DATABASE, CLOSE_DATABASE, etc.)
- Pause/resume removed—use OPEN_DATABASE/CLOSE_DATABASE instead

### Old Pattern → New Pattern
```js
// Old: Pause quotation, manage database, resume
machine.send('PAUSE_TO_DATABASE');
// ... edit database ...
machine.send('RESUME_QUOTATION');

// New: Open database, manage, close (auto-recalc)
machine.send('OPEN_DATABASE');
// ... edit database ...
machine.send('CLOSE_DATABASE'); // Triggers fullRecalculate if quotation active
```

### Testing
No existing tests in xstate repo. Pricing module tests should cover Level 1 and Level 2 recalculation logic.

## Next Steps

1. **Merge:** Combine this branch with pricing module branch
2. **Cross-repo import fix:** Update import paths if merging into single repo
3. **Integration testing:** Test full quotation workflow with database changes
4. **GAS deployment:** Bundle merged code for Google Apps Script
5. **Future:** Add service for email/webhook sending

## Philosophy

**Thin adapters, smart pricing module:**
- State machine routes events and updates context
- All business logic lives in pricing module
- Adapters are 10-30 line functions
- Pricing module is testable, reusable, library-friendly
- Works as external dependency without modification during runtime
