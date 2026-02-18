# Schema-Driven Model Generation Strategy

**Status:** Critical Architecture Decision
**Date:** 2026-02-18
**Related:** DATABASE_ABSTRACTION_STRATEGY.md

---

## Problem: Manual Models vs Schema Drift

The CONFIG_SCHEMA.js defines 10 tables, but the old Models.js only has 4 custom models:

| Table | In Schema | In Old Models | Status |
|-------|-----------|---------------|--------|
| CLIENTES | ✅ | ✅ Cliente | Implemented |
| CATEGORIAS | ✅ | ❌ | Missing |
| ITEM_CATALOGO | ✅ | ⚠️ Item (partial) | Partial |
| PERFILES_PRECIO | ✅ | ❌ | Missing |
| COMPOSICION_KIT | ✅ | ❌ | Missing |
| REGLAS_NEGOCIO | ✅ | ❌ | Missing |
| COTIZACIONES | ✅ | ✅ Cotizacion | Implemented |
| LINEA_DETALLE | ✅ | ⚠️ DetalleCotizacion | Partial |
| AJUSTES_COTIZACION | ✅ | ❌ | Missing |
| CACHE_COTIZACION | ✅ | ❌ | Missing |
| HISTORIAL_COTIZACION | ✅ | ❌ | Missing |

**Risk:** Schema changes require manual model updates → Drift → Bugs

---

## Solution: Schema-Driven Code Generation

### 1. Single Source of Truth: CONFIG_SCHEMA.js

```javascript
// src/Config/Config_Schema.js (ALREADY EXISTS!)

export const DATA_SCHEMA = {
  CLIENTES: {
    description: "Base de datos de clientes.",
    columns: [
      { name: "ID_Cliente", type: "PK", desc: "Identificador" },
      { name: "Nombre_Empresa", type: "TEXT", desc: "Razón Social" },
      { name: "RUT", type: "TEXT", desc: "Identificador Fiscal" },
      // ...
    ]
  },

  ITEM_CATALOGO: {
    description: "Inventario vendible.",
    columns: [
      { name: "ID_Item", type: "PK", desc: "SKU único" },
      // ...
    ]
  },

  // ... 10 tables total
};
```

### 2. Code Generation Approach

**Option A: Build-Time Generation (Recommended)**

```bash
# scripts/generate-models.js
npm run generate:models
  ↓
reads CONFIG_SCHEMA.js
  ↓
generates src/models/*.js (auto)
  ↓
generated files are .gitignore'd
  ↓
committed to git when schemas change
```

**Option B: Runtime Introspection (Simpler)**

```javascript
// src/models/ModelFactory.js

import { DATA_SCHEMA } from '../Config/Config_Schema.js';

export class ModelFactory {
  /**
   * Create a model class for any table in CONFIG_SCHEMA
   */
  static createModel(tableName) {
    const schema = DATA_SCHEMA[tableName];
    if (!schema) throw new Error(`Table ${tableName} not in schema`);

    return class DynamicModel extends Model {
      static tableName = tableName;

      static getSchema() {
        return schema;
      }

      static getColumns() {
        return schema.columns.map(col => col.name);
      }

      static getPrimaryKey() {
        const pk = schema.columns.find(col => col.type === 'PK');
        return pk ? pk.name : null;
      }

      // Custom validation inherited from schema
      static validate(data) {
        const errors = super.validate(data);
        if (errors) return errors;

        // Add schema-specific validations
        for (const col of schema.columns) {
          if (col.type === 'PK' && !data[col.name]) {
            errors.push(`${col.name} is required (Primary Key)`);
          }
        }

        return errors.length > 0 ? errors : null;
      }
    };
  }
}
```

Usage:
```javascript
// No need for separate Cliente.js, Item.js, etc.
const Cliente = ModelFactory.createModel('CLIENTES');
const Item = ModelFactory.createModel('ITEM_CATALOGO');
const Regla = ModelFactory.createModel('REGLAS_NEGOCIO');

// All work identically!
const clientes = await Cliente.all();
const reglas = await Regla.where(r => r.Etapa === 'RESTRICCION_UI');
```

### 3. Custom Model Extensions (When Needed)

For tables requiring **business logic** beyond CRUD:

```javascript
// src/models/Cliente.js (optional - only if needed)

import { ModelFactory } from './ModelFactory.js';

const ClienteBase = ModelFactory.createModel('CLIENTES');

export class Cliente extends ClienteBase {
  /**
   * Find by RUT (business logic)
   */
  static findByRUT(rut) {
    return this.find(c => c.RUT === rut);
  }

  /**
   * Search by company name (fuzzy)
   */
  static search(query) {
    const q = query.toLowerCase();
    return this.where(c =>
      c.Nombre_Empresa &&
      c.Nombre_Empresa.toLowerCase().includes(q)
    );
  }

  /**
   * Get all quotations for this client
   */
  static getCotizaciones(idCliente) {
    const Cotizacion = ModelFactory.createModel('COTIZACIONES');
    return Cotizacion.where(c => c.ID_Cliente === idCliente);
  }

  /**
   * Custom validation beyond schema
   */
  static validate(data) {
    const errors = super.validate(data);

    // Validate RUT format
    if (data.RUT && !validarRUT(data.RUT)) {
      errors.push("RUT inválido (formato: 12345678-9)");
    }

    // Check for duplicates
    if (data.RUT) {
      const existe = this.findByRUT(data.RUT);
      if (existe && existe.ID_Cliente !== data.ID_Cliente) {
        errors.push("Ya existe un cliente con este RUT");
      }
    }

    return errors.length > 0 ? errors : null;
  }
}
```

