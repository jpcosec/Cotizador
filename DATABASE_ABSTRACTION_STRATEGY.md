# Database Abstraction Layer Strategy

**Status:** Architectural Planning
**Date:** 2026-02-18
**Goal:** Create a separate worktree for pluggable database adapters

---

## 1. Problem Statement

Currently, the **Models.js** layer is tightly coupled to **SheetDB.js**, which is GAS-specific:

```javascript
// Models.js (CURRENT - tightly coupled)
var Cliente = {
  all: function() {
    var db = new SheetDB(this.tableName);  // ← Only works with Google Sheets
    return db.all();
  }
};
```

**Issues:**
- ❌ Models can't work with other backends (local DB, Express, etc.)
- ❌ Testing requires actual Google Sheets or complex mocking
- ❌ No clear contract between business logic and persistence
- ❌ New adapters require rewriting Models
- ❌ GAS quota issues during development/testing

**Goal:**
✅ Create a **Store interface** that Models depend on
✅ Implement multiple adapters (GAS Sheets, InMemory, File, Postgres, etc.)
✅ Models work identically regardless of backend

---

## 2. Current State (Old Code Analysis)

### 2.1 Legacy Architecture Stack

```
Controllers (servicioGuardarCotizacion, servicioCargarCotizacion)
    ↓
Models (Cliente, Cotizacion, DetalleCotizacion, Item)
    ↓
SheetDB (GAS-specific microORM)
    ↓
SpreadsheetApp (Google Apps Script API)
```

### 2.2 What We're Recovering

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| **SheetDB.js** | 213 | Micro-ORM for Sheets CRUD | To abstract → Store interface |
| **Models.js** | 442 | Domain models + business logic | To refactor → use Store interface |
| **Config.js** | 19 | Global config | To enhance → environment-aware |
| **Controller_Cotizacion.js** | 268 | Service layer (save/load/PDF) | To adapt → new architecture |

### 2.3 Key Patterns to Preserve

From **Models.js**:
- ✅ Model methods: `find()`, `where()`, `create()`, `update()`, `delete()`
- ✅ Auto-ID generation: `generarID(prefix, tableName)`
- ✅ Validation logic: `Cliente.validate(data)`
- ✅ Relationships: `Cotizacion.getConDetalle()` (eager loading)
- ✅ Sorting/filtering: `Cotizacion.borradores()`, `Item.getByCategoria()`

From **SheetDB.js**:
- ✅ CRUD primitives: `all()`, `find()`, `where()`, `insert()`, `update()`, `deleteRow()`
- ✅ Row ↔ Object mapping: `rowToObject()`, `objectToRow()`
- ✅ Header caching for perf
- ✅ Error handling (sheet not found, empty sheet)

---

## 3. New Architecture: Store Interface

### 3.1 Store Interface Contract

```javascript
// IStore.js - Abstract interface (like an interface in TypeScript)

/**
 * Generic store interface - implementations: GasSheetStore, InMemoryStore, FileStore, etc.
 */
export class IStore {
  // ============ QUERY ============

  /**
   * Get all records from table
   * @returns {Array<Object>}
   */
  all() { throw new Error('Not implemented'); }

  /**
   * Find records by predicate
   * @param {Function} predicate - (record) => boolean
   * @returns {Array<Object>}
   */
  where(predicate) { throw new Error('Not implemented'); }

  /**
   * Find first record by predicate
   * @param {Function} predicate
   * @returns {Object|null}
   */
  find(predicate) { throw new Error('Not implemented'); }

  // ============ MUTATION ============

  /**
   * Insert record with auto-generated ID
   * @param {Object} data
   * @returns {Object} - returned object with _id set
   */
  insert(data) { throw new Error('Not implemented'); }

  /**
   * Update existing record
   * @param {Object} data - must have _id
   * @returns {Object}
   */
  update(data) { throw new Error('Not implemented'); }

  /**
   * Delete record by ID
   * @param {string|number} id
   */
  deleteById(id) { throw new Error('Not implemented'); }

  /**
   * Delete all records (truncate)
   */
  truncate() { throw new Error('Not implemented'); }

  // ============ METADATA ============

  /**
   * Get column names
   * @returns {Array<string>}
   */
  getColumns() { throw new Error('Not implemented'); }

  /**
   * Get record by internal row ID (GAS-specific, can be null for other adapters)
   * @param {number} rowIndex
   * @returns {Object|null}
   */
  getByRowIndex(rowIndex) { throw new Error('Not implemented'); }
}
```

