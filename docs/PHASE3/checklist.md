# Phase 3 Checklist: Frontend Integration

**Target:** Complete frontend integration with state machine, end-to-end workflow
**Duration:** 4-6 hours remaining
**Status:** 95% complete (components exist, need wiring + testing)

---

## Part 1: Verify Existing Components (45 min)

### 1.1 Local Setup Test (15 min)
- [ ] Open `packages/frontend/Index.html` in browser
- [ ] No JavaScript console errors
- [ ] Alpine.js initialized (check in DevTools)
- [ ] Can see: Sidebar, Timeline, Modal components
- [ ] Day tabs visible in main content
- [ ] Cart initially empty
- [ ] Totals show $0

### 1.2 Machine Initialization (10 min)
- [ ] `window.createCotizadorActor` is a function (not undefined)
- [ ] `Alpine.store('cotizadorApp')` exists
- [ ] Bridge property exists: `store.bridge`
- [ ] Bridge has `send()` and `actor` properties
- [ ] Console shows "Bridge initialized" OR "Using local mode"

### 1.3 Full Workflow Test (20 min)
```javascript
// Copy-paste in browser console:
const store = Alpine.store('cotizadorApp');

// Verify bridge
console.assert(store.bridge, 'Bridge should exist');
console.assert(typeof store.bridge.send === 'function', 'Send method should exist');

// Add item
store.agregarItem({
  ID_Item: 'TEST_ITEM',
  Nombre: 'Test Item',
  Precio_Base: 100
});
console.assert(store.carrito.length === 1, 'Item should be in cart');

// Verify snapshot sync
const snap = store.bridge?.actor?.getSnapshot?.();
if (snap) {
  console.log('Machine state:', snap.value);
  console.log('Context lineas:', snap.context.lineas?.length);
  console.assert(snap.context.lineas?.length === 1, 'Item should be in machine context');
}

console.log('✅ ALL ASSERTIONS PASSED');
```

**Expected Output:**
```
✅ ALL ASSERTIONS PASSED
Machine state: quotation_workflow.basket (or similar)
Context lineas: 1
```

---

## Part 2: Fix Critical Issues (1 hour)

### Issue 1: Race Condition on Catalog Load (30 min)
**File:** `packages/frontend/Stores_App.html` (search for `init()`)

**Current Code:**
```javascript
init() {
  this.generarDias();
  this.cargarCatalogo();  // ← Problem: called before actor loads
  this.initXStateBridge();
}
```

**Problem:** `cargarCatalogo()` calls `google.script.run.getCatalogo()` before `window.localCatalogItems` is populated

**Fix:** Move catalog load to AFTER actor initializes

```javascript
// IN: initXStateBridge()
// AFTER actor successfully loads:
if (actor loaded successfully) {
  this.cargarCatalogo();  // Load catalog now
  this.logSuccess('Bridge and catalog initialized');
}
```

**Verify Fix:**
- [ ] Open browser, catalog loads with items (not empty)
- [ ] Console shows catalog item count
- [ ] Can search in catalog

---

### Issue 2: Bootstrap Auto-Transition (10 min)
**File:** `packages/frontend/src/local/createCotizadorActor.local.js` (line ~16)

**Current Code:**
```javascript
const bootstrap = opts.bootstrap !== false;  // true by default
if (bootstrap) {
  actor.send({ type: 'START_NEW_QUOTATION' });
  // ... auto-transitions to basket
}
```

**Problem:** Machine auto-transitions to basket, user never sees browse state

**Fix:** Change default to false
```javascript
const bootstrap = opts.bootstrap === true;  // false by default
```

**Verify Fix:**
- [ ] Open browser, machine starts in `browse` state
- [ ] Sidebar shows "Seleccionar Cliente"
- [ ] Cart initially hidden or disabled

---

### Issue 3: Missing Client Validation (15 min)
**File:** `packages/frontend/Stores_App.html` (search for `agregarItem()`)

**Current Code:**
```javascript
agregarItem(item) {
  // No check if client is selected!
  if (this.useStateMachine && this.bridge) {
    this.bridge.send('ADD_ITEM', { itemId: item.ID_Item, ... });
  } else {
    this.carrito.push(item);
  }
}
```

**Problem:** Users can add items without selecting client first

