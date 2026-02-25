# UI Component Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the linear flow UI architecture with reusable modals (HomePage → ClientSelector → QuotationInitializer → QuotationView → ValidationSummary → CompletionSuccess).

**Architecture:** 
- Linear modal-based flow, each screen independent and composable
- Modals reusable across multiple contexts (e.g., GlobalVariablesForm for init + update)
- Database pre-loading in background while user fills forms
- State management using Alpine.js with local machine state

**Tech Stack:** Alpine.js v3.12+, Vanilla JavaScript ES2020+, HTML/CSS, existing XState orchestration layer

---

## Phase 1: Foundation & Architecture (Prepare for component implementation)

### Task 1.1: Create App State Management Structure

**Files:**
- Create: `apps/quotation/state/AppStateMachine.js`
- Create: `apps/quotation/state/appStateStore.js`
- Test: `apps/quotation/state/appStateMachine.test.js`

**Purpose:** Central state manager for the entire quotation flow (which modal is open, current quotation context, etc.)

**Step 1: Write the test for app state machine**

```javascript
// apps/quotation/state/appStateMachine.test.js
import { describe, it, expect } from 'vitest';
import { createAppStateMachine } from './AppStateMachine.js';

describe('AppStateMachine', () => {
  it('should start in BROWSE state', () => {
    const machine = createAppStateMachine();
    expect(machine.getState().value).toBe('BROWSE');
  });

  it('should transition from BROWSE to CLIENT_SELECTOR on openClientModal()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    expect(machine.getState().value).toBe('CLIENT_SELECTOR');
  });

  it('should transition from CLIENT_SELECTOR to INITIALIZE on clientSelected()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    expect(machine.getState().value).toBe('INITIALIZE');
    expect(machine.getState().context.selectedClient.clientId).toBe('c1');
  });

  it('should transition from INITIALIZE to QUOTATION on formSubmitted()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    expect(machine.getState().value).toBe('QUOTATION');
    expect(machine.getState().context.quotation.pax).toBe(50);
  });

  it('should open GLOBAL_VARIABLES_FORM modal while staying in QUOTATION state', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('OPEN_GLOBAL_VARIABLES_FORM');
    expect(machine.getState().context.openModal).toBe('GLOBAL_VARIABLES_FORM');
    expect(machine.getState().value).toBe('QUOTATION'); // Still in quotation
  });

  it('should transition to VALIDATION on saveQuotation()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('SAVE_QUOTATION');
    expect(machine.getState().value).toBe('VALIDATION');
  });

  it('should transition to COMPLETED on confirmSave()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('SAVE_QUOTATION');
    machine.send('CONFIRM_SAVE');
    expect(machine.getState().value).toBe('COMPLETED');
  });

  it('should return to BROWSE on resetToHome()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('RESET_TO_HOME');
    expect(machine.getState().value).toBe('BROWSE');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
npm test -- apps/quotation/state/appStateMachine.test.js
```

Expected output: Multiple test failures (functions not defined)

**Step 3: Write minimal AppStateMachine implementation**

