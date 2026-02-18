# Technical Dependencies, Bundling & Mocking Strategy

**Version:** 1.0
**Date:** 2026-02-18
**Purpose:** Detailed spec for external libraries, GAS bundling, message contracts, and test mocking

---

## Overview: Dependency Tree

```
External Libraries Used:
├── xstate@5.x         (only in @claps/xstate)
├── alpinejs@3.x       (only in @claps/frontend)
└── Everything else is standard JS (ES2020+)

NO OTHER DEPENDENCIES! (except GAS APIs which are implicit)

Bundling:
├── Development: ES modules + test mocks
├── Production: Rollup IIFE for GAS
└── Output: Single quotation-engine.iife.js file
```

---

## 1. Per-Worktree Dependencies

### Worktree: `@claps/database`

#### package.json

```json
{
  "name": "@claps/database",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  },
  "dependencies": {},
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**External Libraries:**
- ❌ ZERO external dependencies in production
- ✅ Vitest for testing (dev-only)

**Why zero deps:**
- Pure data layer
- Models are plain objects + methods
- IStore is abstract interface
- No DB client library needed (uses GAS API directly or file I/O)

**GAS Considerations:**
- `SpreadsheetApp` is implicit (provided by GAS runtime)
- Works in Node.js via `FileStore` adapter
- Works in browser via mock stores

**Imports in Store Adapters:**

```javascript
// src/stores/GasSheetStore.js (GAS environment)
export class GasSheetStore extends IStore {
  constructor(sheetName, spreadsheetId) {
    // SpreadsheetApp is global in GAS
    this.ss = SpreadsheetApp.openById(spreadsheetId);
    // ...
  }
}

// src/stores/FileStore.js (Node.js environment)
import * as fs from 'fs';  // Only for Node.js

export class FileStore extends IStore {
  constructor(tableName, basePath) {
    // fs is available in Node
    this.filePath = `${basePath}/${tableName}.json`;
  }

  read() {
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }
}

// src/stores/InMemoryStore.js (Universal)
// No imports needed! Pure JS objects
```

**Build Output:**
- Database code bundles cleanly (zero external deps)
- Adapters detect environment at runtime
- GAS: only GasSheetStore code is executed
- Node: only FileStore code is executed

---

### Worktree: `@claps/pricing`

#### package.json

```json
{
  "name": "@claps/pricing",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  },
  "dependencies": {},
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**External Libraries:**
- ❌ ZERO external dependencies in production
- ✅ Vitest for testing (dev-only)

**Why zero deps:**
- Pure functions
- No math library needed (JS built-in is sufficient)
- No date library needed (Date object + utilities suffice)

**Imports:**

```javascript
// src/Pricing/stages/taxes.js - NO IMPORTS
export function calculateTaxes(subtotal, rules) {
  // Pure math
  const tasa = 0.19;
  return Math.round(subtotal * tasa);
}

// src/Pricing/stages/base-price.js - NO IMPORTS
export function calculateBasePrice(linea, item, pax, perfil) {
  // Pure math with parameters
  return perfil.Costo_Base_Fijo +
         (pax * perfil.Costo_Unitario_Pax) +
         (duracionMin * perfil.Costo_Unitario_Tiempo) +
         (quantity * perfil.Costo_Unitario_Item);
}
```

**Build Output:**
- Pricing bundles as pure functions (no side effects)
- Smallest bundle size possible
- Works everywhere (browser, Node, GAS)

---

### Worktree: `@claps/xstate`

#### package.json

```json
{
  "name": "@claps/xstate",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  },
  "dependencies": {
    "xstate": "^5.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**External Libraries:**
- ✅ **xstate@5.x** (ONLY external production dependency!)
- ✅ Vitest for testing (dev-only)

**Why xstate v5:**
- Industry standard for state machines
- Provides `createMachine()`, `createActor()` (v5 API)
- Mature, well-tested, widely used
- Smaller bundle size (~14-15KB gzipped, down from v4's ~16.4KB)
- Better tree-shaking with modular imports

**Imports:**

```javascript
// src/Orchestration/quotationMachineBlueprint.js
import { createMachine } from 'xstate';

export const quotationMachine = createMachine({
  id: 'quotationApp',
  type: 'parallel',
  // ... machine definition
});

