# Database Viewer Component: Analysis & Architecture

**Date:** 2026-02-24  
**Status:** Design & Planning Phase  
**Purpose:** Port claps_codelab database module to rebuild_components as an autonomous component  

---

## Executive Summary

We are porting the **production-ready database abstraction layer** from `claps_codelab/packages/database` into the new `rebuild_components` architecture as a **self-contained, reusable component**. This component will:

1. **Provide queryable database access** to all other components (Item, Category, Basket, etc.)
2. **Serve as both a dev tool and production service** (split concerns)
3. **Maintain the autonomous component pattern** (XState actor + Alpine UI)
4. **Bridge the gap** between old monorepo architecture and new component-based architecture

---

## Part 1: How the Current Database Module Works

### 1.1 Architecture Overview (claps_codelab)

```
┌─────────────────────────────────────────────────────────────┐
│ createDatabase() Factory Function                            │
├─────────────────────────────────────────────────────────────┤
│ INPUT:                                                       │
│  - adapter: 'memory' | 'gas' | 'file'                       │
│  - adapterOptions: { tableName, columns }                   │
│  - schema: DATA_SCHEMA (11 tables)                           │
│  - seed: { type: 'csv' | 'v1', ... }                        │
│                                                              │
│ OUTPUT:                                                      │
│  - models: { CLIENTES, CATEGORIAS, ITEM_CATALOGO, ... }    │
│  - adapter: 'memory' | 'gas' | 'file'                       │
│  - schema: DATA_SCHEMA                                       │
│  - seedSummary: { type, result }                            │
└─────────────────────────────────────────────────────────────┘
         ▲            ▲                   ▲
         │            │                   │
         │            │                   └─ seedFromCsv()
         │            │                      seedFromV1Csv()
         │            │
         │            └─ ModelFactory.createModels()
         │
         └─ StoreClass (InMemoryStore | FileStore | GasSheetStore)
```

### 1.2 Core Components

#### **IStore Interface** (Abstract)
```javascript
// Location: claps_codelab/packages/database/src/IStore.js

class IStore {
  all()                    // Get all records
  where(predicate)         // Filter by function: (record) => boolean
  find(predicate)          // Get first match
  insert(data)             // Create record, generate PK if needed
  update(data)             // Update existing record by PK
  deleteById(id)           // Delete by primary key
  truncate()               // Clear all records 
  getColumns()             // Get column names
  getByRowIndex(rowIndex)  // Get record by position (0-indexed) 
}
```

**Key Insight:** All operations are **synchronous**. No database driver or async I/O in the interface.

#### **Store Implementations**

| Implementation | Storage | Use Case |
|---|---|---|
| **InMemoryStore** | JavaScript Map in RAM | Unit tests, dev demos, ephemeral data |
| **FileStore** | JSON files on disk | Local development, persistence |
| **GasSheetStore** | Google Sheets API | Production (Google Apps Script runtime) |

#### **ModelFactory**
```javascript
// Creates a model for each table in the schema

buildModel({
  tableName: 'CLIENTES',
  schema: { columns: [...] },
  store: InMemoryStore instance
})

// Returns:
{
  tableName,
  schema,
  primaryKey,      // Inferred from schema (PK type in column definition)
  all(),           // ✅ Delegates to store.all()
  where(p),        // ✅ Delegates to store.where(p)
  find(p),         // ✅ Delegates to store.find(p)
  findById(id),    // ✅ Convenience: find by primary key
  create(data),    // ✅ Delegates to store.insert()
  update(data),    // ✅ Delegates to store.update()
  deleteById(id),  // ✅ Delegates to store.deleteById()
  truncate(),      // ✅ Delegates to store.truncate()
  getColumns()     // ✅ Delegates to store.getColumns()
}
```

### 1.3 Seed System (CSV & V1 Migration)

#### **CSV Seed Type** (Generic)
```javascript
createDatabase({
  adapter: 'memory',
  seed: {
    type: 'csv',
    imports: [
      {
        tableName: 'CLIENTES',
        filePath: './data/clientes.csv',
        columnMap: { 'Email': 'ContactEmail' },  // Optional: rename columns
        transformRow: (row) => { /* optional transform */ },
        truncate: true  // Clear table before import
      },
      // ... more imports
    ]
  }
});
```