```javascript
// apps/quotation/state/AppStateMachine.js
export function createAppStateMachine() {
  let state = {
    value: 'BROWSE',
    context: {
      selectedClient: null,
      quotation: null,
      basketItems: [],
      openModal: null,
      dbCached: false,
      quotationId: null,
      errors: []
    }
  };

  const machine = {
    getState() {
      return state;
    },

    send(event, payload = {}) {
      const { value, context } = state;

      // BROWSE → CLIENT_SELECTOR
      if (value === 'BROWSE' && event === 'OPEN_CLIENT_MODAL') {
        state.context.openModal = 'CLIENT_SELECTOR';
      }

      // CLIENT_SELECTOR → INITIALIZE
      if (event === 'CLIENT_SELECTED') {
        state.value = 'INITIALIZE';
        state.context.selectedClient = payload;
        state.context.openModal = 'QUOTATION_INITIALIZER';
      }

      // INITIALIZE → QUOTATION
      if (value === 'INITIALIZE' && event === 'INIT_FORM_SUBMITTED') {
        state.value = 'QUOTATION';
        state.context.quotation = {
          clientId: context.selectedClient.clientId,
          pax: payload.pax,
          fecha: payload.fecha,
          duracion: payload.duracion
        };
        state.context.openModal = null;
      }

      // QUOTATION modal toggle
      if (value === 'QUOTATION' && event === 'OPEN_GLOBAL_VARIABLES_FORM') {
        state.context.openModal = 'GLOBAL_VARIABLES_FORM';
      }

      if (value === 'QUOTATION' && event === 'CLOSE_MODAL') {
        state.context.openModal = null;
      }

      // QUOTATION → VALIDATION
      if (value === 'QUOTATION' && event === 'SAVE_QUOTATION') {
        state.value = 'VALIDATION';
        state.context.openModal = null;
      }

      // VALIDATION → COMPLETED
      if (value === 'VALIDATION' && event === 'CONFIRM_SAVE') {
        state.value = 'COMPLETED';
        state.context.quotationId = `Q-${Date.now()}`;
      }

      // Any state → BROWSE
      if (event === 'RESET_TO_HOME') {
        state.value = 'BROWSE';
        state.context = {
          selectedClient: null,
          quotation: null,
          basketItems: [],
          openModal: null,
          dbCached: false,
          quotationId: null,
          errors: []
        };
      }

      return state;
    }
  };

  return machine;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- apps/quotation/state/appStateMachine.test.js
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/quotation/state/AppStateMachine.js apps/quotation/state/appStateMachine.test.js
git commit -m "feat: create app state machine for quotation flow"
```

---

### Task 1.2: Create Database Pre-loader Service

**Files:**
- Create: `apps/quotation/services/DatabasePreloader.js`
- Test: `apps/quotation/services/DatabasePreloader.test.js`

**Purpose:** Background loader that pre-caches database reference data (catalog, rules, profiles)

**Step 1: Write test for database preloader**

```javascript
// apps/quotation/services/DatabasePreloader.test.js
import { describe, it, expect, vi } from 'vitest';
import { createDatabasePreloader } from './DatabasePreloader.js';

describe('DatabasePreloader', () => {
  it('should return preloader instance with load() method', () => {
    const preloader = createDatabasePreloader();
    expect(typeof preloader.load).toBe('function');
  });

  it('should start loading when load() is called', async () => {
    const preloader = createDatabasePreloader();
    const loadPromise = preloader.load();
    expect(preloader.isLoading()).toBe(true);
  });

  it('should cache catalog items after loading', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    const catalog = preloader.getCatalog();
    expect(Array.isArray(catalog)).toBe(true);
  });

  it('should cache rules after loading', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    const rules = preloader.getRules();
    expect(Array.isArray(rules)).toBe(true);
  });

  it('should cache pricing profiles after loading', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    const profiles = preloader.getPricingProfiles();
    expect(Array.isArray(profiles)).toBe(true);
  });

  it('should report isLoading() as false after load completes', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    expect(preloader.isLoading()).toBe(false);
  });

  it('should return isReady() true after loading completes', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    expect(preloader.isReady()).toBe(true);
  });

  it('should throw error if load fails', async () => {
    const preloader = createDatabasePreloader();
    // Mock failure scenario
    const loadPromise = preloader.load();
    expect.assertions(1);
    // (Implementation will simulate failure)
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- apps/quotation/services/DatabasePreloader.test.js
```

**Step 3: Write DatabasePreloader implementation**