### 3.2 Concrete Implementations

#### A. GasSheetStore (replace SheetDB)

```javascript
// stores/GasSheetStore.js
export class GasSheetStore extends IStore {
  constructor(sheetName, spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
    this.ss = SpreadsheetApp.openById(spreadsheetId);
    this.sheet = this.ss.getSheetByName(sheetName);
    this._headersCache = null;
  }

  all() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return [];

    const data = this.sheet.getRange(1, 1, lastRow, this.sheet.getLastColumn()).getValues();
    const headers = data[0];
    return data.slice(1).map((row, idx) => ({
      _id: idx + 2,  // Row number (1-indexed, skip header)
      ...this._rowToObject(row, headers)
    }));
  }

  insert(data) {
    const row = this._objectToRow(data);
    this.sheet.appendRow(row);
    data._id = this.sheet.getLastRow();
    return data;
  }

  // ... other methods ...
}
```

#### B. InMemoryStore (for testing & development)

```javascript
// stores/InMemoryStore.js
export class InMemoryStore extends IStore {
  constructor(tableName) {
    this.tableName = tableName;
    this.records = {};
    this.nextId = 1;
  }

  all() {
    return Object.values(this.records);
  }

  find(predicate) {
    const results = this.where(predicate);
    return results.length > 0 ? results[0] : null;
  }

  insert(data) {
    const id = this.nextId++;
    data._id = id;
    this.records[id] = { ...data };
    return data;
  }

  // ... other methods ...
}
```

#### C. FileStore (from claps_codelab_xstate)

Already exists! Just needs to implement IStore interface.

---

## 4. Refactored Models Layer

### 4.1 Model Base Class

```javascript
// models/Model.js

export class Model {
  static tableName = 'BASE';
  static store = null;  // Injected at runtime

  /**
   * Set the store implementation for this model
   */
  static setStore(store) {
    this.store = store;
  }

  static all() {
    return this.store.all();
  }

  static find(predicate) {
    return this.store.find(predicate);
  }

  static where(predicate) {
    return this.store.where(predicate);
  }

  static insert(data) {
    // Optional: validate before insert
    const errors = this.validate(data);
    if (errors) throw new Error(errors.join(', '));

    return this.store.insert(data);
  }

  static update(data) {
    return this.store.update(data);
  }

  static delete(id) {
    return this.store.deleteById(id);
  }

  /**
   * Override in subclass to add validation
   */
  static validate(data) {
    return null; // No errors
  }
}
```

### 4.2 Cliente Model (Refactored)

```javascript
// models/Cliente.js

export class Cliente extends Model {
  static tableName = 'CLIENTES';

  static findByRUT(rut) {
    return this.find(c => c.RUT === rut);
  }

  static search(query) {
    const q = query.toLowerCase();
    return this.where(c =>
      c.Nombre_Empresa &&
      c.Nombre_Empresa.toLowerCase().includes(q)
    );
  }

  static getCotizaciones(idCliente) {
    return Cotizacion.where(c => c.ID_Cliente === idCliente);
  }

  static validate(data) {
    const errors = [];

    if (!data.Nombre_Empresa) {
      errors.push("Nombre de empresa es requerido");
    }

    if (!data.RUT) {
      errors.push("RUT es requerido");
    }

    if (data.RUT && !validarRUT(data.RUT)) {
      errors.push("RUT inválido (formato: 12345678-9)");
    }

    // Check duplicates
    if (data.RUT) {
      const existe = this.findByRUT(data.RUT);
      if (existe && existe._id !== data._id) {
        errors.push("Ya existe un cliente con este RUT");
      }
    }

    return errors.length > 0 ? errors : null;
  }
}
```