**Flow:**
1. Read CSV file (fs.readFileSync)
2. Parse CSV with custom parser (handles quotes, escapes, BOM)
3. Map columns if specified
4. Transform each row if needed
5. Insert into model.create()

#### **V1 Seed Type** (Legacy Migration)
```javascript
createDatabase({
  adapter: 'memory',
  seed: {
    type: 'v1',
    dataDir: '/path/to/Data/',  // Directory with:
                                 // - Cotizador - CLIENTES.csv
                                 // - Cotizador - Items.csv
    truncate: true
  }
});
```

**Flow:**
1. Read `Cotizador - CLIENTES.csv` → CLIENTES table
2. Read `Cotizador - Items.csv` → Parse items & create:
   - CATEGORIAS (extracted from item rows)
   - PERFILES_PRECIO (one per item)
   - ITEM_CATALOGO (items with profile overrides)
   - REGLAS_NEGOCIO (auto-generate min/max pax constraints & pricing warnings)

**Key Logic:** V1 migration intelligently:
- Extracts pax constraints from item descriptions ("minimo 10 pax", "hasta 50 personas")
- Converts legacy hybrid prices ("$1000 + $50 por persona") to base+perPax formula
- Generates constraint rules with JSON-Logic conditions
- Deduplicates categories (multiple items in same category only create one CATEGORIA row)

### 1.4 Data Schema (Config_Schema.js)

```javascript
// Single source of truth for all 11 tables

DATA_SCHEMA = {
  CLIENTES: {
    columns: [
      { name: 'ID_Cliente', type: 'PK' },
      { name: 'Nombre_Empresa', type: 'TEXT' },
      // ...
    ]
  },
  CATEGORIAS: { /* ... */ },
  ITEM_CATALOGO: { /* ... */ },
  PERFILES_PRECIO: { /* ... */ },
  COMPOSICION_KIT: { /* ... */ },
  REGLAS_NEGOCIO: { /* ... */ },
  COTIZACIONES: { /* ... */ },
  LINEA_DETALLE: { /* ... */ },
  AJUSTES_COTIZACION: { /* ... */ },
  CACHE_COTIZACION: { /* ... */ },
  HISTORIAL_COTIZACION: { /* ... */ }
}
```

### 1.5 Usage Example

```javascript
// Initialize
const db = createDatabase({
  adapter: 'memory',
  seed: {
    type: 'v1',
    dataDir: './Data'
  }
});

// Query
const clientes = db.models.CLIENTES.all();
const acme = db.models.CLIENTES.find(c => c.Nombre_Empresa === 'Acme');
const items = db.models.ITEM_CATALOGO.where(i => i.Activo === true);

// Modify
const newItem = db.models.ITEM_CATALOGO.create({
  Nombre: 'Nuevo Item',
  ID_Categoria: 'CAT_123'
});

db.models.ITEM_CATALOGO.update({
  ...newItem,
  Nombre: 'Item Actualizado'
});

db.models.ITEM_CATALOGO.deleteById(newItem.ID_Item);
```

---

## Part 2: What Will Be Different in rebuild_components

### 2.1 Architectural Context: The Autonomous Component Pattern

In `rebuild_components`, **every feature is an autonomous component**:

```
Item Component:
├── domain/
│   ├── pricing.js (pure functions)
│   ├── quantity.js
│   └── rules.js
├── Item.js (state class with calculation pipeline)
├── machine/
│   └── itemMachine.js (XState actor)
├── logic/
│   └── createItemStandaloneComponent.js (mount function)
├── ui/
│   └── ItemStandalone.html (Alpine template)
└── tests/
    └── Item.test.js

Usage:
const item = Item.fromDefinition(definition);
item.setMode('basket');
item.receiveContext({ paxGlobal: 50 });
item.setOverride('pax', 25);
const display = item.toDisplayObject();  // → Alpine projection
```

### 2.2 Key Differences

