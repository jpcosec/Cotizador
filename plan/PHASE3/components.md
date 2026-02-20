# Phase 3: Missing HTML Components

**Problem:** Machine has 18 states, but frontend shows same view for all
**Solution:** Create state-aware components with conditional rendering

---

## Gap Analysis

### Current State

**Machine States (18):**
```
quotation_workflow:
├── browse
├── quotation
    ├── initialize (chooseSource, loadingPrevious, creatingNew)
    ├── basket
    ├── validation
    ├── completed
    └── error
database_management:
├── closed
└── open (browse_database, modify_row, add_new_row)
```

**Frontend Components (5 files):**
- Index.html (master layout)
- Components_Sidebar.html (catalog)
- Components_Timeline.html (cart)
- Components_ModalCliente.html (client picker)
- Stores_App.html (Alpine store logic)

**Problem:** Only 1 layout → shows sidebar + timeline for ALL states

---

## Components to Create

### TIER 1: MVP (1.5 hours) ⚠️ CRITICAL

#### 1. ValidationSummary Component (30 min)
**Purpose:** Confirmation screen before save
**State:** `quotation.validation`
**File:** `packages/frontend/Components_ValidationSummary.html`

**Template:**
```html
<div class="validation-summary" x-show="isMachineInValidation()">
  <h2>Resumen de Cotización</h2>

  <div class="header">
    <div>
      <strong>Cliente:</strong>
      <span x-text="cliente.nombre || cliente"></span>
    </div>
    <div>
      <strong>Fecha Evento:</strong>
      <span x-text="quotationSnapshot?.fechaEvento"></span>
    </div>
    <div>
      <strong>Pax:</strong>
      <span x-text="quotationSnapshot?.paxGlobal"></span>
    </div>
  </div>

  <!-- Items table -->
  <table class="items-table">
    <thead>
      <tr>
        <th>Artículo</th>
        <th>Cantidad</th>
        <th>Precio Unitario</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <template x-for="linea in carrito">
        <tr>
          <td x-text="linea.nombre"></td>
          <td x-text="linea.cantidad"></td>
          <td x-text="'$' + linea.precio"></td>
          <td x-text="'$' + (linea.cantidad * linea.precio)"></td>
        </tr>
      </template>
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="subtotal">
      <strong>Subtotal:</strong>
      <span x-text="'$' + totalsSnapshot.subtotal"></span>
    </div>
    <div class="taxes">
      <strong>Impuestos (IVA):</strong>
      <span x-text="'$' + totalsSnapshot.taxTotal"></span>
    </div>
    <div class="total">
      <strong>Total:</strong>
      <span class="grand-total" x-text="'$' + totalsSnapshot.total"></span>
    </div>
  </div>

  <!-- Actions -->
  <div class="actions">
    <button class="btn btn-primary" @click="guardarCotizacion()">
      ✓ Confirmar y Guardar
    </button>
    <button class="btn btn-secondary" @click="volverAlCarrito()">
      ← Volver al Carrito
    </button>
  </div>
</div>
```

**Methods to Add (in Stores_App.html):**
```javascript
guardarCotizacion() {
  if (this.bridge) {
    this.bridge.send('VALIDATE_AND_SAVE');
  } else {
    // Local mode: mark as saved
    this.estado = 'Guardada';
    this.showSuccess = true;
  }
}

volverAlCarrito() {
  if (this.bridge) {
    this.bridge.send('BACK_TO_BASKET');
  } else {
    // Local mode: switch view
    this.currentView = 'basket';
  }
}
```

---

#### 2. CompletionSuccess Component (20 min)
**Purpose:** Success message after save
**State:** `quotation.completed`
**File:** `packages/frontend/Components_CompletionSuccess.html`

**Template:**
```html
<div class="completion-success" x-show="isMachineInCompleted()">
  <div class="success-message">
    <h2>✓ Cotización Guardada Exitosamente</h2>

    <div class="quotation-id">
      <strong>ID Cotización:</strong>
      <code x-text="quotationSnapshot?.cotizacionId"></code>
    </div>

    <div class="details">
      <div class="row">
        <strong>Cliente:</strong>
        <span x-text="cliente.nombre"></span>
      </div>
      <div class="row">
        <strong>Total:</strong>
        <span class="amount" x-text="'$' + totalsSnapshot.total"></span>
      </div>
      <div class="row">
        <strong>Guardada:</strong>
        <span x-text="new Date().toLocaleDateString('es-AR')"></span>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button class="btn btn-primary" @click="crearNuevaQuotacion()">
        ✨ Crear Nueva Cotización
      </button>
      <button class="btn btn-secondary" @click="verCotizacionesAnteriores()">
        📋 Ver Anteriores
      </button>
      <!-- Phase 4 features -->
      <!-- <button class="btn btn-info" @click="descargarPDF()">
        📄 Descargar PDF
      </button>
      <button class="btn btn-info" @click="enviarPorEmail()">
        ✉️ Enviar por Email
      </button> -->
    </div>
  </div>
</div>
```