// src/QuotationService.js
import { createActor } from 'xstate';
import { quotationMachine } from './Orchestration/quotationMachineBlueprint.js';

export class QuotationService {
  startNew(clientId, paxGlobal, eventData) {
    const actor = createActor(quotationMachine, { input: { ... } });
    actor.start();
    return actor;
  }
}
```

**Build Output:**
- Rollup bundles xstate library inline
- IIFE wraps xstate + @claps/xstate code
- No external script tags needed

---

### Worktree: `@claps/frontend`

#### package.json

```json
{
  "name": "@claps/frontend",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  },
  "dependencies": {
    "alpinejs": "^3.12.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**External Libraries:**
- ✅ **alpinejs@3.12.0** (second external production dependency)
- ✅ Vitest for testing (dev-only)

**Why Alpine.js:**
- Minimal footprint (~15KB gzipped)
- Works in Google Sheets HtmlService
- Reactive data binding without vDOM
- Easy to learn, familiar to jQuery developers

**Imports:**

```javascript
// src/bridge/AlpineXStateBridge.js
// Alpine is loaded via <script> tag in HTML
// No imports needed - accessed via window.Alpine

export class AlpineXStateBridge {
  constructor(actor, alpineStore) {
    this.actor = actor;
    this.alpineStore = alpineStore;

    // Alpine reactivity already works on alpineStore object
    // Just sync snapshot → properties
  }
}

// components/Components_ModalCliente.html
// Alpine loaded globally, used directly in x-* attributes
<div x-show="estado === 'browse'"
     @click="searchClients($event.target.value)">
  ...
</div>
```

**Build Output:**
- Alpine bundled as global in IIFE
- OR loaded via CDN in HTML (lighter bundle)
- AlpineXStateBridge code bundled with xstate/pricing/database

**Decision: CDN vs Bundle?**

Option A: **Bundle Alpine (heavier, self-contained)**
```javascript
// rollup.config.js
export default {
  input: 'packages/frontend/src/index.js',
  external: [],  // Bundle everything
  output: {
    file: 'dist/quotation-engine.iife.js',
    format: 'iife',
    globals: {}  // No external globals
  },
  plugins: [
    nodeResolve({ preferBuiltins: false }),
    commonjs()
  ]
};
```
Result: `quotation-engine.iife.js` = ~85KB (xstate v5 + Alpine + all code)

Option B: **Load Alpine from CDN (lighter, requires network)**
```html
<!-- Index.html -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="quotation-engine.iife.js"></script>
```
Result: `quotation-engine.iife.js` = ~55KB (just xstate v5 + code)

**Recommendation:** Option A (bundle everything) for reliability in GAS
- Avoid CDN dependency in Google Sheets
- Offline capability
- Single network request

---

### Worktree: Root Monorepo

#### package.json

```json
{
  "name": "claps-codelab-monorepo",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/database",
    "packages/pricing",
    "packages/xstate",
    "packages/frontend"
  ],
  "scripts": {
    "test": "npm run test:database && npm run test:pricing && npm run test:xstate && npm run test:frontend && npm run test:integration",
    "test:database": "cd packages/database && vitest run",
    "test:pricing": "cd packages/pricing && vitest run",
    "test:xstate": "cd packages/xstate && vitest run",
    "test:frontend": "cd packages/frontend && vitest run",
    "test:integration": "vitest run tests/integration/",
    "build": "rollup -c",
    "dev": "rollup -c -w"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.0",
    "@rollup/plugin-node-resolve": "^15.0.0",
    "rollup": "^4.0.0",
    "vitest": "^1.0.0"
  }
}
```

**Root Dependencies:**
- ❌ ZERO production dependencies (workspace packages are local)
- ✅ Rollup + plugins for bundling
- ✅ Vitest for testing

---

## 2. Bundling Strategy for GAS

### Bundling Architecture

```
packages/
├── database/
│   └── src/
│       ├── index.js (exports models, stores, factory)
│       ├── models/
│       ├── stores/
│       ├── config/
│       └── utils/
├── pricing/
│   └── src/
│       ├── index.js (exports pipeline, stages, rules)
│       ├── Pricing/
│       └── models/
├── xstate/
│   └── src/
│       ├── index.js (exports service, machine)
│       ├── QuotationService.js
│       ├── Orchestration/
│       └── node_modules/xstate/ ← BUNDLED HERE
└── frontend/
    └── src/
        ├── index.js (exports bridge, components)
        ├── bridge/
        ├── components/
        └── node_modules/alpinejs/ ← BUNDLED HERE
```

### Rollup Configuration

```javascript
// rollup.config.js (root)

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'packages/xstate/src/index.js',  // Entry point: orchestration layer

  output: {
    file: 'dist/quotation-engine.iife.js',
    format: 'iife',
    name: 'QuotationEngine',  // window.QuotationEngine
    globals: {
      // No external globals - everything bundled
    }
  },

  plugins: [
    resolve({
      preferBuiltins: false,  // Don't use Node.js builtins
      browser: true           // Use browser versions
    }),
    commonjs()  // Convert CommonJS to ES modules
  ]
};
```

### Bundle Dependency Resolution

```
rollup input: packages/xstate/src/index.js
  ├── imports @claps/database
  │   ├── stores/ (GasSheetStore, InMemoryStore)
  │   ├── models/
  │   ├── config/
  │   └── utils/
  │
  ├── imports @claps/pricing
  │   ├── Pricing/stages/
  │   ├── Pricing/rules.js
  │   └── models/
  │
  ├── imports @claps/xstate (local)
  │   ├── QuotationService.js
  │   ├── Orchestration/
  │   └── adapters/
  │
  ├── imports @claps/frontend
  │   ├── bridge/AlpineXStateBridge.js
  │   ├── components/
  │   └── utils/
  │
  └── imports xstate (npm)
      ├── resolve to node_modules/xstate/dist/index.js
      ├── bundle inline
      └── no external reference

Output: quotation-engine.iife.js
  → All code bundled
  → All dependencies resolved
  → xstate library inlined
  → Ready for GAS HtmlService
```

### Build Output Structure

```
dist/
├── quotation-engine.iife.js      (Main bundle)
│   ├── xstate v5 library code (55KB)
│   ├── @claps/database code (15KB)
│   ├── @claps/pricing code (20KB)
│   ├── @claps/xstate code (10KB)
│   ├── @claps/frontend code (8KB)
│   └── (total ~108KB uncompressed, ~40KB gzipped)
│
└── quotation-engine.iife.js.map  (Source map for debugging)
```

### GAS Loading

```javascript
// Code.gs or Index.html (in GAS)

<?!= HtmlService.createHtmlOutput(`
  <!DOCTYPE html>
  <html>
  <head>
    <script src="dist/quotation-engine.iife.js"></script>
    <link rel="stylesheet" href="Styles_Global.html">
  </head>
  <body>
    <div id="app">
      <!-- Index.html content -->
    </div>
    <script>
      // IIFE executes immediately, sets window.QuotationEngine
      const { QuotationService, AlpineXStateBridge } = window.QuotationEngine;

      // Initialize app
      const service = new QuotationService();
      const actor = service.startNew('CLI-001', 50, {});
      const bridge = new AlpineXStateBridge(actor, alpineStore);
      bridge.start();
    </script>
  </body>
  </html>
`).setHeight(600).setWidth(800)
%>
```

### Environment-Specific Code

**Problem:** Some code only works in specific environments
- `FileStore` only in Node.js
- `GasSheetStore` only in GAS
- Alpine.js only in browser

**Solution:** Tree-shaking at bundle time

```javascript
// src/stores/index.js

// These imports are conditional
export { GasSheetStore } from './GasSheetStore.js';

// Only included if requested
export { InMemoryStore } from './InMemoryStore.js';

// Development only
if (process.env.NODE_ENV !== 'production') {
  export { FileStore } from './FileStore.js';
}
```

**Rollup handles it:**
```javascript
// rollup.config.js
export default {
  // ...
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};
```

Result: `FileStore` code not in final bundle for GAS

---

## 3. Message Contracts & Communication Channels

### Message Types (Events)

**Event Structure:**

```typescript
type QuotationEvent =
  | { type: 'SEARCH_CLIENT'; query: string }
  | { type: 'SELECT_CLIENT'; clientId: string }
  | { type: 'INITIALIZE_QUOTATION'; clientId: string; paxGlobal: number; fechaEvento: string }
  | { type: 'ADD_ITEM'; itemId: string; dia: number; hora?: string; paxOverride?: number }
  | { type: 'UPDATE_ITEM'; lineaId: string; paxOverride?: number; cantidadOverride?: number }
  | { type: 'REMOVE_ITEM'; lineaId: string }
  | { type: 'ADVANCE_TO_VALIDATION' }
  | { type: 'VALIDATE_AND_SAVE' }
  | { type: 'GENERATE_PDF' }
  | { type: 'EDIT_BASKET' }
  | { type: 'OPEN_DB_PANEL' }
  | { type: 'CLOSE_DB_PANEL' };
```

### Channel 1: Frontend → XState (Event Dispatch)

```javascript
// Frontend (Alpine)
this.bridge.send('ADD_ITEM', {
  itemId: 'CHINOOK',
  dia: 1,
  hora: '14:00'
});

// Bridge implementation
send(type, data = {}) {
  this.actor.send({ type, ...data });
}

// Message format
{
  type: 'ADD_ITEM',
  itemId: 'CHINOOK',
  dia: 1,
  hora: '14:00'
}

// XState receives and routes to actions
machine.on[event.type] → action handler
```

---

### Channel 2: XState Orchestrator → Database (Data Loading + Persistence)

The XState orchestrator is the **sole owner of database access**. It loads reference data at initialization (caching it in `context.dataCache`) and persists mutations (line items, quotation state). Pricing never directly accesses the database.

See [DATAFLOW_AND_CACHING_STRATEGY.md](DATAFLOW_AND_CACHING_STRATEGY.md) for the full caching strategy.

```javascript
// XState action: Data loading at initialization
async initializeEmptyBasket(context, event) {
  const { ItemCatalogo, Categorias, PerfilesPrecio, ReglasNegocio } = await import('@claps/database');

  // Load all reference data ONCE and cache in context
  context.dataCache = {
    catalog: {
      items: await ItemCatalogo.all(),
      categories: await Categorias.all(),
      profiles: await PerfilesPrecio.all(),
    },
    rules: await ReglasNegocio.all(),
    loadedAt: Date.now(),
    version: 1
  };

  // ... create quotation record
}

// XState action: Persist mutations (line items)
async addItemToBasket(context, event) {
  const { LineaDetalle } = await import('@claps/database');

  const linea = await LineaDetalle.insert({
    ID_Cotizacion: context.quotation.ID_Cotizacion,
    ID_Item: event.itemId,
    Dia_Numero: event.dia,
    Hora_Inicio: event.hora,
    Override_Pax: event.paxOverride || null
  });

  context.lineas.push(linea);
}

// Database call contract (unchanged)
Model.insert({
  ID_Cotizacion: string (PK)
  ID_Item: string (FK)
  Dia_Numero: number
  Hora_Inicio: string
  Override_Pax: number | null
  Override_Cantidad: number | null
  Override_Duracion_Min: number | null
})

// Returns
{
  ID_Linea: string (auto-generated)
  ID_Cotizacion: string
  ID_Item: string
  Dia_Numero: number
  Hora_Inicio: string
  Override_Pax: number | null
  ... all input fields + _id
}
```

---

### Channel 3: XState Orchestrator → Pricing (Parameter-Based Calculation)

The orchestrator passes **all data as parameters** to the pricing pipeline. Pricing has zero store dependencies and performs zero I/O. All reference data comes from `context.dataCache` (loaded once at initialization).

```javascript
// XState action: fullRecalculate uses cached data
fullRecalculate(context) {
  const { QuotationPipeline } = require('@claps/pricing');

  // Pipeline takes NO constructor args -- 100% pure
  const pipeline = new QuotationPipeline();

  // ALL data passed as parameters from XState context
  const result = pipeline.calculateFull(
    context.quotation,              // header
    context.lineas,                 // line items (from context)
    context.dataCache.catalog,      // cached at init (no DB read)
    context.dataCache.rules         // cached at init (no DB read)
  );

  context.calculatedLineas = result.lineas;
  context.totals = result.totals;
  context.calculatedResults = {
    lineas: result.lineas,
    totals: result.totals,
    calculatedAt: Date.now()
  };
}

// Pricing call contract (UPDATED -- parameter-based)
pipeline.calculateFull(
  header: { Pax_Global: number, Fecha_Evento: string, Duracion_Dias: number },
  lineas: Array<LineItem>,
  catalog: { items: Array, categories: Array, profiles: Array },
  rules: Array<Rule>
)

// Returns (unchanged)
{
  success: boolean
  lineas: [
    {
      ID_Linea: string
      ID_Item: string
      Pax: number
      Cantidad: number
      Precio_Unitario: number
      Total_Linea: number
      Reglas_Aplicadas: string[]
    }
  ]
  totals: {
    subtotal: number
    descuentos: number
    subtotal_neto: number
    iva_tasa: number
    iva_monto: number
    total: number
  }
  warnings: [{ type: string; message: string }]
  errors: [{ type: string; message: string; severity: 'WARNING' | 'ERROR' }]
}
```

---

### Channel 4: XState → Frontend (State Snapshot)

```javascript
// XState actor emits snapshots
actor.subscribe(snapshot => {
  // Snapshot = immutable state representation
  console.log(snapshot.value);      // { quotation_workflow: 'basket', ... }
  console.log(snapshot.context);    // { quotation, lineas, totals, errors, ... }
});

// Bridge syncs to Alpine
_syncToAlpine() {
  this.alpineStore.estado = snapshot.value.quotation_workflow;
  this.alpineStore.lineas = snapshot.context.calculatedLineas;
  this.alpineStore.totals = snapshot.context.totals;
  this.alpineStore.errors = snapshot.context.errors;
}

// Snapshot contract
{
  value: {
    quotation_workflow: 'browse' | 'quotation.initialize' | 'quotation.basket' | 'quotation.validation' | 'quotation.completed'
    database_management: 'closed' | 'open'
  }
  context: {
    selectedClient?: { ID_Cliente: string; Nombre_Empresa: string; RUT: string; ... }
    quotation?: { ID_Cotizacion: string; Estado: string; ... }
    lineas: Array<LineaInput>
    calculatedLineas?: Array<LineaCalculated>
    totals: { subtotal: number; total: number; ... }
    errors: Array<{ type: string; message: string; severity: string }>
    warnings: Array<{ type: string; message: string }>
  }
}
```

---

### Channel 5: Database → Store Adapters (CRUD)

```javascript
// Model calls (abstraction)
const Cliente = ModelFactory.createModel('CLIENTES');

await Cliente.all();
await Cliente.find(predicate);
await Cliente.where(predicate);
await Cliente.insert(data);
await Cliente.update(data);
await Cliente.deleteById(id);

// Store adapter implements IStore interface
class GasSheetStore extends IStore {
  async all() {
    const sheet = this.ss.getSheetByName(this.sheetName);
    const data = sheet.getRange(...).getValues();
    return data.slice(1).map((row, idx) => ({
      _id: idx + 2,
      ...this.rowToObject(row)
    }));
  }

  async insert(data) {
    const row = this.objectToRow(data);
    this.sheet.appendRow(row);
    data._id = this.sheet.getLastRow();
    return data;
  }
}

// Store contract
{
  all(): Promise<Array<Record>>
  find(predicate): Promise<Record | null>
  where(predicate): Promise<Array<Record>>
  insert(data): Promise<Record>
  update(data): Promise<Record>
  deleteById(id): Promise<void>
}
```

---

### Message Flow Diagram

```
┌─────────────────────────┐
│ User clicks button      │
│ "Add Item"              │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ Frontend: Alpine dispatch               │
│ bridge.send('ADD_ITEM', {itemId, dia}) │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ Bridge: Forward to XState               │
│ actor.send({type, ...})                 │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ XState: Route via state machine         │
│ machine.on['ADD_ITEM'] → action         │
└────────────┬────────────────────────────┘
             │
             ├─→ LineaDetalle.insert()
             │   └─→ Store.insert()
             │       └─→ GasSheetApp or Mock
             │
             ├─→ QuotationPipeline.calculateFull(
             │     header,                    ← from context
             │     lineas,                    ← from context
             │     context.dataCache.catalog, ← cached at init
             │     context.dataCache.rules    ← cached at init
             │   )
             │   ├─→ Stage1-6 (pure functions, NO DB access)
             │   └─→ returns {lineas, totals}
             │
             └─→ Cache results in context
                 └─→ New snapshot emitted
                     │
                     ↓
             ┌────────────────────────────┐
             │ Actor.subscribe() fires    │
             │ Bridge._syncToAlpine()     │
             └────────────┬───────────────┘
                          │
                          ↓
             ┌────────────────────────────┐
             │ Alpine store updates       │
             │ {estado, lineas, totals}   │
             └────────────┬───────────────┘
                          │
                          ↓
             ┌────────────────────────────┐
             │ UI re-renders              │
             │ <span x-text="totals">     │
             └────────────────────────────┘
```

---

## 4. Testing: Mocks for Local Isolation

### 4.1 Mock Stores (No Database)

```javascript
// tests/mocks/stores.js

export class MockInMemoryStore extends IStore {
  constructor(tableName) {
    this.tableName = tableName;
    this.records = new Map();
    this.nextId = 1;
  }

  all() {
    return Array.from(this.records.values());
  }

  find(predicate) {
    for (const record of this.records.values()) {
      if (predicate(record)) return record;
    }
    return null;
  }

  insert(data) {
    const id = this.nextId++;
    data._id = id;
    this.records.set(id, { ...data });
    return data;
  }

  update(data) {
    if (!data._id) throw new Error('Update requires _id');
    this.records.set(data._id, { ...data });
    return data;
  }

  deleteById(id) {
    this.records.delete(id);
  }

  truncate() {
    this.records.clear();
  }
}

// Usage in tests
beforeEach(() => {
  const store = new MockInMemoryStore('LINEA_DETALLE');
  LineaDetalle.setStore(store);
});

it('inserts line item', () => {
  const linea = LineaDetalle.insert({
    ID_Cotizacion: 'COT-001',
    ID_Item: 'CHINOOK'
  });

  expect(linea._id).toBe(1);
  expect(LineaDetalle.all()).toHaveLength(1);
});
```

**Benefits:**
- ✅ No GAS API calls
- ✅ Fast (in-memory)
- ✅ Isolated (no side effects)
- ✅ Deterministic
- ✅ Easy to inspect state

---

### 4.2 Mock XState Actor

```javascript
// tests/mocks/actor.js

export class MockActor {
  constructor() {
    this.snapshot = {
      value: { quotation_workflow: 'browse', database_management: 'closed' },
      context: {
        lineas: [],
        totals: { subtotal: 0, total: 0 },
        errors: []
      }
    };
    this.subscribers = [];
    this.lastEvent = null;
  }

  send(event) {
    this.lastEvent = event;
    // Simulate state transition
    this._transitionState(event);
    // Notify subscribers
    this._notifySubscribers();
  }

  _transitionState(event) {
    switch (event.type) {
      case 'ADD_ITEM':
        this.snapshot.context.lineas.push({
          ID_Item: event.itemId,
          Dia_Numero: event.dia
        });
        break;
      case 'ADVANCE_TO_VALIDATION':
        this.snapshot.value.quotation_workflow = 'quotation.validation';
        break;
      // ... other transitions
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // Unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  _notifySubscribers() {
    this.subscribers.forEach(cb => cb(this.snapshot));
  }

  getSnapshot() {
    return this.snapshot;
  }
}

// Usage in tests
it('adds item to basket', () => {
  const actor = new MockActor();
  const callback = vitest.fn();
  actor.subscribe(callback);

  actor.send({ type: 'ADD_ITEM', itemId: 'CHINOOK', dia: 1 });

  expect(actor.getSnapshot().context.lineas).toHaveLength(1);
  expect(callback).toHaveBeenCalled();
});
```

---

### 4.3 Mock Alpine Bridge

```javascript
// tests/mocks/bridge.js

export class MockAlpineXStateBridge {
  constructor(actor, alpineStore) {
    this.actor = actor;
    this.alpineStore = alpineStore;
    this.snapshot = actor.getSnapshot();

    this.unsubscribe = actor.subscribe(snapshot => {
      this.snapshot = snapshot;
      this._syncToAlpine();
    });
  }

  _syncToAlpine() {
    this.alpineStore.estado = this.snapshot.value.quotation_workflow;
    this.alpineStore.lineas = this.snapshot.context.calculatedLineas || [];
    this.alpineStore.totals = this.snapshot.context.totals || {};
  }

  send(type, data = {}) {
    this.actor.send({ type, ...data });
  }

  get canAddItems() {
    return this.snapshot.value.quotation_workflow === 'quotation.basket';
  }

  destroy() {
    this.unsubscribe?.();
  }
}

// Usage in tests
it('syncs state to alpine', () => {
  const actor = new MockActor();
  const alpineStore = { lineas: [], totals: {} };
  const bridge = new MockAlpineXStateBridge(actor, alpineStore);

  actor.send({ type: 'ADD_ITEM', itemId: 'CHINOOK', dia: 1 });

  expect(alpineStore.lineas).toHaveLength(1);
});
```

---

### 4.4 Mock Pricing Pipeline

```javascript
// tests/mocks/pricing.js

export class MockQuotationPipeline {
  constructor() {
    this.callCount = 0;
  }

  calculateFull(header, lineas, catalog, rules) {
    this.callCount++;

    // Return deterministic mock result
    return {
      success: true,
      lineas: lineas.map(l => ({
        ...l,
        Precio_Unitario: 10000,  // Fixed price for testing
        Total_Linea: 10000
      })),
      totals: {
        subtotal: 10000 * lineas.length,
        iva_monto: 1900 * lineas.length,
        total: 11900 * lineas.length
      },
      warnings: [],
      errors: []
    };
  }
}

// Usage in tests
it('calculates totals', async () => {
  const pipeline = new MockQuotationPipeline();

  const result = await pipeline.calculateFull('COT-001', [
    { ID_Item: 'CHINOOK' },
    { ID_Item: 'DINNER' }
  ]);

  expect(result.lineas).toHaveLength(2);
  expect(result.totals.total).toBe(23800);
});
```

---

### 4.5 Integration Test with All Mocks

```javascript
// tests/integration/quotation-flow.test.js

describe('Complete Quotation Flow (Mocked)', () => {
  let store, actor, bridge, alpineStore;

  beforeEach(() => {
    // Setup mocks
    store = new MockInMemoryStore('LINEA_DETALLE');
    actor = new MockActor();
    alpineStore = { lineas: [], totals: {}, estado: 'browse' };
    bridge = new MockAlpineXStateBridge(actor, alpineStore);

    // Inject mocks into models
    LineaDetalle.setStore(store);

    // Setup pricing mock
    const pricingMock = new MockQuotationPipeline();
  });

  it('creates quotation end-to-end', async () => {
    // Step 1: Initialize
    actor.send({
      type: 'INITIALIZE_QUOTATION',
      clientId: 'CLI-001',
      paxGlobal: 50,
      fechaEvento: '2026-06-15'
    });
    expect(alpineStore.estado).toBe('quotation.initialize');

    // Step 2: Add items
    actor.send({ type: 'ADD_ITEM', itemId: 'CHINOOK', dia: 1 });
    actor.send({ type: 'ADD_ITEM', itemId: 'DINNER', dia: 1 });
    expect(alpineStore.lineas).toHaveLength(2);

    // Step 3: Advance to validation
    actor.send({ type: 'ADVANCE_TO_VALIDATION' });
    expect(alpineStore.estado).toBe('quotation.validation');

    // Step 4: Save
    actor.send({ type: 'VALIDATE_AND_SAVE' });
    expect(alpineStore.estado).toBe('quotation.completed');

    // Verify database calls
    expect(LineaDetalle.all()).toHaveLength(2);
  });
});
```

---

## 5. Environment-Specific Behavior

### Local Development (npm test)

```bash
$ npm test

Environment: Node.js + Vitest
├── Database: InMemoryStore (mocked)
├── Pricing: Real pipeline (no I/O)
├── XState: MockActor + real machine
├── Frontend: Not tested (Alpine requires browser)
└── Time: ~1 second for all tests
```

**Config:**
```javascript
// vitest.config.js
export default defineConfig({
  environment: 'node',
  globals: true,
  testTimeout: 5000
});
```

---

### Browser Testing (Vitest + Happy DOM)

```javascript
// tests/frontend/bridge.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { AlpineXStateBridge } from '../../src/bridge/AlpineXStateBridge.js';

describe('AlpineXStateBridge (Browser)', () => {
  let dom;

  beforeEach(() => {
    // Setup minimal DOM
    dom = new JSDOM('<div id="app"></div>');
    global.window = dom.window;
    global.document = dom.window.document;
  });

  it('syncs actor snapshot to Alpine store', () => {
    const mockActor = new MockActor();
    const alpineStore = { lineas: [] };

    const bridge = new AlpineXStateBridge(mockActor, alpineStore);
    mockActor.send({ type: 'ADD_ITEM', itemId: 'TEST' });

    expect(alpineStore.lineas).toHaveLength(1);
  });
});
```

**Config:**
```javascript
// vitest.config.js
export default defineConfig({
  environment: 'jsdom',
  globals: true
});
```

---

### GAS Testing (Simulated Environment)

```javascript
// tests/gas-simulation/quotation.test.js

// Mock GAS globals
global.SpreadsheetApp = {
  openById: (id) => mockSpreadsheet,
  getActiveSpreadsheet: () => mockSpreadsheet
};

const mockSpreadsheet = {
  getSheetByName: (name) => ({
    getLastRow: () => 1,
    getLastColumn: () => 10,
    getRange: () => ({
      getValues: () => [['ID', 'Name', ...]]
    }),
    appendRow: (row) => {},
    deleteRow: (idx) => {},
    setValues: () => {}
  })
};

describe('GAS Simulation', () => {
  it('works with GasSheetStore', async () => {
    const store = new GasSheetStore('CLIENTES', 'SHEET_ID');
    const Cliente = ModelFactory.createModel('CLIENTES');
    Cliente.setStore(store);

    const clientes = await Cliente.all();
    expect(Array.isArray(clientes)).toBe(true);
  });
});
```

---

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml

name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npm run test              # All unit + integration tests
      - run: npm run build             # Ensure bundling works
      - run: npm run test:build        # Verify bundle integrity
```

---

## 6. Summary Table: Dependencies & Communication

| Worktree | External Deps | Communication | Testing Mocks |
|----------|---------------|---------------|---------------|
| **database** | None (GAS API implicit) | Models → Store (CRUD) | InMemoryStore |
| **pricing** | None | Pipeline ← params (header, lineas, catalog, rules), → totals | Test data fixtures (no store mock needed) |
| **xstate** | xstate@5.x | Machine ← events, → snapshots | MockActor |
| **frontend** | alpinejs@3.12 | Alpine ← store, → bridge.send() | MockBridge |
| **root** | rollup, vitest | (workspace management) | (test runners) |

---

## 7. Bundle Size Estimates

```
Uncompressed:
├── xstate v5 library:      ~55KB  (v5 is ~30% smaller than v4's ~80KB)
├── @claps/database code:   ~15KB
├── @claps/pricing code:    ~20KB
├── @claps/xstate code:     ~10KB
├── @claps/frontend code:   ~8KB
└── TOTAL:                  ~108KB

Gzipped (production):
├── xstate v5 library:      ~15KB  (v5: ~14-15KB vs v4's ~16.4KB gzipped)
├── All code combined:      ~25KB
└── TOTAL:                  ~40KB

GAS Deployment:
├── quotation-engine.iife.js: ~50KB gzipped
├── Index.html:              ~2KB
├── Styles_Global.html:      ~5KB
└── TOTAL:                   ~57KB
```

**Note:** XState v5 provides significant size savings over v4 through better
tree-shaking and a leaner core. Modular imports (`xstate/actions`, `xstate/guards`)
allow bundlers to include only what is used.

**GAS Quota Impact:**
- HTML content size: ~100KB max (includes external resources)
- Script execution time: < 6 minutes per run (GAS quota)
- Current bundle: ~57KB → Well within limits ✅

---

## Deployment Checklist

Before going to Phase 1, verify:

- [ ] All package.json files have `"type": "module"` (ES modules)
- [ ] Rollup config bundles all workspaces
- [ ] Test mocks cover all major components
- [ ] GAS API mocked in tests
- [ ] Bundle size < 100KB
- [ ] IIFE exposes correct globals (`window.QuotationEngine`)
- [ ] Alpine can access bundled code via window globals
- [ ] Environment detection works (GAS vs Node vs Browser)

---

**Ready for Phase 1 Implementation? ✅**

All technical details specified. Libraries identified. Bundle strategy defined. Mocks ready.
