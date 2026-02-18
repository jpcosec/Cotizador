# Quick Start: Creating Real Quotations

This guide shows you how to use the quotation state machine to create, edit, and save real quotations with file-based persistence.

---

## Table of Contents

1. [Setup](#setup)
2. [Basic Usage](#basic-usage)
3. [Complete Example](#complete-example)
4. [Common Workflows](#common-workflows)
5. [Inspecting Saved Quotations](#inspecting-saved-quotations)
6. [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Create File-Based Store Adapter

Create `src/DataStore/FileStore.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data/quotations');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class FileStore {
  constructor() {
    this._memory = new Map(); // In-memory cache
    this._loadAllQuotations();
  }

  _loadAllQuotations() {
    if (!fs.existsSync(DATA_DIR)) return;
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(DATA_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this._memory.set(data.ID_Cotizacion, data);
      }
    });
  }

  // Standard InMemoryStore interface
  seed(tableName, rows) {
    // For seeding master data (pricing, items, rules)
    if (!this._memory.has(`TABLE:${tableName}`)) {
      this._memory.set(`TABLE:${tableName}`, []);
    }
    this._memory.set(`TABLE:${tableName}`, [...rows]);
  }

  insert(tableName, row) {
    // Special handling for CACHE_COTIZACION (save to file)
    if (tableName === 'CACHE_COTIZACION') {
      const cotizacionId = row.ID_Cotizacion;
      const filePath = path.join(DATA_DIR, `${cotizacionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(row, null, 2));
      this._memory.set(cotizacionId, row);
      console.log(`✓ Quotation saved: ${cotizacionId}`);
      return;
    }

    // For other tables, store in memory
    if (!this._memory.has(tableName)) {
      this._memory.set(tableName, []);
    }
    this._memory.get(tableName).push(row);
  }

  all(tableName) {
    return this._memory.get(tableName) || [];
  }

  findById(tableName, pkField, id) {
    return this.all(tableName).find(r => r[pkField] === id) || null;
  }

  findAll(tableName, filters = {}) {
    const entries = Object.entries(filters);
    if (!entries.length) return this.all(tableName);
    return this.all(tableName).filter(r =>
      entries.every(([k, v]) => r[k] === v)
    );
  }

  findByFK(tableName, fkField, value) {
    return this.all(tableName).filter(r => r[fkField] === value);
  }

  // File-store specific methods
  getQuotationFile(cotizacionId) {
    const filePath = path.join(DATA_DIR, `${cotizacionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  listQuotations() {
    if (!fs.existsSync(DATA_DIR)) return [];
    return fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  deleteQuotation(cotizacionId) {
    const filePath = path.join(DATA_DIR, `${cotizacionId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this._memory.delete(cotizacionId);
    }
  }
}
```

### 2. Create Quotation Service

Create `src/QuotationService.js`:

```javascript
import { createActor } from 'xstate';
import { createQuotationXStateMachine } from './Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from './Orchestration/adapters/index.js';
import { FileStore } from './DataStore/FileStore.js';
import { createSeededStore } from './tests/helpers/store_factory.js';

/**
 * Main service for creating and managing quotations.
 * Manages the state machine actor and file-based persistence.
 */
export class QuotationService {
  constructor() {
    this.store = createSeededStore(); // Master data: items, prices, rules
    this.actor = null;
  }

  /**
   * Start a new quotation workflow.
   * Returns: actor ready to send events
   */
  startNew(clienteId, paxGlobal, opts = {}) {
    const machine = createQuotationXStateMachine(quotationAdapters);

    this.actor = createActor(machine, {
      input: { store: this.store },
    });

    this.actor.start();

    // Initialize quotation
    this.actor.send({
      type: 'START_NEW_QUOTATION',
    });

    this.actor.send({
      type: 'CREATE_NEW',
    });

    this.actor.send({
      type: 'QUOTATION_INITIALIZED',
      clienteId,
      paxGlobal,
      fechaEvento: opts.fechaEvento || new Date().toISOString().split('T')[0],
      duracionDias: opts.duracionDias || 1,
      cotizacionId: opts.cotizacionId || `COT_${Date.now()}`,
    });

    return this.actor;
  }

  /**
   * Add an item to the current quotation.
   */
  addItem(itemId, overrides = {}) {
    if (!this.actor) throw new Error('No active quotation. Call startNew() first.');
    this.actor.send({
      type: 'ADD_ITEM',
      itemId,
      overrides,
    });
  }

  /**
   * Update an item in the quotation.
   */
  updateItem(lineId, overrides = {}) {
    if (!this.actor) throw new Error('No active quotation. Call startNew() first.');
    this.actor.send({
      type: 'UPDATE_ITEM',
      lineId,
      overrides,
    });
  }

  /**
   * Remove an item from the quotation.
   */
  removeItem(lineId) {
    if (!this.actor) throw new Error('No active quotation. Call startNew() first.');
    this.actor.send({
      type: 'REMOVE_ITEM',
      lineId,
    });
  }

  /**
   * Validate and save the quotation.
   * Returns: final context with saved quotation
   */
  validateAndSave() {
    if (!this.actor) throw new Error('No active quotation. Call startNew() first.');

    // Move to validation state
    this.actor.send({ type: 'ADVANCE_TO_VALIDATION' });

    // Validate and save
    this.actor.send({ type: 'VALIDATE_AND_SAVE' });

    return this.getSnapshot();
  }

  /**
   * Get current quotation state and context.
   */
  getSnapshot() {
    if (!this.actor) return null;
    return this.actor.getSnapshot();
  }

  /**
   * Get human-readable context for inspection.
   */
  inspect() {
    const snap = this.getSnapshot();
    if (!snap) return null;

    return {
      state: snap.value,
      quotation: snap.context.quotation,
      items: snap.context.lineas.map(l => ({
        id: l.ID_Linea,
        item: l.ID_Item,
        price: l._netoBase,
        removed: l._removed || false,
      })),
      totals: snap.context.totals,
      errors: snap.context.errors,
      messages: snap.context.messages,
    };
  }

  /**
   * Load a saved quotation from file.
   */
  loadFromFile(cotizacionId) {
    const store = new FileStore();
    const data = store.getQuotationFile(cotizacionId);
    if (!data) {
      throw new Error(`Quotation not found: ${cotizacionId}`);
    }
    return data.Snapshot_JSON ? JSON.parse(data.Snapshot_JSON) : data;
  }

  /**
   * List all saved quotations.
   */
  listSavedQuotations() {
    const store = new FileStore();
    return store.listQuotations();
  }

  /**
   * Return to browse state (discard current quotation).
   */
  cancel() {
    if (!this.actor) return;
    this.actor.send({ type: 'RETURN_TO_BROWSE' });
    this.actor = null;
  }
}
```

---

## Basic Usage

### Import and Initialize

```javascript
import { QuotationService } from './src/QuotationService.js';

const service = new QuotationService();
```

### Create a Simple Quotation

```javascript
// 1. Start new quotation for 25 people
const actor = service.startNew(
  'CLI_CORP',           // Client ID
  25,                   // Number of attendees
  {
    fechaEvento: '2025-06-15',
    duracionDias: 1,
  }
);

// 2. Add items
service.addItem('ITEM_CHINOOK');
service.addItem('ITEM_COFFEE_BASIC');
service.addItem('ITEM_ALMUERZO');

// 3. Review prices
console.log(service.inspect());
// {
//   state: { quotation_workflow: { quotation: 'basket' }, database_management: 'closed' },
//   quotation: { cotizacion: { ... }, paxGlobal: 25, ... },
//   items: [
//     { id: 'LIN_1', item: 'ITEM_CHINOOK', price: 385000, removed: false },
//     { id: 'LIN_2', item: 'ITEM_COFFEE_BASIC', price: 159500, removed: false },
//     { id: 'LIN_3', item: 'ITEM_ALMUERZO', price: 682775, removed: false },
//   ],
//   totals: { subtotal: 1227275, taxes: [...], total: 1460537 },
//   errors: [],
//   messages: [],
// }

// 4. Save quotation
const result = service.validateAndSave();
console.log(`✓ Saved quotation: ${result.context.quotation.cotizacion.ID_Cotizacion}`);
```

---

## Complete Example

Create `examples/create-quotation.js`:

```javascript
import { QuotationService } from '../src/QuotationService.js';

async function main() {
  const service = new QuotationService();

  console.log('\n📝 Creating Corporate Seminar Quotation\n');

  // 1. Start new quotation
  console.log('1. Starting quotation for 25-person corporate seminar...');
  const actor = service.startNew('CLI_CORP', 25, {
    fechaEvento: '2025-06-15',
    duracionDias: 1,
  });

  const state = service.getSnapshot();
  console.log(`   ✓ State: ${JSON.stringify(state.value.quotation_workflow)}`);

  // 2. Add items
  console.log('\n2. Adding items to quotation...');
  const items = [
    { id: 'ITEM_CHINOOK', name: 'Salón Chinook' },
    { id: 'ITEM_COFFEE_BASIC', name: 'Café Básico' },
    { id: 'ITEM_ALMUERZO', name: 'Almuerzo' },
  ];

  items.forEach(item => {
    service.addItem(item.id);
    console.log(`   ✓ Added: ${item.name}`);
  });

  // 3. Inspect basket
  console.log('\n3. Current basket:');
  const basket = service.inspect();
  basket.items.forEach(item => {
    console.log(
      `   • ${item.item}: CLP ${item.price.toLocaleString('es-CL')}`
    );
  });
  console.log(
    `   ├─ Subtotal: CLP ${basket.totals.subtotal.toLocaleString('es-CL')}`
  );
  console.log(
    `   └─ Total (IVA 19%): CLP ${basket.totals.total.toLocaleString('es-CL')}`
  );

  // 4. Modify: increase pax
  console.log('\n4. Updating: increasing pax from 25 to 35...');
  const lineId = basket.items[0].id;
  service.updateItem(lineId, { Override_Pax: 35 });
  const updated = service.inspect();
  console.log(
    `   ✓ New total: CLP ${updated.totals.total.toLocaleString('es-CL')}`
  );

  // 5. Validate and save
  console.log('\n5. Validating and saving quotation...');
  const result = service.validateAndSave();
  const quotationId = result.context.quotation.cotizacion.ID_Cotizacion;
  console.log(`   ✓ Quotation saved: ${quotationId}`);
  console.log(`   ✓ State: ${JSON.stringify(result.value.quotation_workflow)}`);

  // 6. List all saved quotations
  console.log('\n6. All saved quotations:');
  const saved = service.listSavedQuotations();
  saved.forEach(id => console.log(`   • ${id}`));

  // 7. Load and inspect saved quotation
  console.log(`\n7. Loading saved quotation: ${quotationId}`);
  const loaded = service.loadFromFile(quotationId);
  console.log(`   ✓ Items: ${loaded.lineas.length}`);
  console.log(
    `   ✓ Total: CLP ${loaded.totals.total.toLocaleString('es-CL')}`
  );

  console.log('\n✅ Complete!\n');
}

main().catch(console.error);
```

Run it:
```bash
node examples/create-quotation.js
```

---

## Common Workflows

### Workflow 1: Browse → Create → Save

```javascript
const service = new QuotationService();

// Start
const actor = service.startNew('CLI_CORP', 25);

// Add items
service.addItem('ITEM_CHINOOK');
service.addItem('ITEM_COFFEE_BASIC');

// Save
const result = service.validateAndSave();
const quotationId = result.context.quotation.cotizacion.ID_Cotizacion;
console.log(`Saved: ${quotationId}`);
```

### Workflow 2: Add Items with Overrides

```javascript
service.startNew('CLI_WEDDING', 80);

// Add salon with extended duration (600 minutes = 10 hours)
service.addItem('ITEM_CHINOOK', {
  Override_Duracion_Min: 600,  // Override 4h default to 10h
});

// Add coffee with custom pax count
service.addItem('ITEM_COFFEE_BASIC', {
  Override_Pax: 100,  // Different from global pax
});

service.validateAndSave();
```

### Workflow 3: Modify and Recalculate

```javascript
const service = new QuotationService();
service.startNew('CLI_CORP', 25);

service.addItem('ITEM_CHINOOK');
const snap1 = service.getSnapshot();
const price1 = snap1.context.totals.total;

// Update the salon item with higher pax
const lineId = snap1.context.lineas[0].ID_Linea;
service.updateItem(lineId, { Override_Pax: 50 });

const snap2 = service.getSnapshot();
const price2 = snap2.context.totals.total;

console.log(`Price changed: ${price1} → ${price2}`);
```

### Workflow 4: Remove Items

```javascript
const service = new QuotationService();
service.startNew('CLI_CORP', 25);

service.addItem('ITEM_CHINOOK');
service.addItem('ITEM_COFFEE_BASIC');
service.addItem('ITEM_ALMUERZO');

const snap1 = service.getSnapshot();
console.log(`Items: ${snap1.context.lineas.length}`);  // 3

// Remove middle item (soft delete)
const lineId = snap1.context.lineas[1].ID_Linea;
service.removeItem(lineId);

const snap2 = service.getSnapshot();
console.log(`Active items: ${snap2.context.lineas.filter(l => !l._removed).length}`);  // 2
console.log(`Total items (including removed): ${snap2.context.lineas.length}`);  // 3
```

---

## Inspecting Saved Quotations

### List all quotations

```javascript
const service = new QuotationService();
const quotations = service.listSavedQuotations();
console.log(quotations);
// Output: ['COT_1739891234567', 'COT_1739891234890', ...]
```

### Load a quotation

```javascript
const data = service.loadFromFile('COT_1739891234567');
console.log(data);
// {
//   cotizacion: { ID_Cotizacion, ID_Cliente, Pax_Global, ... },
//   lineas: [ { ID_Linea, ID_Item, _netoBase, ... }, ... ],
//   totals: { subtotal, taxes, total },
//   ajustesManuales: []
// }
```

### View quotation files

Saved quotations are JSON files in `data/quotations/`:

```bash
ls -la data/quotations/
# COT_1739891234567.json
# COT_1739891234890.json

cat data/quotations/COT_1739891234567.json
# Pretty-printed JSON with full quotation data
```

---

## Troubleshooting

### "No active quotation"

```javascript
const service = new QuotationService();
service.addItem('ITEM_CHINOOK');  // ❌ Error!
```

**Fix:** Start a quotation first:
```javascript
service.startNew('CLI_CORP', 25);
service.addItem('ITEM_CHINOOK');  // ✓ Works
```

### Item not found

```javascript
service.addItem('ITEM_NONEXISTENT');  // Item exists in seeded store?
```

**Available items:**
- `ITEM_CHINOOK` - Salón Chinook
- `ITEM_COFFEE_BASIC` - Café Básico
- `ITEM_ALMUERZO` - Almuerzo Básico
- `PACK_COFFEE_COMPLETO` - Pack Café Completo (composition)

### Quotation state unexpected

Use `service.inspect()` to debug:

```javascript
const inspection = service.inspect();
console.log('State:', inspection.state);
console.log('Errors:', inspection.errors);
console.log('Messages:', inspection.messages);
```

### File permission errors

Ensure `data/quotations/` directory is writable:

```bash
mkdir -p data/quotations
chmod 755 data/quotations
```

---

## Next Steps

Once comfortable with the basic flow:

1. **Add more items to seeded store** - Edit `tests/helpers/store_factory.js`
2. **Add business rules** - Edit REGLAS_NEGOCIO in seeded store
3. **Create REST API** - Wrap this service in Express endpoints
4. **Build UI** - Use this service as backend for React/Vue components

---

## API Reference

### QuotationService

```javascript
// Lifecycle
startNew(clienteId, paxGlobal, opts)     // Start quotation
addItem(itemId, overrides)               // Add item
updateItem(lineId, overrides)            // Update item
removeItem(lineId)                       // Remove item (soft delete)
validateAndSave()                        // Validate & save to file
cancel()                                 // Discard current quotation

// Inspection
getSnapshot()                            // Get XState snapshot
inspect()                                // Get human-readable state
loadFromFile(cotizacionId)               // Load saved quotation
listSavedQuotations()                    // List all quotations
```

---

**Ready to create quotations!** 🚀