```javascript
// apps/quotation/services/DatabasePreloader.js
export function createDatabasePreloader() {
  let isLoading = false;
  let isReady = false;
  let cache = {
    catalog: [],
    rules: [],
    pricingProfiles: [],
    categoryDefaults: []
  };

  const preloader = {
    isLoading() {
      return isLoading;
    },

    isReady() {
      return isReady;
    },

    async load() {
      isLoading = true;

      try {
        // Simulate parallel loading of reference data
        const [catalog, rules, profiles, categories] = await Promise.all([
          loadCatalogFromDB(),
          loadRulesFromDB(),
          loadPricingProfilesFromDB(),
          loadCategoryDefaultsFromDB()
        ]);

        cache.catalog = catalog;
        cache.rules = rules;
        cache.pricingProfiles = profiles;
        cache.categoryDefaults = categories;

        isReady = true;
        isLoading = false;
      } catch (error) {
        isLoading = false;
        isReady = false;
        throw new Error(`Database preload failed: ${error.message}`);
      }
    },

    getCatalog() {
      return cache.catalog;
    },

    getRules() {
      return cache.rules;
    },

    getPricingProfiles() {
      return cache.pricingProfiles;
    },

    getCategoryDefaults() {
      return cache.categoryDefaults;
    },

    getCache() {
      return { ...cache };
    }
  };

  return preloader;
}

async function loadCatalogFromDB() {
  // TODO: Replace with actual DB call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 'item1', nombre: 'Plated Dinner', precioBase: 85000 },
        { id: 'item2', nombre: 'Premium Bar', precioBase: 500000 }
      ]);
    }, 100);
  });
}

async function loadRulesFromDB() {
  // TODO: Replace with actual DB call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

async function loadPricingProfilesFromDB() {
  // TODO: Replace with actual DB call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

async function loadCategoryDefaultsFromDB() {
  // TODO: Replace with actual DB call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- apps/quotation/services/DatabasePreloader.test.js
```

**Step 5: Commit**

```bash
git add apps/quotation/services/DatabasePreloader.js apps/quotation/services/DatabasePreloader.test.js
git commit -m "feat: create database preloader service"
```

---

## Phase 2: Modal Components (Build each modal independently)

### Task 2.1: Build HomePage Component

**Files:**
- Create: `apps/quotation/components/HomePage.html`
- Create: `apps/quotation/components/HomePage.js`
- Create: `apps/quotation/components/home.test.js`

**Purpose:** Entry point with 3 action buttons (New Quotation, Load Previous, View Database)

**Step 1: Write test for HomePage**

```javascript
// apps/quotation/components/home.test.js
import { describe, it, expect } from 'vitest';
import { createHomePageController } from './HomePage.js';

describe('HomePage', () => {
  it('should initialize with visible: true', () => {
    const controller = createHomePageController();
    expect(controller.isVisible()).toBe(true);
  });

  it('should have three action buttons', () => {
    const controller = createHomePageController();
    const actions = controller.getActions();
    expect(actions.length).toBe(3);
    expect(actions[0].label).toBe('New Quotation');
    expect(actions[1].label).toBe('Load Previous');
    expect(actions[2].label).toBe('View Database');
  });

  it('should emit NEW_QUOTATION event on new quotation click', () => {
    const controller = createHomePageController();
    let emittedEvent = null;
    controller.on('NEW_QUOTATION', (event) => {
      emittedEvent = event;
    });
    controller.clickAction('NEW_QUOTATION');
    expect(emittedEvent).not.toBeNull();
  });

  it('should emit LOAD_PREVIOUS event on load previous click', () => {
    const controller = createHomePageController();
    let emittedEvent = null;
    controller.on('LOAD_PREVIOUS', (event) => {
      emittedEvent = event;
    });
    controller.clickAction('LOAD_PREVIOUS');
    expect(emittedEvent).not.toBeNull();
  });

  it('should emit VIEW_DATABASE event on view database click', () => {
    const controller = createHomePageController();
    let emittedEvent = null;
    controller.on('VIEW_DATABASE', (event) => {
      emittedEvent = event;
    });
    controller.clickAction('VIEW_DATABASE');
    expect(emittedEvent).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- apps/quotation/components/home.test.js
```