| Aspect | claps_codelab | rebuild_components |
|--------|---|---|
| **Runtime** | Node.js | Browser (ES modules) |
| **File System** | fs, path (Node API) | None (fetch or bundled) |
| **Async** | Sync operations | Must handle async carefully |
| **State Management** | None (pure factory) | XState actor |
| **UI** | Separate (Components_DatabaseViewer.html) | Alpine.js integrated |
| **Component Pattern** | Service + API | Autonomous (actor + domain + UI) |
| **Reusability** | Import createDatabase() | Mount component in container |
| **Testing** | Node test runner | Vitest (browser-like) |
| **Seeding** | File I/O (fs.readFileSync) | Fetch API or bundled JSON |

### 2.3 The Core Difference: File System Access

**claps_codelab approach:**
```javascript
// Node.js file I/O
const raw = fs.readFileSync(filePath, 'utf8');
const rows = parseCsv(raw);
// Sync, guaranteed to work, blocking
```

**rebuild_components approach:**
```javascript
// Browser: no fs module
// Option A: Fetch from URL
const response = await fetch('/data/clientes.csv');
const raw = await response.text();

// Option B: Bundled JSON at build time
import seedData from './seeds/bundled-data.json';
// Pre-parsed, no fetch needed, zero latency
```

### 2.4 State Management: From Factory to Actor

**claps_codelab:**
```javascript
// Just a factory function - no state, no persistence
const db = createDatabase({ adapter: 'memory', seed });
// Use directly
db.models.CLIENTES.all()
```

**rebuild_components:**
```javascript
// Actor: manages lifecycle and state transitions
const actor = createActor(databaseViewerMachine)
  .subscribe(snapshot => {
    console.log('State:', snapshot.value);  // 'idle' | 'loading' | 'ready' | 'error'
    console.log('Context:', snapshot.context);  // { db, currentTable, rows, ... }
  })
  .start();

// Send events
actor.send({ type: 'SELECT_TABLE', table: 'CLIENTES' });
actor.send({ type: 'FILTER_ROWS', predicate: (row) => row.Activo === true });
```

### 2.5 UI Integration: From Standalone to Embedded

**claps_codelab:**
```html
<!-- Separate template file -->
<template x-teleport="body">
  <div x-show="databaseViewerOpen">
    <!-- self-contained, global state via Alpine data -->
  </div>
</template>
```

**rebuild_components:**
```html
<!-- Part of component logic -->
<div x-data="databaseViewer()" x-cloak>
  <div x-show="state === 'ready'">
    <!-- Bound to actor snapshot, not global state -->
  </div>
</div>
```

---

## Part 3: Modifications Required

### 3.1 Module Structure

```
claps_codelab_rebuild_components/packages/database-viewer/
├── src/
│   ├── core/                          (Ported from claps_codelab)
│   │   ├── IStore.js                  ✅ Copy unchanged
│   │   ├── ModelFactory.js            ✅ Copy unchanged
│   │   ├── createDatabase.js          ⚠️ Modify: remove seed handling
│   │   ├── schema.js                  ✅ Copy unchanged
│   │   ├── stores/
│   │   │   ├── IStore.js              ✅ Copy unchanged
│   │   │   ├── InMemoryStore.js       ✅ Copy unchanged
│   │   │   └── FileStore.js           ❌ Remove (no Node.js fs)
│   │   └── seeds/
│   │       ├── csvSeed.js             ⚠️ Refactor: use browser APIs
│   │       └── bundledSeed.js         🆕 New: pre-parsed JSON import
│   ├── domain/
│   │   ├── DatabaseContext.js         🆕 Query wrapper & results
│   │   └── index.js                   🆕 Export public API
│   ├── machine/
│   │   └── databaseViewerMachine.js   🆕 XState actor
│   ├── logic/
│   │   └── createDatabaseViewerComponent.js  🆕 Mount function
│   ├── ui/
│   │   └── DatabaseViewer.html        🆕 Alpine template (dev viewer)
│   ├── tests/
│   │   ├── viewer.test.js
│   │   └── integration.test.js
│   ├── index.js                       🆕 Public exports
│   └── README.md
├── package.json                       (vitest dependency)
└── DESIGN.md                          (This document's implementation notes)
```