---

## 5. Configuration Strategy

### 5.1 Environment-Aware Config

```javascript
// config/index.js

export const config = {
  // Environment: 'GAS' | 'NODE' | 'TEST'
  env: typeof SpreadsheetApp !== 'undefined' ? 'GAS' : 'NODE',

  // Database configuration
  db: {
    spreadsheetId: "1Fh3IddFyJwywCUCt01KVD1uGTySmQW8FYkq9XxYf_zU",
    tables: {
      CLIENTES: "CLIENTES",
      COTIZACIONES: "COTIZACIONES",
      DETALLE: "DETALLE_COTIZACION",
      ITEMS: "Items"
    }
  },

  // Store selection
  storeType: process.env.STORE_TYPE || 'GAS',  // 'GAS' | 'MEMORY' | 'FILE'
};

// At app startup, init stores:
export function initializeStores(storeType = config.storeType) {
  let stores = {};

  if (storeType === 'GAS') {
    stores = {
      clientes: new GasSheetStore('CLIENTES', config.db.spreadsheetId),
      cotizaciones: new GasSheetStore('COTIZACIONES', config.db.spreadsheetId),
      // ...
    };
  } else if (storeType === 'MEMORY') {
    stores = {
      clientes: new InMemoryStore('CLIENTES'),
      cotizaciones: new InMemoryStore('COTIZACIONES'),
      // ...
    };
  }

  // Inject stores into models
  Cliente.setStore(stores.clientes);
  Cotizacion.setStore(stores.cotizaciones);
  // ...

  return stores;
}
```

---

## 6. Schema-Driven Model Generation (CRITICAL!)

**See: DATABASE_SCHEMA_DRIVEN_MODELS.md**

The CONFIG_SCHEMA.js defines 10 tables, but old Models.js only has 4:

| Table | Schema | Old Models | Gap |
|-------|--------|------------|-----|
| CLIENTES | ✅ | ✅ | No gap |
| CATEGORIAS | ✅ | ❌ | Missing |
| ITEM_CATALOGO | ✅ | ⚠️ partial | Incomplete |
| PERFILES_PRECIO | ✅ | ❌ | Missing |
| COMPOSICION_KIT | ✅ | ❌ | Missing |
| REGLAS_NEGOCIO | ✅ | ❌ | Missing |
| COTIZACIONES | ✅ | ✅ | No gap |
| LINEA_DETALLE | ✅ | ⚠️ partial | Incomplete |
| AJUSTES_COTIZACION | ✅ | ❌ | Missing |
| CACHE_COTIZACION | ✅ | ❌ | Missing |
| HISTORIAL_COTIZACION | ✅ | ❌ | Missing |

**Solution:** ModelFactory with runtime introspection or build-time generation.

---

## 7. New Worktree: `claps_codelab_database`

### 7.1 Proposed Structure

```
claps_codelab_database/
├── package.json
├── README.md
├── changelog.md
├── docs/
│   ├── DATABASE_ARCHITECTURE.md
│   └── STORE_INTERFACE.md
├── src/
│   ├── index.js                    # Main export
│   ├── interface/
│   │   └── IStore.js               # Abstract base
│   ├── stores/
│   │   ├── GasSheetStore.js        # Google Sheets adapter
│   │   ├── InMemoryStore.js        # RAM (testing)
│   │   └── FileStore.js            # File system (from xstate worktree)
│   ├── models/
│   │   ├── Model.js                # Base class
│   │   ├── Cliente.js
│   │   ├── Cotizacion.js
│   │   ├── DetalleCotizacion.js
│   │   └── Item.js
│   ├── config/
│   │   └── index.js                # Env-aware config + initialization
│   └── utils/
│       ├── validators.js           # validarRUT(), etc.
│       ├── generators.js           # generarID(), timestamp(), etc.
│       └── helpers.js              # formatFecha(), etc.
├── tests/
│   ├── models.test.js              # Model behavior (with InMemoryStore)
│   ├── stores.test.js              # Store interface contract
│   └── fixtures.js                 # Test data
├── .clasp.json
└── vitest.config.js
```