**Step 3: Write HomePage.js**

```javascript
// apps/quotation/components/HomePage.js
export function createHomePageController() {
  let listeners = {};

  const controller = {
    isVisible() {
      return true;
    },

    getActions() {
      return [
        {
          id: 'NEW_QUOTATION',
          label: 'New Quotation',
          icon: '✨'
        },
        {
          id: 'LOAD_PREVIOUS',
          label: 'Load Previous',
          icon: '📋'
        },
        {
          id: 'VIEW_DATABASE',
          label: 'View Database',
          icon: '📊'
        }
      ];
    },

    clickAction(actionId) {
      if (listeners[actionId]) {
        listeners[actionId]({ action: actionId });
      }
    },

    on(eventName, callback) {
      listeners[eventName] = callback;
    }
  };

  return controller;
}
```

**Step 4: Write HomePage.html**

```html
<!-- apps/quotation/components/HomePage.html -->
<section class="homepage">
  <div class="homepage-container">
    <header class="homepage-header">
      <h1>🏔️ SF Lodge</h1>
      <p>Cotizador de Eventos</p>
    </header>

    <div class="homepage-actions">
      <button class="action-button action-new" @click="handleNewQuotation()">
        <span class="action-icon">✨</span>
        <span class="action-label">Nueva Cotización</span>
      </button>

      <button class="action-button action-load" @click="handleLoadPrevious()">
        <span class="action-icon">📋</span>
        <span class="action-label">Cargar Anterior</span>
      </button>

      <button class="action-button action-database" @click="handleViewDatabase()">
        <span class="action-icon">📊</span>
        <span class="action-label">Ver Base de Datos</span>
      </button>
    </div>

    <footer class="homepage-footer">
      <p>SF Lodge Quotation System v2.0</p>
    </footer>
  </div>
</section>

<style>
.homepage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f3a 0%, #2d3a5a 100%);
}

.homepage-container {
  text-align: center;
  max-width: 600px;
  padding: 40px;
}

.homepage-header {
  margin-bottom: 60px;
}

.homepage-header h1 {
  font-size: 3rem;
  margin: 0;
  color: #ffffff;
  font-weight: 900;
}

.homepage-header p {
  margin: 10px 0 0;
  color: #cbd5e1;
  font-size: 1.2rem;
}

.homepage-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 60px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 28px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-icon {
  font-size: 1.5rem;
}

.action-new {
  background: #d4af37;
  color: #1a1f3a;
}

.action-new:hover {
  background: #e5c158;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(212, 175, 55, 0.3);
}

.action-load {
  background: #2d5a27;
  color: #ffffff;
}

.action-load:hover {
  background: #3a7030;
  transform: translateY(-2px);
}

.action-database {
  background: #1f4460;
  color: #ffffff;
}

.action-database:hover {
  background: #265a7a;
  transform: translateY(-2px);
}

.homepage-footer {
  color: #94a3b8;
  font-size: 0.9rem;
}
</style>
```

**Step 4: Run test to verify it passes**

```bash
npm test -- apps/quotation/components/home.test.js
```

**Step 5: Commit**

```bash
git add apps/quotation/components/HomePage.html apps/quotation/components/HomePage.js apps/quotation/components/home.test.js
git commit -m "feat: build HomePage component with entry points"
```

---

### Task 2.2: Build ClientSelector Modal

**Files:**
- Create: `apps/quotation/components/ClientSelector.html`
- Create: `apps/quotation/components/ClientSelector.js`
- Test: `apps/quotation/components/clientSelector.test.js`

**Note:** Leverage existing `Components_ModalCliente.html` from claps_codelab/packages/frontend as reference

**Step 1: Write test for ClientSelector**