### 3.2 Specific Modifications

#### **3.2.1 Remove Node.js Dependencies**

❌ **Files to delete or adapt:**
- `FileStore.js` (depends on fs, path)
- `csvSeed.js` (depends on fs for file reading)

✅ **What to keep:**
- `IStore.js`, `InMemoryStore.js` (pure JavaScript)
- `ModelFactory.js` (pure JavaScript)
- CSV parsing logic (works in browser)

#### **3.2.2 createDatabase.js**

**Current:**
```javascript
export function createDatabase({ 
  adapter = 'memory',    // ← File/GAS adapters need Node or special runtime
  seed = null,           // ← Expects file I/O
  ...
}) { ... }
```

**Modified:**
```javascript
export function createDatabase({ 
  adapter = 'memory',           // ← Only support 'memory' initially
  schema = DATA_SCHEMA,
  seed = null,                  // ← New: support async seed
  seedData = null,              // ← New: pre-bundled JSON
  onProgress = null             // ← New: callback for long operations
}) { 
  // 1. Create store
  // 2. Create models
  // 3. Apply seed OR seedData (NOT file I/O)
  return { models, adapter, schema, seedSummary }
}
```

#### **3.2.3 Seed System**

**Option A: Bundled JSON (RECOMMENDED for Phase 4a)**
```javascript
// At build time, include pre-parsed data
import { CLIENTES_SEED, CATEGORIAS_SEED, ITEMS_SEED } from './seeds/bundled.js';

const db = createDatabase({
  adapter: 'memory',
  seedData: {
    CLIENTES: CLIENTES_SEED,      // Array of records
    CATEGORIAS: CATEGORIAS_SEED,
    ITEM_CATALOGO: ITEMS_SEED
  }
});
```

**Option B: Fetch CSV at Runtime**
```javascript
const response = await fetch('/public/data/clientes.csv');
const csvText = await response.text();
const rows = parseCsv(csvText);

const db = createDatabase({
  adapter: 'memory'
});

db.models.CLIENTES.truncate();
rows.forEach(row => db.models.CLIENTES.create(row));
```

**Option C: V1 Migration (Handle Later)**
```javascript
// For now: placeholder
// Later: implement in browser context
```

#### **3.2.4 DatabaseContext Wrapper**

🆕 **New file:** `src/domain/DatabaseContext.js`

```javascript
export class DatabaseContext {
  constructor(db) {
    this.db = db;
    this.currentTable = null;
    this.filters = {};
    this.results = [];
  }

  // Query methods
  getTables() {
    return Object.keys(this.db.models);
  }

  selectTable(tableName) {
    this.currentTable = tableName;
    this.results = this.db.models[tableName].all();
    return this.results;
  }

  filter(predicate) {
    if (!this.currentTable) return [];
    this.results = this.db.models[this.currentTable].where(predicate);
    return this.results;
  }

  getColumns() {
    if (!this.currentTable) return [];
    return this.db.models[this.currentTable].getColumns();
  }

  export(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.results, null, 2);
    }
    if (format === 'csv') {
      return this.toCsv(this.results);
    }
  }

  // ... more methods
}
```

#### **3.2.5 XState Machine**

🆕 **New file:** `src/machine/databaseViewerMachine.js`

```javascript
import { createMachine } from 'xstate';

export const databaseViewerMachine = createMachine({
  id: 'databaseViewer',
  initial: 'loading',
  context: {
    db: null,
    context: null,  // DatabaseContext instance
    currentTable: null,
    rows: [],
    columns: [],
    error: null,
    loading: false
  },
  states: {
    loading: {
      on: {
        LOADED: 'ready',
        ERROR: 'error'
      }
    },
    ready: {
      on: {
        SELECT_TABLE: {
          actions: 'selectTable'
        },
        FILTER: {
          actions: 'filterRows'
        },
        EXPORT: {
          actions: 'exportData'
        },
        RESET: {
          target: 'loading'
        }
      }
    },
    error: {
      on: {
        RETRY: 'loading'
      }
    }
  }
});
```

