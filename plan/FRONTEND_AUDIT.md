# Frontend Audit: Domain Model Integration

**Status:** In Progress
**Date:** 2026-02-21
**Goal:** Ensure all UI code reads from domain classes (Catalog, Basket, Item) instead of duplicating logic

---

## 1. Catalog Loading (Sidebar Data)

### Current: ❌ READING FROM GAS BACKEND

**File:** `packages/frontend/Stores_App.html` lines 431-464

**Code Path:**
```
cargarCatalogo()
  → getCatalogo() [GAS backend]
    → finishCatalogLoad(data)
      → normalizeCatalogo(data)
        → normalizeCatalogItem(raw)
          → Sets Precio_Base from item.Precio_Base ?? item.precio ?? 0 (often 0!)
```

**Problem:**
- Items don't have pre-calculated prices from GAS
- `Precio_Base` falls back to 0 (sidebar shows "$0")
- Prices only calculate later when pricing pipeline runs

**Solution: READ FROM context.catalog**

```javascript
cargarCatalogo() {
  if (this.useStateMachine && this.bridge) {
    // Use initialized domain Catalog
    var snap = this.bridge.actor.getSnapshot();
    var catalog = snap && snap.context ? snap.context.catalog : null;

    if (catalog && typeof catalog.toDisplayObject === 'function') {
      // catalog.toDisplayObject() returns display-ready structure
      // with items having item.displayPrice (profile-resolved)
      var displayObj = catalog.toDisplayObject();

      // Transform to catalogoPorCategoria format
      var grouped = {};
      (displayObj.categories || []).forEach(cat => {
        grouped[cat.nombre] = cat.items.map(item => ({
          ID_Item: item.itemId,
          Nombre: item.nombre,
          Precio_Base: item.precio,  // ← Already calculated!
          Default_Glosa: item.comentarios,
          _categoria: { ID_Categoria: cat.id, Nombre: cat.nombre }
        }));
      });

      this.catalogo = this._flattenForCatalog(grouped);
      this.cargando = false;
      return;
    }
  }

  // Fallback: load from GAS (for local mode without state machine)
  // ... existing code ...
}
```

### Status: 🟡 TODO
- [ ] Update cargarCatalogo() to use context.catalog
- [ ] Create _flattenForCatalog() helper
- [ ] Keep fallback for non-state-machine mode
- [ ] Test sidebar displays correct prices
- [ ] Remove normalizeCatalogo() if no longer used

---

## 2. Carrito Display (Timeline)

### Current: ❌ MANUAL ARRAY MANIPULATION

**File:** `packages/frontend/Stores_App.html` lines 553-570

**Code:**
```javascript
agregarItem(item) {
  // ... validation ...

  this.carrito.push({
    nome: item.Nombre,
    categoria: ...,
    precio: item.Precio_Base || item.precio || 0,
    cantidad: this.paxGlobal,
    dia: this.diaSeleccionado,
    // ... manually construct line object ...
  });
}
```

**Problem:**
- Frontend manually creates line objects instead of using domain Basket
- Duplicates line structure definition
- Manual price calculation (should use Item.total)
- Updates (actualizar*, actualizarCantidad) manually modify this.carrito[idx]

**Solution: READ FROM context.basket**

```javascript
// When using state machine:
agregarItem(item) {
  if (this.useStateMachine && this.bridge) {
    this.syncQuotationSettingsToMachine();
    var sent = this.bridge.send('ADD_ITEM', {
      itemId: item.ID_Item,
      overrides: { /* ... */ }
    });
    if (sent) return;
  }

  // Fallback: manually add (for non-state-machine mode)
  // ...
}

// AlpineXStateBridge already syncs basket.toDisplayObject() → this.carrito
// So this.carrito should come from domain basket, not manual construction
```

### Status: 🟡 TODO
- [ ] Update agregarItem() to use state machine ADD_ITEM
- [ ] Remove manual carrito.push() for state-machine mode
- [ ] Remove actualizarCantidad(), etc. direct array mutations
- [ ] Let AlpineXStateBridge handle carrito sync
- [ ] Keep fallback for local mode

---

## 3. Totals Calculation

### Current: ❌ MANUAL CALCULATION

**File:** `packages/frontend/Stores_App.html` lines 835-848

**Code:**
```javascript
get totalNeto() {
  if (!this.carrito) return 0;
  return this.carrito.reduce((sum, i) => sum + (i.total || 0), 0);
}

get totalFinal() {
  return Math.round(this.totalNeto * 1.19);  // Manual tax calc!
}
```

**Problem:**
- Manually sums line totals instead of using Basket.aggregate()
- Manually calculates tax (1.19) instead of using domain rules
- Doesn't account for basket-level rules (AJUSTE_GLOBAL, IMPUESTO)

**Solution: READ FROM context.basket**

```javascript
get totalNeto() {
  if (this.useStateMachine && this.totalsSnapshot && this.totalsSnapshot.subtotal) {
    return this.totalsSnapshot.subtotal;  // From Basket.aggregate()
  }
  if (!this.carrito) return 0;
  return this.carrito.reduce((sum, i) => sum + (i.total || 0), 0);
}

get totalFinal() {
  if (this.useStateMachine && this.totalsSnapshot && this.totalsSnapshot.total) {
    return this.totalsSnapshot.total;  // Includes basket rules
  }
  return Math.round(this.totalNeto * 1.19);
}
```