---

## 4. Updated Worktree Structure

```
claps_codelab_database/
├── src/
│   ├── index.js
│   ├── interface/
│   │   └── IStore.js
│   ├── stores/
│   │   ├── GasSheetStore.js
│   │   ├── InMemoryStore.js
│   │   └── FileStore.js
│   ├── models/
│   │   ├── Model.js                 # Base class
│   │   ├── ModelFactory.js          # (NEW) Dynamic generation
│   │   ├── Cliente.js               # (Optional) Custom logic only
│   │   ├── Cotizacion.js            # (Optional)
│   │   ├── Reglas.js                # (NEW) Business logic for rules
│   │   ├── index.js                 # Export all models
│   │   └── generated/               # (Optional) Build-time output
│   │       ├── Categorias.js        # Auto-generated
│   │       ├── PerfilesPrecio.js    # Auto-generated
│   │       ├── ComposicionKit.js    # Auto-generated
│   │       └── ...
│   ├── config/
│   │   ├── Config_Schema.js         # (COPY from main repo)
│   │   └── index.js                 # Env initialization
│   └── utils/
│       ├── validators.js
│       ├── generators.js
│       └── schema-utils.js          # (NEW) Introspection helpers
├── scripts/
│   └── generate-models.js           # (Optional) Build-time generator
├── tests/
│   ├── models.test.js
│   ├── schema-introspection.test.js # Test model generation
│   └── fixtures.js
└── vitest.config.js
```

---

## 5. Benefits of Schema-Driven Approach

| Aspect | Manual Models | Schema-Driven |
|--------|---------------|---------------|
| **New table** | Write Model class | Automatic or trivial |
| **Schema change** | Manual update | Re-generate or auto-picked up |
| **Column addition** | Manual update | Automatic |
| **Validation rules** | Manual per table | Schema + custom layer |
| **Drift risk** | High | Zero |
| **Test coverage** | Per table | Generic via factory |
| **Boilerplate** | High | Low |

---

## 6. Implementation Plan

### Phase 1: Setup ModelFactory + Introspection (1 hour)

1. Copy CONFIG_SCHEMA.js to database worktree
2. Create ModelFactory.js with `createModel(tableName)` method
3. Create generic Model.js base class (schema-aware)
4. Write tests for schema introspection

### Phase 2: Generate Core Models (1 hour)

1. Use ModelFactory to generate all 10 models
2. Test that all models respond to `all()`, `find()`, `where()`, etc.
3. Verify schema columns match store expectations

### Phase 3: Add Custom Business Logic (1-2 hours)

1. Create custom classes for models with business logic (Cliente, Cotizacion, Reglas)
2. Extend factory-generated base with custom methods
3. Update tests to verify custom methods work

### Phase 4: Integration Tests (1 hour)

1. Test that models work with all store adapters (GAS, InMemory, File)
2. Test that schema changes propagate correctly
3. Verify no drift between schema and models

---

## 7. Example: All 10 Models in Action

```javascript
// src/models/index.js

import { ModelFactory } from './ModelFactory.js';
import { Cliente } from './Cliente.js';  // Custom
import { Cotizacion } from './Cotizacion.js';  // Custom

// Auto-generated or factory-created
export const Categorias = ModelFactory.createModel('CATEGORIAS');
export const PerfilesPrecio = ModelFactory.createModel('PERFILES_PRECIO');
export const ItemCatalogo = ModelFactory.createModel('ITEM_CATALOGO');
export const ComposicionKit = ModelFactory.createModel('COMPOSICION_KIT');
export const ReglasNegocio = ModelFactory.createModel('REGLAS_NEGOCIO');
export const AjustesCotizacion = ModelFactory.createModel('AJUSTES_COTIZACION');
export const CacheCotizacion = ModelFactory.createModel('CACHE_COTIZACION');
export const HistorialCotizacion = ModelFactory.createModel('HISTORIAL_COTIZACION');
export const LineaDetalle = ModelFactory.createModel('LINEA_DETALLE');

// Custom models with business logic
export { Cliente, Cotizacion };

export { ModelFactory };
```

Usage in XState or Pricing:
```javascript
import {
  Cliente, Cotizacion, ItemCatalogo, ReglasNegocio,
  LineaDetalle, PerfilesPrecio, Categorias
} from '@claps/database';

// All work seamlessly
const cliente = await Cliente.find(c => c.RUT === '12345678-9');
const items = await ItemCatalogo.all();
const reglasPorEtapa = await ReglasNegocio.where(r => r.Etapa === 'AJUSTE_LINEA');
const lineas = await LineaDetalle.where(l => l.ID_Cotizacion === 'COT-0001');
```

---

## 8. Questions for You

- [ ] Prefer runtime introspection (simpler, no build step) or build-time generation?
- [ ] Should all models be factory-generated or keep custom classes for business logic?
- [ ] Should ModelFactory be in the database worktree or in main repo?
- [ ] Do we need schema validation at write-time (enforce types, enums)?
- [ ] Should CONFIG_SCHEMA.js be versioned/migrated?

---

## 9. Next Steps

1. Decide: Runtime (Option B - simpler) vs Build-time (Option A - cleaner CI/CD)
2. Create database worktree with ModelFactory
3. Generate all 10 models programmatically
4. Test with all store adapters
5. Document model usage patterns

This ensures **schema is always the source of truth**, and models auto-adapt.