**Methods to Add:**
```javascript
crearNuevaQuotacion() {
  if (this.bridge) {
    this.bridge.send('RETURN_TO_BROWSE');
  } else {
    this.clearQuotationContext();
    this.currentView = 'browse';
  }
}

verCotizacionesAnteriores() {
  if (this.bridge) {
    this.bridge.send('RETURN_TO_BROWSE');
  } else {
    this.currentView = 'browse';
  }
}
```

---

#### 3. Add Helper Methods & Conditionals (40 min)
**File:** `packages/frontend/Stores_App.html`

**Add Methods:**
```javascript
isMachineInBrowse() {
  return this.useStateMachine
    && this.machineState?.includes('quotation_workflow.browse');
}

isMachineInInitialize() {
  return this.useStateMachine
    && this.machineState?.includes('quotation.initialize');
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

isMachineInDatabaseOpen() {
  return this.useStateMachine
    && this.machineState?.includes('database_management.open');
}
```

**File:** `packages/frontend/Index.html`

**Update Layout:**
```html
<body x-data="cotizadorApp()" @init="init()">
  <!-- Navigation -->
  <?!= include('Components_Navigation'); ?>

  <!-- Main Content Area: Conditional per state -->
  <main class="main-content">

    <!-- Browse State: List previous quotations -->
    <section x-show="isMachineInBrowse()">
      <?!= include('Components_BrowseQuotations'); ?>
    </section>

    <!-- Initialize State: Setup new quotation -->
    <section x-show="isMachineInInitialize()">
      <?!= include('Components_InitializeQuotation'); ?>
    </section>

    <!-- Basket State: Build quotation -->
    <section x-show="isMachineInBasket()" class="basket-section">
      <div class="container">
        <div class="row">
          <aside class="sidebar">
            <?!= include('Components_Sidebar'); ?>
          </aside>
          <article class="main">
            <?!= include('Components_Timeline'); ?>
          </article>
        </div>
      </div>
    </section>

    <!-- Validation State: Confirm before save -->
    <section x-show="isMachineInValidation()">
      <?!= include('Components_ValidationSummary'); ?>
    </section>

    <!-- Completed State: Success message -->
    <section x-show="isMachineInCompleted()">
      <?!= include('Components_CompletionSuccess'); ?>
    </section>

    <!-- Error State: Error display -->
    <section x-show="isMachineInError()">
      <?!= include('Components_ErrorState'); ?>
    </section>

  </main>

  <!-- Database Editor Modal (overlays other content) -->
  <section x-show="isMachineInDatabaseOpen()">
    <?!= include('Components_DatabaseEditor'); ?>
  </section>

  <!-- Modals -->
  <?!= include('Components_ModalCliente'); ?>

  <!-- Scripts -->
  <?!= include('Styles_Global'); ?>
  <?!= include('Local_GAS_Shim'); ?>
  <?!= include('Local_XState_ActorLoader'); ?>
  <?!= include('Bridge_AlpineXState'); ?>
  <?!= include('Stores_App'); ?>
</body>
```

---

### TIER 2: Good UX (1.5 hours)

#### 4. BrowseQuotations Component (45 min)
**Purpose:** List and load previous quotations
**State:** `quotation_workflow.browse`
**File:** `packages/frontend/Components_BrowseQuotations.html`

**Features:**
- Table of previous quotations
- Load/Edit buttons
- Create new button
- Optional: Delete, Print, Email options

**Template snippet:**
```html
<div class="browse-quotations">
  <h1>Mis Cotizaciones</h1>

  <button class="btn btn-primary btn-lg" @click="iniciarNuevaQuotacion()">
    ✨ Crear Nueva Cotización
  </button>

  <div x-show="previousQuotations.length > 0">
    <h3>Cotizaciones Anteriores</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <template x-for="q in previousQuotations">
          <tr>
            <td x-text="q.cotizacionId"></td>
            <td x-text="q.clienteNombre"></td>
            <td x-text="q.fechaCreacion"></td>
            <td x-text="'$' + q.total"></td>
            <td>
              <button @click="cargarQuotation(q.cotizacionId)">Cargar</button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <div x-show="previousQuotations.length === 0">
    <p>No hay cotizaciones anteriores. ¡Crea una nueva!</p>
  </div>
</div>
```

