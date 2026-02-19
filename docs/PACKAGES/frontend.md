# Frontend Package

**Location:** `packages/frontend/`
**Language:** HTML + JavaScript (ES2020+)
**Framework:** Alpine.js v3.12.0
**Tests:** TBD (Phase 3)
**Status:** ⏳ In progress (components built, integration pending)

---

## What This Package Does

Provides reactive user interface for quotation system using Alpine.js. Syncs with XState machine for all state and business logic.

```
HTML Components (Alpine)  ←→  AlpineXStateBridge  ←→  XState Machine
   (display layer)           (sync layer)             (logic layer)
```

---

## Package Structure

```
packages/frontend/
├── Index.html                              ← Main HTML (loads all components)
│
├── Stores_App.html                         ← Alpine store (state + methods)
├── Bridge_AlpineXState.js                  ← Sync bridge class
├── Local_GAS_Shim.html                     ← Mock google.script for dev
├── Local_XState_ActorLoader.html           ← Dynamic actor factory loader
│
├── Components/                             ← UI Components
│   ├── Components_Sidebar.html             ✅ Catalog browser
│   ├── Components_Timeline.html            ✅ Cart/items display
│   ├── Components_ModalCliente.html        ✅ Client picker
│   ├── Components_ValidationSummary.html   ⏳ Phase 3
│   ├── Components_CompletionSuccess.html   ⏳ Phase 3
│   ├── Components_BrowseQuotations.html    ⏳ Phase 3
│   ├── Components_InitializeQuotation.html ⏳ Phase 3
│   ├── Components_ErrorState.html          ⏳ Phase 4
│   └── Components_DatabaseEditor.html      ⏳ Phase 4
│
├── Styles_Global.html                      ← CSS (global styles)
│
├── src/
│   ├── bridge/
│   │   └── AlpineXStateBridge.js           ← Class to sync Alpine ↔ XState
│   │
│   └── local/
│       └── createCotizadorActor.local.js   ← Factory for local testing
│
└── tests/
    └── integration/                        ← Integration tests (TBD)
```

---

## Architecture: Data Flow

```
User Action (click "Add Item")
    ↓
Alpine component: @click="agregarItem(item)"
    ↓
Stores_App.js: agregarItem() method
    ↓
Check: useStateMachine && bridge?
    ├─ YES: bridge.send('ADD_ITEM', { itemId, ... })
    │        ↓
    │        AlpineXStateBridge
    │        ↓
    │        actor.send({ type: 'ADD_ITEM', ... })
    │        ↓
    │        XState Machine (pricing, calculations)
    │        ↓
    │        snapshot.context updated
    │        ↓
    │        bridge.subscribe() fires
    │        ↓
    │        syncToAlpine() copies to Alpine store
    │        ↓
    │        Alpine.js detects reactivity
    │        ↓
    │        HTML re-renders
    │
    └─ NO: this.carrito.push(item)  [local fallback]
           ↓
           Alpine reactivity
           ↓
           HTML re-renders
```

---

## Alpine.js Basics

**What is Alpine.js?**
- Lightweight reactive framework (15KB gzipped)
- Declarative bindings (x-show, x-if, x-for, etc.)
- Two-way data binding (x-model)
- Event handling (@click, @submit, etc.)
- Stores for global state (Alpine.store)

**Key Features:**
```html
<!-- Data binding -->
<div x-data="{ count: 0 }">
  <button @click="count++">{{ count }}</button>
</div>

<!-- Conditionals -->
<div x-show="showModal">Modal content</div>
<div x-if="isAdmin">Admin section</div>

<!-- Loops -->
<template x-for="item in items">
  <li x-text="item.name"></li>
</template>

<!-- Event handling -->
<button @click="agregarItem(item)">Add</button>

<!-- Global store -->
<div x-data>
  <p x-text="$store.cotizadorApp.carrito.length"></p>
</div>
```