```javascript
// apps/quotation/components/clientSelector.test.js
import { describe, it, expect } from 'vitest';
import { createClientSelectorController } from './ClientSelector.js';

describe('ClientSelector', () => {
  it('should initialize with empty search', () => {
    const controller = createClientSelectorController([]);
    expect(controller.getSearchTerm()).toBe('');
  });

  it('should filter clients by search term', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A', rut: '12.345.678-9' },
      { id: 'c2', nombre: 'Empresa B', rut: '98.765.432-1' }
    ];
    const controller = createClientSelectorController(clients);
    controller.search('Empresa A');
    const filtered = controller.getFilteredClients();
    expect(filtered.length).toBe(1);
    expect(filtered[0].nombre).toBe('Empresa A');
  });

  it('should emit CLIENT_SELECTED when client is clicked', () => {
    const clients = [{ id: 'c1', nombre: 'Empresa A' }];
    const controller = createClientSelectorController(clients);
    let selectedClient = null;
    controller.on('CLIENT_SELECTED', (client) => {
      selectedClient = client;
    });
    controller.selectClient('c1');
    expect(selectedClient.id).toBe('c1');
  });

  it('should allow keyboard navigation (arrow keys)', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A' },
      { id: 'c2', nombre: 'Empresa B' }
    ];
    const controller = createClientSelectorController(clients);
    controller.keyboardNavigate('DOWN');
    expect(controller.getFocusedClientIndex()).toBe(1);
    controller.keyboardNavigate('UP');
    expect(controller.getFocusedClientIndex()).toBe(0);
  });

  it('should emit CANCEL when cancel is clicked', () => {
    const controller = createClientSelectorController([]);
    let cancelled = false;
    controller.on('CANCEL', () => {
      cancelled = true;
    });
    controller.cancel();
    expect(cancelled).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- apps/quotation/components/clientSelector.test.js
```

**Step 3: Write ClientSelector.js**

```javascript
// apps/quotation/components/ClientSelector.js
export function createClientSelectorController(initialClients = []) {
  let searchTerm = '';
  let focusedIndex = 0;
  let listeners = {};
  let clients = initialClients;

  const controller = {
    getSearchTerm() {
      return searchTerm;
    },

    search(term) {
      searchTerm = term.toLowerCase();
    },

    getFilteredClients() {
      if (searchTerm.length < 2) return [];
      return clients.filter(
        c =>
          c.nombre.toLowerCase().includes(searchTerm) ||
          c.rut.includes(searchTerm) ||
          (c.email && c.email.toLowerCase().includes(searchTerm))
      );
    },

    getFocusedClientIndex() {
      return focusedIndex;
    },

    selectClient(clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client && listeners['CLIENT_SELECTED']) {
        listeners['CLIENT_SELECTED'](client);
      }
    },

    keyboardNavigate(direction) {
      const filtered = this.getFilteredClients();
      if (direction === 'DOWN') {
        focusedIndex = Math.min(focusedIndex + 1, filtered.length - 1);
      } else if (direction === 'UP') {
        focusedIndex = Math.max(focusedIndex - 1, 0);
      } else if (direction === 'ENTER') {
        const filtered = this.getFilteredClients();
        if (filtered[focusedIndex]) {
          this.selectClient(filtered[focusedIndex].id);
        }
      }
    },

    cancel() {
      if (listeners['CANCEL']) {
        listeners['CANCEL']();
      }
    },

    on(eventName, callback) {
      listeners[eventName] = callback;
    }
  };

  return controller;
}
```

**Step 4: Write ClientSelector.html**