**Fix:** Add pre-check
```javascript
agregarItem(item) {
  if (!this.cliente) {
    alert('Debe seleccionar un cliente primero');
    this.modalCliente = true;
    return;
  }
  // ... rest of method
}
```

**Verify Fix:**
- [ ] Try adding item without client → alert appears
- [ ] Modal client selector opens
- [ ] After selecting client, can add items

---

## Part 3: Create Missing Components (3-4 hours)

### TIER 1: MVP (1.5 hours) ⚠️ CRITICAL FOR PHASE 3

#### Component 1: ValidationSummary (30 min)
**Purpose:** Show quotation before save, allow confirm/cancel

**File to Create:** `packages/frontend/Components_ValidationSummary.html`

**Features:**
- Display customer name, dates, pax
- List all line items with prices
- Show subtotal, taxes, discounts, grand total
- Confirm button → VALIDATE_AND_SAVE event
- Cancel button → BACK_TO_BASKET event

**Wire In:** `Index.html` with `x-show="isMachineInValidation()"`

**Testing:**
- [ ] Add items, click Save Quotation
- [ ] Validation view appears
- [ ] All items and totals shown correctly
- [ ] Confirm button saves
- [ ] Cancel button returns to basket

---

#### Component 2: CompletionSuccess (20 min)
**Purpose:** Show success message after save

**File to Create:** `packages/frontend/Components_CompletionSuccess.html`

**Features:**
- Success message: "Cotización guardada exitosamente"
- Display quotation ID (cotizacionId)
- Button: "Crear Nueva" → start new quotation
- Button: "Ver Anterior" → return to browse
- Optional: "Descargar PDF" (Phase 4)
- Optional: "Enviar por Email" (Phase 4)

**Wire In:** `Index.html` with `x-show="isMachineInCompleted()"`

**Testing:**
- [ ] Complete full save flow
- [ ] Success component appears
- [ ] Quotation ID displayed
- [ ] Create new quotation works
- [ ] Return to browse works

---

#### Component 3: Add State Helper Methods (40 min)
**File:** `packages/frontend/Stores_App.html`

**Methods to Add:**
```javascript
isMachineInBrowse() {
  return this.useStateMachine
    && this.machineState?.includes('quotation_workflow.browse');
}

isMachineInBasket() {
  return this.useStateMachine
    && this.machineState?.includes('quotation.basket');
}

isMachineInValidation() {
  return this.useStateMachine
    && this.machineState?.includes('quotation.validation');
}

isMachineInCompleted() {
  return this.useStateMachine
    && this.machineState?.includes('quotation.completed');
}

isMachineInError() {
  return this.useStateMachine
    && this.machineState?.includes('quotation.error');
}

isMachineInInitialize() {
  return this.useStateMachine
    && this.machineState?.includes('quotation.initialize');
}
```

**Update Index.html:**
```html
<!-- Show different views per state -->
<div x-show="isMachineInBrowse()">
  <!-- BrowseQuotations component here -->
</div>

<div x-show="isMachineInInitialize()">
  <!-- InitializeQuotation component here -->
</div>

<div x-show="isMachineInBasket()">
  <?!= include('Components_Sidebar'); ?>
  <?!= include('Components_Timeline'); ?>
</div>

<div x-show="isMachineInValidation()">
  <?!= include('Components_ValidationSummary'); ?>
</div>

<div x-show="isMachineInCompleted()">
  <?!= include('Components_CompletionSuccess'); ?>
</div>

<div x-show="isMachineInError()">
  <!-- Error display component -->
</div>
```

**Testing:**
- [ ] Each x-show evaluates correctly
- [ ] Appropriate view displays for each state
- [ ] No overlapping views

---

### TIER 2: Good UX (1.5 hours) - *If time allows*

#### Component 4: BrowseQuotations (45 min)
**Purpose:** List previous quotations to load/edit

**Features:**
- Table of previous quotations (ID, client, date, total)
- Load button for each → LOAD_QUOTATION event
- New quotation button → START_NEW_QUOTATION event
- Delete button (soft delete) → optional

**Wire In:** `Index.html` with `x-show="isMachineInBrowse()"`

---

#### Component 5: InitializeQuotation (45 min)
**Purpose:** Setup new quotation (client, dates, pax)