### Status: 🟡 PARTIAL (Already has fallback to state machine)
- [x] Falls back to context.totalsSnapshot from bridge
- [ ] Verify totalsSnapshot has all basket-level rules applied
- [ ] Document where totalsSnapshot comes from
- [ ] Test with multiple basket rules

---

## 4. Category Organization

### Current: ⚠️ COMPUTED FROM FLAT CATALOG

**File:** `packages/frontend/Stores_App.html` lines 802-821

**Code:**
```javascript
get catalogoPorCategoria() {
  if (!this.catalogo) return {};
  var g = {};
  // ... manually group by category ...
  return g;
}
```

**Problem:**
- Regroups items manually instead of using catalog.toDisplayObject() structure
- Category structure loses metadata (ID_Perfil_Precio_Default, etc.)

**Solution: USE Catalog.toDisplayObject() STRUCTURE DIRECTLY**

```javascript
get catalogoPorCategoria() {
  if (!this.catalog_display_object) return {};

  var g = {};
  var busqueda = this.busquedaCatalogo.toLowerCase();

  (this.catalog_display_object.categories || []).forEach(cat => {
    var filtered = cat.items.filter(item => {
      var nombre = (item.nombre || '').toLowerCase();
      return !busqueda || nombre.includes(busqueda);
    });

    if (filtered.length > 0) {
      g[cat.nombre] = filtered.map(item => ({
        ID_Item: item.itemId,
        Nombre: item.nombre,
        Precio_Base: item.precio,
        // ...
      }));
    }
  });

  return g;
}
```

### Status: 🟡 TODO
- [ ] Cache catalog.toDisplayObject() in this.catalog_display_object
- [ ] Update catalogoPorCategoria to filter cached object
- [ ] Remove manual grouping logic

---

## 5. Rules Display

### Current: ❌ NOT DISPLAYED

**Files:** `Components_Timeline.html`, `Components_Sidebar.html`

**Problem:**
- Items have calculated rules (in Item.appliedRules)
- UI doesn't display what rules were applied
- User doesn't see why price changed (e.g., "Overtime surcharge applied")

**Solution: READ FROM Item.appliedRules**

In timeline item details:
```html
<div x-show="item.appliedRules && item.appliedRules.length > 0">
  <h6>Rules Applied:</h6>
  <ul>
    <template x-for="rule in item.appliedRules">
      <li x-text="rule"></li>
    </template>
  </ul>
</div>
```

### Status: 🟡 TODO
- [ ] Add appliedRules to item display object
- [ ] Display in timeline item details
- [ ] Show warnings/errors for RESTRICCION_UI rules
- [ ] Style rules UI (icons, colors)

---

## 6. Item Details & Overrides

### Current: ⚠️ MIXED MODE

**Files:** `Components_Timeline.html`, `Stores_App.html`

**Code:**
```javascript
actualizarCantidad(idx, val) {
  this.carrito[idx].cantidad = parseInt(val) || 1;

  if (this.useStateMachine && this.bridge && this.carrito[idx]) {
    var lineId = this.carrito[idx].lineId || this.carrito[idx].id;
    this.bridge.send('UPDATE_ITEM', {
      lineId: lineId,
      overrides: { Override_Cantidad: parseInt(val) }
    });
  }
}
```

**Problem:**
- Updates this.carrito directly AND sends to machine
- Risk of out-of-sync state
- Dual-writes not guaranteed to match

**Solution: ONLY WRITE THROUGH STATE MACHINE**

```javascript
actualizarCantidad(idx, val) {
  if (this.useStateMachine && this.bridge && this.carrito[idx]) {
    var lineId = this.carrito[idx].lineId || this.carrito[idx].id;
    this.bridge.send('UPDATE_ITEM', {
      lineId: lineId,
      overrides: { Override_Cantidad: parseInt(val) }
    });
    // Don't update this.carrito[idx] directly!
    // AlpineXStateBridge will sync updated carrito from machine
    return;
  }

  // Fallback for local mode only
  this.carrito[idx].cantidad = parseInt(val) || 1;
  this.carrito[idx].total = this.carrito[idx].precio * this.carrito[idx].cantidad;
}
```

### Status: 🟡 TODO
- [ ] Remove direct this.carrito[idx] mutations when state machine is active
- [ ] Ensure all updates go through bridge.send()
- [ ] Wait for machine state update before reflecting UI changes
- [ ] Add optimistic updates if needed
- [ ] Test that carrito stays in sync with machine state

---

## 7. Summary of Changes

### High Priority (Blocking)
1. **Sidebar prices** - Fix cargarCatalogo() to use context.catalog
2. **Parent kit costs** - Add validation that parent = $0
3. **State sync** - Stop direct carrito mutations when state machine active

### Medium Priority (Correctness)
4. **Rules display** - Show applied rules in UI
5. **Catalog structure** - Use toDisplayObject() structure directly
6. **Totals** - Ensure basket rules applied

### Low Priority (Cleanup)
7. Remove normalizeCatalogo() if not used elsewhere
8. Remove manual calculations duplicating domain logic
9. Document data flow in code comments

---

## 8. Testing Checklist

After implementing fixes:

- [ ] Sidebar shows correct prices on load
- [ ] Carrito syncs with machine state
- [ ] Totals match Basket.aggregate()
- [ ] Rules display in timeline
- [ ] Overrides persist through save/load
- [ ] Parent kits blocked if cost > 0
- [ ] All 832 tests still passing
- [ ] User workflow tests pass (see WORKFLOW_TESTS.md)