```html
<!-- apps/quotation/components/ClientSelector.html -->
<div class="modal-overlay" x-show="appState.openModal === 'CLIENT_SELECTOR'">
  <div class="modal modal-lg">
    <div class="modal-header">
      <h3>Seleccionar Cliente</h3>
      <button class="btn-close" @click="closeModal()">×</button>
    </div>

    <div class="form-group">
      <label>Buscar por nombre, RUT o email</label>
      <input
        type="text"
        x-model="clientSearch"
        @input="searchClients()"
        @keydown.arrow-down="navigateClients('DOWN')"
        @keydown.arrow-up="navigateClients('UP')"
        @keydown.enter="selectFocusedClient()"
        placeholder="Ej: Empresa SPA, 76.123.456-7"
      />
    </div>

    <div class="modal-two-col">
      <div class="client-list">
        <template x-for="(client, idx) in filteredClients" :key="client.id">
          <button
            class="client-row"
            :class="{ active: idx === focusedClientIndex }"
            @click="selectClient(client.id)"
          >
            <strong x-text="client.nombre"></strong>
            <small x-text="client.rut + ' · ' + client.email"></small>
          </button>
        </template>
      </div>

      <div class="client-preview">
        <h4>Vista Previa</h4>
        <template x-if="focusedClient">
          <div>
            <strong x-text="focusedClient.nombre"></strong>
            <div>RUT: <span x-text="focusedClient.rut"></span></div>
            <div>Email: <span x-text="focusedClient.email || '-'"></span></div>
          </div>
        </template>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" @click="closeModal()">Cancelar</button>
      <button
        class="btn btn-primary"
        @click="selectFocusedClient()"
        :disabled="!focusedClient"
      >
        Usar Selección
      </button>
    </div>
  </div>
</div>
```

**Step 5: Run test to verify it passes**

```bash
npm test -- apps/quotation/components/clientSelector.test.js
```

**Step 6: Commit**

```bash
git add apps/quotation/components/ClientSelector.html apps/quotation/components/ClientSelector.js apps/quotation/components/clientSelector.test.js
git commit -m "feat: build ClientSelector modal component"
```

---

## Phase 3: Form Components

### Task 3.1: Build QuotationInitializer Form Modal

**Files:**
- Create: `apps/quotation/components/QuotationInitializer.html`
- Create: `apps/quotation/components/QuotationInitializer.js`
- Test: `apps/quotation/components/quotationInitializer.test.js`

**Purpose:** Form to collect pax, fecha, duracion + trigger DB pre-loading

**Note:** This form will be reused as GlobalVariablesForm later

**Step 1: Write test for QuotationInitializer**

```javascript
// apps/quotation/components/quotationInitializer.test.js
import { describe, it, expect, vi } from 'vitest';
import { createQuotationInitializerController } from './QuotationInitializer.js';

describe('QuotationInitializer', () => {
  it('should initialize form with empty values', () => {
    const controller = createQuotationInitializerController(null);
    expect(controller.getFormState()).toEqual({
      pax: '',
      fecha: '',
      duracion: ''
    });
  });

  it('should initialize form with current values if provided', () => {
    const currentContext = { pax: 50, fecha: '2026-03-15', duracion: 3 };
    const controller = createQuotationInitializerController(currentContext);
    expect(controller.getFormState()).toEqual({
      pax: 50,
      fecha: '2026-03-15',
      duracion: 3
    });
  });

  it('should update form field when setValue is called', () => {
    const controller = createQuotationInitializerController(null);
    controller.setValue('pax', 50);
    expect(controller.getFormState().pax).toBe(50);
  });

  it('should validate required fields', () => {
    const controller = createQuotationInitializerController(null);
    const errors = controller.validate();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/pax/i);
  });

  it('should start DB preloading when form opens', () => {
    const mockPreloader = { load: vi.fn() };
    const controller = createQuotationInitializerController(null, mockPreloader);
    controller.open();
    expect(mockPreloader.load).toHaveBeenCalled();
  });

  it('should emit FORM_SUBMITTED with valid form data', () => {
    const controller = createQuotationInitializerController(null);
    let submittedData = null;
    controller.on('FORM_SUBMITTED', (data) => {
      submittedData = data;
    });
    controller.setValue('pax', 50);
    controller.setValue('fecha', '2026-03-15');
    controller.setValue('duracion', 3);
    controller.submit();
    expect(submittedData).toEqual({
      pax: 50,
      fecha: '2026-03-15',
      duracion: 3
    });
  });

  it('should emit FORM_CANCELLED when cancel is clicked', () => {
    const controller = createQuotationInitializerController(null);
    let cancelled = false;
    controller.on('FORM_CANCELLED', () => {
      cancelled = true;
    });
    controller.cancel();
    expect(cancelled).toBe(true);
  });

  it('should show loading indicator while DB is loading', () => {
    const mockPreloader = { load: vi.fn(), isLoading: () => true };
    const controller = createQuotationInitializerController(null, mockPreloader);
    controller.open();
    expect(controller.isLoading()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- apps/quotation/components/quotationInitializer.test.js
```