---

#### 5. InitializeQuotation Component (45 min)
**Purpose:** Setup new quotation (client, dates, pax)
**State:** `quotation.initialize.creatingNew`
**File:** `packages/frontend/Components_InitializeQuotation.html`

**Features:**
- Client picker (search)
- Event date
- Duration (days)
- Pax count
- Create button

**Template snippet:**
```html
<div class="initialize-quotation">
  <h1>Nueva Cotización</h1>

  <form @submit.prevent="crearQuotacion()">
    <!-- Client selection -->
    <div class="form-group">
      <label>Cliente *</label>
      <select x-model="clienteSeleccionado">
        <option value="">-- Seleccionar Cliente --</option>
        <template x-for="c in clientes">
          <option :value="c.ID_Cliente" x-text="c.Nombre"></option>
        </template>
      </select>
    </div>

    <!-- Event date -->
    <div class="form-group">
      <label>Fecha del Evento *</label>
      <input type="date" x-model="fechaEvento" required>
    </div>

    <!-- Duration -->
    <div class="form-group">
      <label>Duración (días) *</label>
      <input type="number" x-model.number="duracionDias" min="1" required>
    </div>

    <!-- Pax -->
    <div class="form-group">
      <label>Cantidad de Personas *</label>
      <input type="number" x-model.number="paxGlobal" min="1" required>
    </div>

    <!-- Submit -->
    <button type="submit" class="btn btn-primary">
      ✓ Crear Cotización
    </button>
    <button type="button" class="btn btn-secondary" @click="volver()">
      ← Volver
    </button>
  </form>
</div>
```

---

### TIER 3: Polish (2.5 hours) → Phase 4

#### 6. DatabaseEditor Component (1.5 hours)
**Purpose:** Edit catalog while quotation open
**State:** `database_management.open`
**File:** `packages/frontend/Components_DatabaseEditor.html`

See: `../PHASE4/database-management.md`

---

#### 7. ErrorState Component (20 min)
**Purpose:** Display errors with retry/cancel
**State:** `quotation.error`
**File:** `packages/frontend/Components_ErrorState.html`

**Features:**
- Error message display
- Retry button
- Return to browse button

---

## Testing Checklist

### ✅ Components Render
- [ ] ValidationSummary renders in validation state
- [ ] CompletionSuccess renders in completed state
- [ ] All x-show conditionals work correctly
- [ ] No overlapping views appear

### ✅ Data Display
- [ ] ValidationSummary shows correct items, quantities, prices
- [ ] Totals match calculation
- [ ] Client name displayed
- [ ] Event date and pax shown

### ✅ User Actions
- [ ] "Confirmar y Guardar" button sends VALIDATE_AND_SAVE
- [ ] "Volver al Carrito" button sends BACK_TO_BASKET
- [ ] "Crear Nueva Cotización" button sends RETURN_TO_BROWSE
- [ ] All transitions work correctly

### ✅ State Transitions
- [ ] Add items → basket state
- [ ] Save → validation state
- [ ] Confirm → completed state
- [ ] Create new → browse state

---

## Integration Notes

**When wiring Components_BrowseQuotations and Components_InitializeQuotation (TIER 2):**

Make sure to load previous quotations data from machine context:
```javascript
// In Stores_App.html
get previousQuotations() {
  if (!this.bridge) return [];
  const snap = this.bridge.actor?.getSnapshot?.();
  return snap?.context.previousQuotations || [];
}
```

Wire the events correctly:
```javascript
iniciarNuevaQuotacion() {
  if (this.bridge) {
    this.bridge.send('START_NEW_QUOTATION');
  }
}

cargarQuotation(cotizacionId) {
  if (this.bridge) {
    this.bridge.send('LOAD_QUOTATION', { cotizacionId });
  }
}
```

---

## Success Criteria

- [ ] All TIER 1 components created and rendered correctly
- [ ] State conditionals show correct view per state
- [ ] User can complete full workflow: browse → basket → validation → completed
- [ ] No console errors
- [ ] All data displays correctly

See: `checklist.md` for full Phase 3 verification.