**Features:**
- Client picker (search/select)
- Event date input
- Duration (days)
- Pax count
- Create button → QUOTATION_INITIALIZED event

**Wire In:** `Index.html` with `x-show="isMachineInInitialize()"`

---

## Part 4: GAS Deployment Prep (1 hour)

### 4.1 Bundle Build (20 min)
```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
```

**Verify:**
- [ ] No build errors
- [ ] `dist/quotation-engine.iife.js` created
- [ ] Bundle size: ~50KB gzipped
- [ ] Can read: `wc -c dist/quotation-engine.iife.js`

---

### 4.2 Module Path Resolution (20 min)
**Files to Check:**
- `packages/frontend/Local_XState_ActorLoader.html`
- Check import path for `createCotizadorActor.local.js`
- In GAS, update to absolute path or GAS-friendly import

**Verify:**
- [ ] No 404 errors on imports (check Network tab in DevTools)
- [ ] `window.createCotizadorActor` available
- [ ] `window.localCatalogItems` populated

---

### 4.3 Environment Detection (20 min)
**Check:** `packages/frontend/Stores_App.html` and bridge initialization

**Verify GAS Environment:**
- [ ] Detect GAS vs localhost
- [ ] Use real `google.script.run` in GAS
- [ ] Use GAS shim on localhost
- [ ] Store selection: GasSheetStore in GAS, InMemoryStore locally

---

## Part 5: Integration Testing (1 hour)

### 5.1 End-to-End Workflow Test
**Scenario:** Create, edit, and save a quotation

```
1. Open Index.html
2. Select client (e.g., "Lodge Corporate")
3. Add 3 items from different categories
4. Change quantities
5. Verify totals update
6. Save quotation
7. Verify success message shows
8. Create new quotation
9. Add different items
10. Save again
```

**Expected Result:** ✅ Full workflow completes without errors

---

### 5.2 Error Handling Test
**Scenario:** Various error conditions

```
- Try adding item before client selected → should prevent or warn
- Add item with invalid quantity → should handle gracefully
- Network error on save → should display error message
- Missing catalog item → should display error
```

**Expected Result:** ✅ All errors handled gracefully with user feedback

---

### 5.3 State Transition Test
**Scenario:** Verify machine state transitions match UI

```
- Open page → machine in browse
- Select client → machine in initialize
- Add item → machine in basket
- Click save → machine in validation
- Confirm save → machine in completed
- Create new → machine back in browse
```

**Expected Result:** ✅ All transitions correct, UI reflects state

---

## Part 6: Console Testing

**Run this in browser console to verify everything:**

```javascript
// Setup
const store = Alpine.store('cotizadorApp');
const bridge = store.bridge;
const actor = bridge?.actor;
const snap = actor?.getSnapshot?.();

// Tests
console.assert(store, 'Alpine store should exist');
console.assert(bridge, 'Bridge should exist');
console.assert(actor, 'Actor should exist');
console.assert(snap, 'Snapshot should exist');

// State checks
console.log('Current state:', snap?.value);
console.log('Has quotation:', !!snap?.context.quotation);
console.log('Lineas count:', snap?.context.lineas?.length || 0);
console.log('Total:', snap?.context.totals?.total || 0);

// Sample action
store.agregarItem({
  ID_Item: 'TEST',
  Nombre: 'Test Item',
  Precio_Base: 100,
  ID_Categoria: 'TEST_CAT'
});

// Verify
const snap2 = actor?.getSnapshot?.();
console.assert(snap2?.context.lineas?.length > 0, 'Item should be added');
console.log('✅ ALL TESTS PASSED');
```

---

## Success Criteria (Phase 3 Complete)

- [ ] All 3 critical issues fixed
- [ ] TIER 1 components created (ValidationSummary, CompletionSuccess)
- [ ] State helper methods added to Alpine store
- [ ] State conditionals working (correct view per state)
- [ ] Full end-to-end workflow tested
- [ ] No console errors
- [ ] Bundle builds successfully
- [ ] Ready for GAS deployment (Part 4 complete)

---

## Next Steps (Phase 4)

After Phase 3 completion:
1. Implement TIER 2 components (BrowseQuotations, InitializeQuotation)
2. Add PDF generation
3. Add email delivery
4. Production hardening
5. Deploy to GAS

See **../PHASE4/** for Phase 4 roadmap.