#### **3.2.6 Alpine Component Mount**

🆕 **New file:** `src/logic/createDatabaseViewerComponent.js`

```javascript
export async function createDatabaseViewerComponent(container, options = {}) {
  const { seedData = null, schema = DATA_SCHEMA } = options;

  // 1. Create database
  const db = createDatabase({
    adapter: 'memory',
    schema,
    seedData
  });

  // 2. Create state machine & actor
  const dbContext = new DatabaseContext(db);
  const machine = databaseViewerMachine;
  const actor = createActor(machine, {
    input: { db, context: dbContext }
  }).start();

  // 3. Mount Alpine component
  Alpine.data('databaseViewer', () => ({
    state: actor.getSnapshot().value,
    context: actor.getSnapshot().context,
    tables: dbContext.getTables(),
    currentTable: null,
    rows: [],
    columns: [],

    init() {
      actor.subscribe(snapshot => {
        this.state = snapshot.value;
        this.context = snapshot.context;
        this.$watch('currentTable', () => this.onTableChange());
      });
      
      // Send initial event
      actor.send({ type: 'LOADED', db, context: dbContext });
    },

    onTableChange() {
      actor.send({
        type: 'SELECT_TABLE',
        table: this.currentTable
      });
    }
  }));

  Alpine.upgrade(container);
  return { db, actor, dbContext };
}
```

#### **3.2.7 Alpine Template**

🆕 **New file:** `src/ui/DatabaseViewer.html`

```html
<div x-data="databaseViewer()" x-cloak>
  <!-- Header -->
  <div class="db-viewer-header">
    <h2>Database Viewer (Dev)</h2>
    <p x-text="`${currentTable} · ${rows.length} rows`"></p>
  </div>

  <!-- Table Selection -->
  <div class="db-viewer-tabs">
    <template x-for="table in tables">
      <button
        x-text="table"
        :class="currentTable === table ? 'active' : ''"
        @click="currentTable = table"
      ></button>
    </template>
  </div>

  <!-- Filter & Export -->
  <div class="db-viewer-controls">
    <input type="search" placeholder="Filter by column..." />
    <button @click="$dispatch('export:json')">Export JSON</button>
    <button @click="$dispatch('export:csv')">Export CSV</button>
  </div>

  <!-- Results Table -->
  <div class="db-viewer-table" x-show="state === 'ready'">
    <table>
      <thead>
        <tr>
          <template x-for="col in columns">
            <th x-text="col"></th>
          </template>
        </tr>
      </thead>
      <tbody>
        <template x-for="row in rows">
          <tr>
            <template x-for="col in columns">
              <td x-text="row[col]"></td>
            </template>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <!-- Loading State -->
  <div x-show="state === 'loading'">Loading...</div>

  <!-- Error State -->
  <div x-show="state === 'error'" class="error">
    <p x-text="context.error"></p>
  </div>
</div>
```

### 3.3 Testing Strategy

```javascript
// tests/viewer.test.js

import { describe, it, expect } from 'vitest';
import { createDatabase } from '../src/core/createDatabase.js';
import { DatabaseContext } from '../src/domain/DatabaseContext.js';

describe('DatabaseContext', () => {
  it('loads tables from database', () => {
    const db = createDatabase({ adapter: 'memory' });
    const ctx = new DatabaseContext(db);
    
    expect(ctx.getTables()).toContain('CLIENTES');
    expect(ctx.getTables()).toContain('ITEM_CATALOGO');
  });

  it('selects and filters tables', () => {
    const db = createDatabase({
      adapter: 'memory',
      seedData: {
        CLIENTES: [
          { ID_Cliente: 'C1', Nombre_Empresa: 'Acme' },
          { ID_Cliente: 'C2', Nombre_Empresa: 'Beta' }
        ]
      }
    });
    
    const ctx = new DatabaseContext(db);
    ctx.selectTable('CLIENTES');
    
    expect(ctx.results).toHaveLength(2);
    
    ctx.filter(row => row.Nombre_Empresa === 'Acme');
    expect(ctx.results).toHaveLength(1);
  });
});

// tests/integration.test.js

describe('Database Viewer Component', () => {
  it('mounts as Alpine component', async () => {
    const container = document.createElement('div');
    const { db, actor } = await createDatabaseViewerComponent(container, {
      seedData: { /* ... */ }
    });
    
    expect(db).toBeDefined();
    expect(actor).toBeDefined();
  });
});
```

