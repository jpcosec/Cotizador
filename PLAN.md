# PLAN: Phase 3 Frontend Integration Roadmap

**Status:** Phase 3 in progress (95% complete)
**Target:** Complete frontend integration, end-to-end testing, GAS deployment prep
**Duration:** 4-6 hours remaining
**Branch:** v2

---

## Critical Issues to Fix (1 hour)

### Issue 1: Race Condition on Catalog Load (30 min)
**Problem:** `cargarCatalogo()` called before actor factory loads → catalog shows empty

**Timeline:**
```
T=0ms:   init() starts, cargarCatalogo() called
T=5ms:   window.localCatalogItems undefined (actor still loading)
T=100ms: Actor factory done, too late - catalog already loaded empty
```

**Fix:** Reorder initialization to load catalog AFTER actor factory completes

**Changes:**
```javascript
// In initXStateBridge(), after actor loads successfully:
if (actor loaded) {
  this.cargarCatalogo();  // Move here instead of init()
}
```

**Impact:** Catalog will load correctly on localhost

---

### Issue 2: Bootstrap Auto-Transition (10 min)
**Problem:** `createCotizadorActor.local.js` has `bootstrap = opts.bootstrap !== false` (defaults to true)

**Current behavior:** Machine auto-transitions from browse → basket on startup
**Expected behavior:** Start in browse state, wait for user interaction

**Fix:** Change default
```javascript
// BEFORE
const bootstrap = opts.bootstrap !== false;  // true

// AFTER
const bootstrap = opts.bootstrap === true;  // false by default
```

**Impact:** UX improves - users see browse state first

---

### Issue 3: Missing Client Validation (15 min)
**Problem:** `agregarItem()` doesn't check if client was selected

**Fix:** Add validation
```javascript
agregarItem(item) {
  if (!this.cliente) {
    alert('Debe seleccionar un cliente primero');
    this.modalCliente = true;
    return;
  }
  // ... rest of add logic
}
```

**Impact:** Prevents invalid state transitions

---

## Missing HTML Components (3-4 hours)

### TIER 1: MVP (1.5 hours) ⚠️ CRITICAL

**1. ValidationSummary Component (30 min)**
- Show quotation summary before save
- Display items, quantities, prices, totals
- Confirm or cancel

**2. CompletionSuccess Component (20 min)**
- Show success message with quotation ID
- Allow save PDF / send email / start new

**3. State Conditionals in Index.html (40 min)**
- Add helper methods: `isMachineInBrowse()`, `isMachineInBasket()`, `isMachineInValidation()`, `isMachineInCompleted()`, `isMachineInError()`
- Wrap sections with `x-show` conditionals
- Only show appropriate view per state

**4. Save/Cancel Buttons (10 min)**
- Add to basket view
- Wire to machine events

---

### TIER 2: Good UX (1.5 hours)

**1. BrowseQuotations Component (45 min)**
- List previous quotations
- Load/edit buttons for each
- Maps to browse state

**2. InitializeQuotation Component (45 min)**
- Client selection form
- Date/pax/duration fields
- Maps to initialize.creatingNew state

---

### TIER 3: Polish (2.5 hours) → Defer to Phase 4

**1. DatabaseEditor Component (1.5 hours)**
- Catalog editing modal
- Browse/modify/add rows
- Auto-recalculate on close

**2. ErrorState Component (20 min)**
- Error message display
- Retry/cancel actions

**3. PDF & Email Features (45 min)**
- Generates PDF from saved quotation
- Email delivery service

---

## Verification Checklist (Part 1 - 45 min)

Before implementing new components, verify existing integration works:

### ✅ Local Setup (15 min)
- [ ] Open Index.html in browser
- [ ] No console errors
- [ ] Catalog visible
- [ ] Can select client
- [ ] Can add items
- [ ] Cart updates in real-time
- [ ] Totals calculated correctly

### ✅ Machine Initialization (10 min)
- [ ] `window.createCotizadorActor` is a function (actor factory loaded)
- [ ] `Alpine.store('cotizadorApp')` exists
- [ ] `bridge` property exists and has `send()` method
- [ ] Console shows "Bridge initialized" OR "Machine not available, using local mode"

### ✅ Full Workflow Test (20 min)
```javascript
// Copy-paste in browser console:
const store = Alpine.store('cotizadorApp');
console.assert(store.bridge, 'Bridge should exist');

// Add item
store.agregarItem({ID_Item: 'TEST', Nombre: 'Test Item', Precio_Base: 100});
console.assert(store.carrito.length === 1, 'Item should be in cart');

// Check snapshot
const snap = store.bridge?.actor?.getSnapshot?.();
if (snap) {
  console.log('Machine state:', snap.value);
  console.log('Carrito in context:', snap.context.lineas?.length);
}
```

---

## Implementation Order (Recommended)

1. **Fix 3 critical issues** (1 hour)
   - Race condition
   - Bootstrap default
   - Client validation

2. **Implement TIER 1** (1.5 hours)
   - ValidationSummary
   - CompletionSuccess
   - State conditionals
   - Save/Cancel buttons

3. **Test integration** (1 hour)
   - Full workflow tests
   - Error scenarios
   - State transitions

4. **Implement TIER 2** (1.5 hours) - *If time allows*
   - BrowseQuotations
   - InitializeQuotation

5. **GAS deployment prep** (1 hour)
   - Bundle verification
   - Module paths
   - Environment detection

**Total:** 5.5-7 hours remaining for full Phase 3 completion

---

## Success Criteria

- [ ] All 3 critical fixes implemented
- [ ] TIER 1 components created and wired
- [ ] State machine properly transitions through states
- [ ] UI updates correctly for each state
- [ ] No console errors in browser
- [ ] Full quotation workflow works end-to-end
- [ ] Bundle builds successfully
- [ ] Ready for GAS deployment

---

## Next Immediate Task

**→ Start with fixing the 3 critical issues** (1 hour)
- Run ENTRY_INITIALIZATION_ANALYSIS.md test checklist (T1-T5)
- Verify catalog loads correctly
- Confirm machine initializes to browse state
- Test client selection flow

Then proceed with TIER 1 components.