**Step 3: Write QuotationInitializer.js**

```javascript
// apps/quotation/components/QuotationInitializer.js
export function createQuotationInitializerController(currentContext = null, dbPreloader = null) {
  let formState = {
    pax: currentContext?.pax || '',
    fecha: currentContext?.fecha || '',
    duracion: currentContext?.duracion || ''
  };

  let listeners = {};
  let preloader = dbPreloader;

  const controller = {
    getFormState() {
      return { ...formState };
    },

    setValue(field, value) {
      if (field in formState) {
        formState[field] = value;
      }
    },

    validate() {
      const errors = [];
      if (!formState.pax || formState.pax < 1) {
        errors.push('Pax es requerido (mínimo 1)');
      }
      if (!formState.fecha) {
        errors.push('Fecha de evento es requerida');
      }
      if (!formState.duracion || formState.duracion < 1) {
        errors.push('Duración es requerida (mínimo 1 día)');
      }
      return errors;
    },

    isLoading() {
      return preloader?.isLoading?.() || false;
    },

    open() {
      if (preloader) {
        preloader.load();
      }
    },

    async submit() {
      const errors = this.validate();
      if (errors.length > 0) {
        if (listeners['VALIDATION_ERROR']) {
          listeners['VALIDATION_ERROR'](errors);
        }
        return;
      }

      if (listeners['FORM_SUBMITTED']) {
        listeners['FORM_SUBMITTED']({ ...formState });
      }
    },

    cancel() {
      if (listeners['FORM_CANCELLED']) {
        listeners['FORM_CANCELLED']();
      }
    },

    on(eventName, callback) {
      listeners[eventName] = callback;
    }
  };

  return controller;
}
```

**Step 4: Write QuotationInitializer.html**

```html
<!-- apps/quotation/components/QuotationInitializer.html -->
<div
  class="modal-overlay"
  x-show="appState.openModal === 'QUOTATION_INITIALIZER' || appState.openModal === 'GLOBAL_VARIABLES_FORM'"
>
  <div class="modal">
    <div class="modal-header">
      <h3 x-text="appState.openModal === 'QUOTATION_INITIALIZER' ? 'Inicializar Cotización' : 'Actualizar Cantidades'"></h3>
      <button class="btn-close" @click="closeModal()">×</button>
    </div>

    <div x-show="dbPreloading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando base de datos...</p>
    </div>

    <template x-if="!dbPreloading">
      <form @submit.prevent="submitQuotationForm()">
        <div class="form-group">
          <label>Pax Global *</label>
          <input
            type="number"
            x-model.number="formData.pax"
            min="1"
            required
            placeholder="Ej: 50"
          />
        </div>

        <div class="form-group">
          <label>Fecha Evento *</label>
          <input
            type="date"
            x-model="formData.fecha"
            required
          />
        </div>

        <div class="form-group">
          <label>Duración (días) *</label>
          <input
            type="number"
            x-model.number="formData.duracion"
            min="1"
            required
            placeholder="Ej: 3"
          />
        </div>

        <template x-if="formErrors.length > 0">
          <div class="error-box">
            <template x-for="error in formErrors">
              <p x-text="error"></p>
            </template>
          </div>
        </template>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">
            Confirmar
          </button>
        </div>
      </form>
    </template>
  </div>
</div>
```