---

## Part 4: Implementation Timeline

### Phase 4a: Dev Viewer (IMMEDIATE)
- ✅ Copy & adapt core database layer (IStore, ModelFactory, InMemoryStore)
- ✅ Implement DatabaseContext (query wrapper)
- ✅ Create XState machine (state management)
- ✅ Build Alpine UI (table browser)
- ✅ Create mount function (component integration)
- ✅ Add tests
- ✅ Integrate into sandbox at `/step-04-database-viewer/`

**Deliverable:** Standalone component that browses in-memory seeded data

### Phase 4b: Admin Explorer (PHASE 4+)
- CRUD forms (create/edit/delete records)
- Schema validation
- Foreign key visualization
- Import/export wizard
- Search & advanced filtering

**Deliverable:** Full database management interface for production

### Phase 5+: Integration
- Item component queries database for definitions
- Category component loads from CATEGORIAS table
- Rules engine pulls from REGLAS_NEGOCIO table

---

## Part 5: Key Technical Decisions

### 5.1 Seed Data Strategy

**Decision: Use Bundled JSON for Phase 4a**

**Rationale:**
- ✅ Zero latency (no fetch, pre-parsed)
- ✅ No file system dependency
- ✅ Works in browser sandbox immediately
- ✅ Can generate from `Data/Data_Historica.csv` at build time
- ❌ Less flexible (static data)
- ❌ Can't load arbitrary files

**Later (Phase 4b):**
- Support fetch-based CSV loading
- Add V1 migration in browser context

### 5.2 State Management

**Decision: XState actor for lifecycle**

**Why NOT just props/Alpine data:**
- Old approach: Global Alpine data for viewer state
- New approach: Actor manages transitions (loading → ready → error)
- Benefits:
  - Predictable state machine
  - Easy to add async operations
  - Integrates with other components via actor model
  - Testable state transitions

### 5.3 Store Implementation

**Decision: Start with InMemoryStore only**

**Rationale:**
- FileStore depends on fs (Node.js)
- GasSheetStore depends on Google Apps Script runtime
- InMemoryStore works in browser immediately
- Later: Add browser-compatible adapters (IndexedDB, LocalStorage, Fetch)

### 5.4 Module Organization

**Decision: Separate `core/` (from claps_codelab) from new code**

**Rationale:**
- `src/core/` = Direct copies/minimal mods of claps_codelab
- `src/domain/` = Browser-specific wrappers
- `src/machine/` = XState actors
- `src/logic/` = Mount functions
- `src/ui/` = Alpine templates
- Easier to maintain, trace provenance, upgrade

---

## Part 6: Comparison Table

| Aspect | claps_codelab | rebuild_components |
|--------|---|---|
| **Primary Use** | Backend/GAS runtime | Frontend components |
| **Main Export** | `createDatabase()` factory | Component mount function |
| **State** | None (stateless) | XState machine |
| **UI** | Separate template | Integrated Alpine |
| **File I/O** | fs.readFileSync | Bundled JSON or Fetch |
| **Async** | Sync only | Actor-based async |
| **Testing** | Node test runner | Vitest (browser) |
| **Reusability** | Import factory | Mount component |
| **Extensions** | Seed system | Query API + UI |
| **Seed Sources** | CSV files + V1 migration | Bundled data initially |

---

## Next Steps

1. ✅ **Approve this analysis** (validate understanding)
2. 📝 **Write implementation plan** (step-by-step tasks)
3. 🔧 **Copy & adapt core files** (from claps_codelab)
4. 🆕 **Create new domain layer** (DatabaseContext)
5. 🎬 **Build state machine** (XState)
6. 🎨 **Create UI** (Alpine template)
7. 🧪 **Add tests**
8. 🏗️ **Integrate into sandbox**

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-24
