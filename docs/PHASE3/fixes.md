# Phase 3: Critical Fixes Required

**Duration:** ~1 hour to implement and verify
**Priority:** Must complete before other Phase 3 work

---

## Fix 1: Race Condition on Catalog Load (30 min)

### The Problem

Catalog loads empty on localhost because `cargarCatalogo()` is called before the actor factory finishes loading.

**Timeline:**
```
T=0ms:     Page loads, init() called
T=0ms:     generarDias() ✅ (instant)
T=0ms:     cargarCatalogo() called
           → google.script.run.getCatalogo()
           → GAS shim checks for window.localCatalogItems
T=5ms:     window.localCatalogItems is UNDEFINED
T=5ms:     Catalog set to [] (empty!)
           ❌ Success callback fires with empty array
T=100ms:   Dynamic import completes
T=100ms:   window.localCatalogItems NOW populated
T=100ms:   Too late - catalog already loaded empty
```

**Impact:**
- ❌ On localhost: Catalog appears empty on initial page load
- ✅ On GAS: Should work fine (real google.script.run is fast)
- ⚠️ User sees blank sidebar until bridge retries

### The Fix

Move `cargarCatalogo()` to AFTER actor factory completes loading.

**File:** `packages/frontend/Stores_App.html`

**Current Code:**
```javascript
init() {
  this.generarDias();        // Instant ✅
  this.cargarCatalogo();     // Race condition ❌
  this.initXStateBridge();   // Async with retries
}
```

**Updated Code:**
```javascript
init() {
  this.generarDias();        // Instant ✅
  this.initXStateBridge();   // Initialize bridge (which waits for actor)
  // cargarCatalogo() moved into initXStateBridge success callback
}

initXStateBridge(attempt = 0) {
  const self = this;
  attempt = attempt || 0;
  const maxAttempts = 10;

  // Check if actor factory has loaded
  if (typeof window.createCotizadorActor !== 'function') {
    if (attempt < maxAttempts) {
      // Retry
      attempt++;
      setTimeout(() => self.initXStateBridge(attempt), 100);
      return;
    } else {
      // Fallback to local mode
      this.useStateMachine = false;
      console.warn('Machine not available, using local mode');
      this.cargarCatalogo();  // Load catalog in local mode
      return;
    }
  }

  // Actor factory loaded! ✅
  try {
    const actor = window.createCotizadorActor({ bootstrap: false });
    this.bridge = new AlpineXStateBridge(actor);
    this.useStateMachine = true;

    // NOW load catalog (after actor is ready)
    this.cargarCatalogo();  // ← Moved here

    console.log('✅ Bridge initialized');
  } catch (error) {
    console.error('Bridge initialization failed:', error);
    this.useStateMachine = false;
    this.cargarCatalogo();  // Fallback to local mode
  }
}
```

**Verify Fix:**
```bash
1. Open Index.html in browser
2. Check console for: "✅ Bridge initialized"
3. Check sidebar: Should show catalog with items
4. Search catalog: Should filter items correctly
5. Check Network tab: No 404 errors on .js imports
```

**Success Indicator:**
```
✅ Catalog loads with items (not empty)
✅ Console shows "Bridge initialized"
✅ Can search and select items from catalog
```

---

## Fix 2: Bootstrap Auto-Transition (10 min)

### The Problem

The local actor factory auto-transitions from `browse` → `basket` on startup, skipping the browse state.

**Current behavior:**
1. Page loads
2. Actor created with `bootstrap=true` by default
3. Actor auto-sends: START_NEW_QUOTATION → CREATE_NEW → QUOTATION_INITIALIZED
4. Machine jumps directly to `basket` state
5. User never sees `browse` state with "Create New / Load Previous" options

**Why it's wrong:**
- UX suggests quotation already started (confusing)
- User hasn't selected a client yet
- Should start in `browse` state, let user choose

### The Fix

Change the default value of `bootstrap` from `true` to `false`.

**File:** `packages/frontend/src/local/createCotizadorActor.local.js`

**Current Code (Line ~16):**
```javascript
const bootstrap = opts.bootstrap !== false;  // true by default!
if (bootstrap) {
  actor.send({ type: 'START_NEW_QUOTATION' });
  // ... auto-transitions
}
```

**Updated Code:**
```javascript
const bootstrap = opts.bootstrap === true;  // false by default
if (bootstrap) {
  actor.send({ type: 'START_NEW_QUOTATION' });
  // ... only if explicitly requested
}
```

**Or explicitly pass false when creating:**
```javascript
// In initXStateBridge():
const actor = window.createCotizadorActor({ bootstrap: false });
```

**Verify Fix:**
```bash
1. Open Index.html
2. Check browser console for machine state
   → Should be: "quotation_workflow.browse"
3. Should see:
   - "Seleccionar Cliente" button
   - Catalog in sidebar
   - Empty cart
   - "Crear Nueva Cotización" / "Cargar Anterior" options (if component exists)
```

**Success Indicator:**
```
✅ Machine starts in browse state
✅ Sidebar shows client selection button
✅ Cart is empty initially
✅ No pre-filled quotation data
```