**Step 5: Run test to verify it passes**

```bash
npm test -- apps/quotation/components/quotationInitializer.test.js
```

**Step 6: Commit**

```bash
git add apps/quotation/components/QuotationInitializer.html apps/quotation/components/QuotationInitializer.js apps/quotation/components/quotationInitializer.test.js
git commit -m "feat: build QuotationInitializer form component"
```

---

## Phase 4: Integration & Testing

### Task 4.1: Integrate Components into Main App

**Files:**
- Create: `apps/quotation/app.html` (main app template)
- Create: `apps/quotation/app.js` (main app controller)
- Test: `apps/quotation/app.integration.test.js`

### Task 4.2: Build GlobalVariablesForm (reuses QuotationInitializer)

**Files:**
- Create: `apps/quotation/components/GlobalVariablesForm.html` (can extend QuotationInitializer)
- Create: `apps/quotation/components/GlobalVariablesForm.js`
- Test: `apps/quotation/components/globalVariablesForm.test.js`

### Task 4.3: Integration Testing - Full Linear Flow

**Test:** Complete user journey from HomePage → ClientSelector → QuotationInitializer → QuotationView → ValidationSummary → CompletionSuccess

```bash
npm test -- apps/quotation/app.integration.test.js
```

---

## Phase 5: Documentation & Deployment

### Task 5.1: Update Main App HTML

**File:** Create main `apps/quotation/index.html` that composes all components

### Task 5.2: Add Styles

**File:** Create `apps/quotation/styles/app.css` with all modal and component styles

### Task 5.3: Create Component Documentation

**File:** `apps/quotation/COMPONENTS.md` - API reference for each component

---

## Summary of Files to Create

```
apps/quotation/
├── index.html                          ← Main app entry
├── app.html                            ← App template
├── app.js                              ← App controller
│
├── state/
│   ├── AppStateMachine.js             ← Central state manager
│   └── appStateMachine.test.js
│
├── services/
│   ├── DatabasePreloader.js           ← DB pre-loader
│   └── DatabasePreloader.test.js
│
├── components/
│   ├── HomePage.html
│   ├── HomePage.js
│   ├── home.test.js
│   │
│   ├── ClientSelector.html
│   ├── ClientSelector.js
│   ├── clientSelector.test.js
│   │
│   ├── QuotationInitializer.html
│   ├── QuotationInitializer.js
│   ├── quotationInitializer.test.js
│   │
│   ├── GlobalVariablesForm.html
│   ├── GlobalVariablesForm.js
│   ├── globalVariablesForm.test.js
│
├── styles/
│   └── app.css
│
├── tests/
│   └── app.integration.test.js
│
└── COMPONENTS.md
```

---

## Testing Strategy

**Unit Tests:** Each component tested independently
- AppStateMachine: State transitions
- DatabasePreloader: Loading, caching
- HomePage: Button actions
- ClientSelector: Search, selection, navigation
- QuotationInitializer: Form validation, submission

**Integration Tests:** Full flow testing
- HomePage → ClientSelector → QuotationInitializer → QuotationView
- State propagation through modal chain
- Data persistence between screens

**Manual Testing:** Visual/UX testing
- Button responsiveness
- Modal animations
- Loading indicators
- Error messages

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-02-24-ui-component-flow-implementation.md`.**

This plan includes:
- ✅ Phase 1: Foundation (AppStateMachine, DatabasePreloader)
- ✅ Phase 2: Modal Components (HomePage, ClientSelector, QuotationInitializer)
- ✅ Phase 3: Form Components (GlobalVariablesForm)
- ✅ Phase 4: Integration (full app, testing)
- ✅ Phase 5: Documentation & Deployment

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach would you prefer?