### 6.2 Key Differences from Old Code

| Aspect | Old (SheetDB) | New (IStore) |
|--------|---------------|--------------|
| **Abstraction** | SheetDB class only | IStore interface + adapters |
| **Testing** | Needs actual Sheets | Works with InMemoryStore |
| **New backends** | Rewrite Models | Just add Store adapter |
| **ID tracking** | `_rowIndex` (GAS-specific) | `_id` (generic) |
| **Dependency flow** | Models → SheetDB → GAS API | Models → IStore ← adapters |
| **Validation** | In Controllers | In Models (DDD pattern) |

---

## 7. Integration with Main Architecture

### 7.1 Dependency Graph (Final)

```
┌──────────────────────────────────┐
│ Frontend (Alpine.js)             │
│ ├─ Index.html                    │
│ └─ Bridge to XState              │
└────────────┬─────────────────────┘
             │ events

┌──────────────────────────────────┐
│ XState Orchestration             │
│ ├─ State machine                 │
│ └─ Adapters (actions/guards)     │
└────────────┬─────────────────────┘
             │ calls

┌──────────────────────────────────┐
│ Pricing Engine                   │
│ ├─ expand()                      │
│ ├─ pricing()                     │
│ └─ taxes()                       │
└────────────┬─────────────────────┘
             │ persists via

┌──────────────────────────────────┐
│ **Database Layer** (NEW)          │
│ ├─ Models (Cliente, Cotizacion)  │
│ ├─ IStore interface              │
│ └─ Adapters (GAS, InMemory, File)│
└──────────────────────────────────┘
```

### 7.2 Monorepo Workspaces (Updated)

```json
{
  "name": "claps-codelab-monorepo",
  "workspaces": [
    "packages/database",
    "packages/pricing",
    "packages/xstate",
    "packages/frontend"
  ]
}
```

Dependencies:
- `pricing`: standalone
- `xstate`: depends on `@claps/database`
- `frontend`: depends on `@claps/xstate`
- `database`: standalone

---

## 8. Implementation Phases

### Phase 1: Create Database Worktree (2-3 hours)

1. Initialize git worktree: `git worktree add claps_codelab_database feature/database-abstraction`
2. Create package.json + folder structure
3. Implement IStore interface
4. Create GasSheetStore adapter (from SheetDB.js)
5. Create InMemoryStore adapter
6. Write tests for store interface contract
7. Refactor Models using base class
8. Write Model tests

### Phase 2: Integrate with Pricing (1 hour)

- Update pricing to optionally use database layer for REGLAS_NEGOCIO
- Mock store in pricing tests

### Phase 3: Integrate with XState (1-2 hours)

- XState actions use models for persistence
- Tests verify full data flow

### Phase 4: Bundling & GAS Deployment (2 hours)

- Rollup bundles database + xstate + pricing
- GAS wrapper functions use models
- Test end-to-end

---

## 9. Success Criteria

✅ IStore interface fully documented
✅ All 3 adapters (GAS, InMemory, File) pass contract tests
✅ Models work identically with any store
✅ All existing tests pass with new Models
✅ Can swap stores at runtime: `Cliente.setStore(new InMemoryStore('CLIENTES'))`
✅ Database layer is completely decoupled from GAS
✅ Can be deployed as `@claps/database` npm package

---

## 10. Questions for Clarification

- [ ] Should we keep `_rowIndex` for GAS or use generic `_id`?
- [ ] Do we need relationship loading (eager/lazy)?
- [ ] Should IStore support transactions?
- [ ] Any other backend adapters needed? (Postgres, MongoDB, etc.)
- [ ] When should models validate (on insert, on update, both)?