---

## Fix 3: Missing Client Validation (15 min)

### The Problem

Users can add items to cart without selecting a client first, which violates business logic.

**Current behavior:**
1. User opens page
2. Tries to add item without selecting client
3. Item is added (no validation)
4. Machine might be in invalid state

**Why it's wrong:**
- Quotation needs a client ID
- Can't save without client
- Guard `canMutateBasket` requires quotation initialized

### The Fix

Add pre-validation in `agregarItem()` method.

**File:** `packages/frontend/Stores_App.html`

**Current Code:**
```javascript
agregarItem(item) {
  if (this.useStateMachine && this.bridge) {
    this.bridge.send('ADD_ITEM', {
      itemId: item.ID_Item,
      overrides: { cantidad: 1 }
    });
  } else {
    this.carrito.push(item);
  }
}
```

**Updated Code:**
```javascript
agregarItem(item) {
  // Check if client selected
  if (!this.cliente) {
    alert('Debe seleccionar un cliente primero');
    this.modalCliente = true;  // Open client selection modal
    return;  // Don't add item
  }

  if (this.useStateMachine && this.bridge) {
    this.bridge.send('ADD_ITEM', {
      itemId: item.ID_Item,
      overrides: { cantidad: 1 }
    });
  } else {
    this.carrito.push(item);
  }
}
```

**Verify Fix:**
```bash
1. Open Index.html
2. WITHOUT selecting client, click an item in catalog
3. Should see: alert "Debe seleccionar un cliente primero"
4. Modal for client selection opens
5. Select a client
6. Try adding item again
7. Should succeed, item appears in cart
```

**Success Indicator:**
```
✅ Alert appears when no client selected
✅ Client modal opens
✅ After client selection, can add items
✅ Item appears in cart correctly
```

---

## Combined Testing: All 3 Fixes

**Test script to verify all fixes work together:**

```javascript
// Copy-paste in browser console after implementing fixes

console.clear();
console.log('🧪 Testing all 3 fixes...\n');

const store = Alpine.store('cotizadorApp');

// Test 1: Catalog loaded (Fix 1)
console.log('Test 1: Catalog Load (Race Condition Fix)');
console.assert(store.catalogo.length > 0, 'Catalog should not be empty');
console.log(`✅ Catalog loaded with ${store.catalogo.length} items\n`);

// Test 2: Machine in correct initial state (Fix 2)
console.log('Test 2: Bootstrap State (Auto-Transition Fix)');
const snap = store.bridge?.actor?.getSnapshot?.();
console.assert(snap?.value === 'quotation_workflow.browse' || snap?.value.includes('browse'),
  'Machine should start in browse state');
console.log(`✅ Machine state: ${snap?.value}\n`);

// Test 3: Client validation (Fix 3)
console.log('Test 3: Client Validation Fix');
console.assert(!store.cliente, 'Client should not be selected initially');

// Try adding item without client (should fail)
const initialLength = store.carrito.length;
store.agregarItem({ ID_Item: 'TEST', Nombre: 'Test' });
console.assert(store.carrito.length === initialLength,
  'Adding item without client should fail');
console.log('✅ Item add blocked without client');

// Select client and try again
store.cliente = 'CLI_TEST';
store.agregarItem({
  ID_Item: 'TEST',
  Nombre: 'Test',
  Precio_Base: 100
});
console.assert(store.carrito.length > initialLength,
  'Adding item with client should succeed');
console.log('✅ Item added after client selection\n');

console.log('✅ ALL 3 FIXES VERIFIED WORKING');
```

**Expected Output:**
```
🧪 Testing all 3 fixes...

Test 1: Catalog Load (Race Condition Fix)
✅ Catalog loaded with 15 items

Test 2: Bootstrap State (Auto-Transition Fix)
✅ Machine state: quotation_workflow.browse

Test 3: Client Validation Fix
✅ Item add blocked without client
✅ Item added after client selection

✅ ALL 3 FIXES VERIFIED WORKING
```

---

## Troubleshooting

### Catalog Still Empty After Fix 1
- [ ] Check browser console for errors
- [ ] Verify `window.localCatalogItems` is populated
- [ ] Check Network tab for failed imports
- [ ] Try hard refresh (Ctrl+Shift+R)

### Machine Not in Browse State After Fix 2
- [ ] Check `createCotizadorActor.local.js` line 16
- [ ] Verify change is: `const bootstrap = opts.bootstrap === true;`
- [ ] Check browser console for error messages
- [ ] Try creating new actor: `window.createCotizadorActor({ bootstrap: false })`

### Can Still Add Items Without Client After Fix 3
- [ ] Check `agregarItem()` method in Stores_App.html
- [ ] Verify it has the pre-check: `if (!this.cliente) return;`
- [ ] Check that `modalCliente` property exists
- [ ] Verify client selection modal opens

---

## Next Steps

After verifying all 3 fixes work:
1. **Commit changes** to git
2. **Run full test suite** (npm test in each worktree)
3. **Proceed to TIER 1 components** (ValidationSummary, CompletionSuccess)
4. See: `checklist.md` for next tasks