---

## Core Components

### Stores_App.html (Alpine Store)

Main Alpine store with all quotation logic:

```javascript
Alpine.store('cotizadorApp', () => ({
  // State
  cliente: null,
  catalogo: [],
  carrito: [],
  totalsSnapshot: { subtotal: 0, total: 0 },
  machineState: 'quotation_workflow.browse',
  useStateMachine: false,
  bridge: null,

  // Initialization
  init() {
    this.generarDias();
    this.initXStateBridge();
    this.cargarCatalogo();
  },

  // Methods
  agregarItem(item) {
    if (!this.cliente) {
      alert('Selecciona cliente primero');
      return;
    }

    if (this.useStateMachine && this.bridge) {
      this.bridge.send('ADD_ITEM', { itemId: item.ID_Item });
    } else {
      this.carrito.push(item);
    }
  },

  // ... more methods
}));
```

### Components_Sidebar.html

Catalog browser component:

```html
<div class="sidebar">
  <h3>Catálogo</h3>

  <!-- Search -->
  <input x-model="busquedaCatalogo" placeholder="Buscar...">

  <!-- Grouped items -->
  <template x-for="(items, category) in catalogoPorCategoria">
    <div class="accordion-item">
      <h5 x-text="category"></h5>
      <template x-for="item in items">
        <button @click="agregarItem(item)">
          <span x-text="item.Nombre"></span>
          <span x-text="'$' + item.Precio_Base"></span>
        </button>
      </template>
    </div>
  </template>
</div>
```

### Components_Timeline.html

Cart and line items display:

```html
<div class="timeline">
  <h3>Carrito</h3>

  <div class="totals">
    <p>Subtotal: <span x-text="'$' + totalsSnapshot.subtotal"></span></p>
    <p>Total: <span x-text="'$' + totalsSnapshot.total"></span></p>
  </div>

  <table class="items">
    <template x-for="(item, idx) in carrito">
      <tr>
        <td x-text="item.Nombre"></td>
        <td><input type="number" x-model="item.cantidad"></td>
        <td x-text="'$' + item.precio"></td>
        <td>
          <button @click="removerItem(idx)">Eliminar</button>
        </td>
      </tr>
    </template>
  </table>

  <button @click="guardarCotizacion()">Guardar</button>
</div>
```

### Components_ModalCliente.html

Client selection modal:

```html
<div x-show="modalCliente" class="modal">
  <div class="modal-content">
    <h3>Seleccionar Cliente</h3>

    <input x-model="clienteBusqueda" placeholder="Buscar cliente...">

    <ul>
      <template x-for="c in clientesFiltrados">
        <li @click="seleccionarCliente(c)" x-text="c.Nombre"></li>
      </template>
    </ul>

    <button @click="modalCliente = false">Cerrar</button>
  </div>
</div>
```

---

## AlpineXStateBridge Class

Syncs Alpine store with XState machine:

```javascript
class AlpineXStateBridge {
  constructor(actor, alpineStore) {
    this.actor = actor;
    this.alpineStore = alpineStore;

    // Subscribe to machine snapshots
    this.actor.subscribe(snapshot => {
      this.syncToAlpine(snapshot);
    });
  }

  // Send event to machine
  send(eventType, payload) {
    this.actor.send({ type: eventType, ...payload });
  }

  // Sync snapshot to Alpine
  syncToAlpine(snapshot) {
    this.alpineStore.machineState = snapshot.value;
    this.alpineStore.carrito = snapshot.context.lineas || [];
    this.alpineStore.totalsSnapshot = snapshot.context.totals || {};
    this.alpineStore.errors = snapshot.context.errors || [];
    this.alpineStore.messages = snapshot.context.messages || [];
  }
}
```

---

## State-Aware Rendering (Phase 3)

Different UI per machine state:

```html
<!-- Browse state: Show quotation list -->
<section x-show="isMachineInBrowse()">
  <?!= include('Components_BrowseQuotations'); ?>
</section>

<!-- Initialize state: Show setup form -->
<section x-show="isMachineInInitialize()">
  <?!= include('Components_InitializeQuotation'); ?>
</section>

<!-- Basket state: Show catalog + cart -->
<section x-show="isMachineInBasket()">
  <div class="container">
    <aside><?!= include('Components_Sidebar'); ?></aside>
    <article><?!= include('Components_Timeline'); ?></article>
  </div>
</section>

<!-- Validation state: Show summary -->
<section x-show="isMachineInValidation()">
  <?!= include('Components_ValidationSummary'); ?>
</section>

<!-- Completed state: Show success -->
<section x-show="isMachineInCompleted()">
  <?!= include('Components_CompletionSuccess'); ?>
</section>
```

---

## Fallback Mode (Local)

When machine not available:

```javascript
// In agregarItem():
if (this.useStateMachine && this.bridge) {
  // Use machine
  this.bridge.send('ADD_ITEM', { itemId });
} else {
  // Fallback to local
  this.carrito.push(item);
  this.calcularTotales();  // Manual calculation
}
```

**Benefits:**
- Works without machine (for testing)
- Graceful degradation
- Can test UI independently

---

## Phase 3 Tasks

### TIER 1: MVP (1.5 hours)
- [ ] Create Components_ValidationSummary.html
- [ ] Create Components_CompletionSuccess.html
- [ ] Add state helper methods (isMachineInBrowse, etc.)
- [ ] Add state-aware conditionals to Index.html
- [ ] Fix 3 critical bugs (race condition, bootstrap, validation)

### TIER 2: Good UX (1.5 hours)
- [ ] Create Components_BrowseQuotations.html
- [ ] Create Components_InitializeQuotation.html
- [ ] Wire client selection to machine
- [ ] Add quotation history loading

---

## Key Files to Know

| File | Purpose | Importance |
|------|---------|-----------|
| Index.html | Master layout | Core: add components here |
| Stores_App.html | Alpine store | Core: add methods here |
| Bridge_AlpineXState.js | Sync layer | Core: sync logic here |
| Components_*.html | UI components | Core: create new ones here |

---

## Testing Strategy (Phase 3)

**Component tests:**
```javascript
test('agregarItem adds to carrito', () => {
  const store = Alpine.store('cotizadorApp');
  store.cliente = 'CLI_001';
  store.agregarItem({ ID_Item: 'ITEM_1', Nombre: 'Item' });
  expect(store.carrito.length).toBe(1);
});
```

**Integration tests:**
```javascript
test('Full workflow: browse → add → save', () => {
  // 1. Load page
  // 2. Select client
  // 3. Add items
  // 4. Verify prices
  // 5. Save quotation
  // 6. Verify success
});
```

---

## Performance Tips

- **Debounce search:** Don't filter on every keystroke
- **Lazy-load components:** Load modals only when needed
- **Cache Alpine data:** Store computed results
- **Optimize bindings:** Use x-show instead of x-if when possible
- **Avoid watchers:** Use Alpine events instead of watch

---

## Debugging

**Check Alpine store:**
```javascript
// In browser console:
Alpine.store('cotizadorApp').carrito
```

**Check machine state:**
```javascript
const store = Alpine.store('cotizadorApp');
console.log(store.machineState);
console.log(store.bridge?.actor.getSnapshot());
```

**Monitor snapshots:**
```javascript
store.bridge?.actor.subscribe(snapshot => {
  console.log('New state:', snapshot.value);
});
```

---

## Production Checklist

- [ ] All components created (Phase 3 + 4)
- [ ] State machine integrated
- [ ] All 209+ tests passing
- [ ] No console errors
- [ ] Responsive design
- [ ] Performance acceptable
- [ ] Fallback mode working
- [ ] Ready for GAS deployment

