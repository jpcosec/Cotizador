# Technical Design Document: Modular Architecture v2 (SF Lodge)

**Version:** 2.0
**Status:** Design Proposal
**Objective:** Migrate the current system to a Repository-based architecture with In-Memory Cache and Schema-Generated UI to maximize speed, testability, and code reusability.

> Note: this is a v2 architecture document. Current field/schema source of truth is `src/Config/Config_Schema.js`.

## 1. Architecture Overview

The system will stop interacting directly with the spreadsheet from Controllers. An intermediate abstraction layer (Repositories) is introduced to manage data intelligently.

### Architecture Layer Diagram

```
Frontend / UI
    ↕
API Controllers
    ↕
Services (Business Logic)
    ↕
Repositories (Data Abstraction)
    ↕
SheetDB v2 (Low-Level Driver)
    ↕
Google Sheets
```

### Key Concepts

**Master Data vs. Transactional Data:**

- **Master Data (Static):** Clients, Items, Pricing Rules, Constraints. Read frequently, written rarely. Strategy: Read all at startup, cache in memory, process quickly.
- **Transactional Data (Dynamic):** Quotations, History. Created and modified constantly. Strategy: On-demand reading, optimized writing (append).

**Schema-Driven Development:**

The data structure (fields, types, validations) is defined in a configuration file (Schemas.js). Both backend validation and frontend form generation read these schemas. Change the schema, and the entire system changes automatically.

---

## 2. Code Structure (File System)

Files are organized by responsibility, not by file type, to support modular work ("Workspaces").

```
/src
  /Core                          # The "Framework" (Reusable, agnostic code)
    Core_SheetDB.js              # Low-level driver
    Core_Repository.js           # Base class for data handling and cache
    Core_Utils.js                # Global helpers (dates, IDs)

  /Config                        # Global Configurations
    Config_DB.js                 # Sheet IDs and table names
    Config_Schemas.js            # JSON definition of models (Client, Item, etc.)

  /Modules                       # Business Modules (Where the magic happens)
    /Pricing
      Repo_Pricing.js            # Inherits from Repository
      Srv_Pricing.js             # Mathematical calculation engine
    /Constraints
      Repo_Constraint.js
      Srv_Constraint.js          # Rule validator
    /Quotations
      Repo_Quote.js              # Quotation handling
      Srv_Quote.js               # Process orchestrator
    /MasterData
      Repo_Client.js
      Repo_Item.js

  /API                           # Entry points (What HTML calls)
    Controller_Main.js
    Controller_Forms.js          # Generic form generator
```

---

## 3. Detailed Component Design

### A. The Driver: Core_SheetDB.js

A "dumb" class. Its only job is converting Spreadsheet data (2D arrays) to JSON objects and vice versa.

**Responsibility:** Read ranges, write rows, delete rows.

**v2 Improvement:** Will implement getDataRange().getValues() once for bulk reads.

### B. The Foundation: Core_Repository.js

The parent class from which all data managers inherit.

```javascript
class Repository {
  constructor(tableName, isMasterData = false) {
    this.db = new SheetDB(tableName);
    this.isMasterData = isMasterData;
    this.cache = null; // In-memory store
  }

  // If Master Data, read once and save in memory.
  // If not, always read from sheet.
  getAll() {
    if (this.isMasterData && this.cache) return this.cache;
    const data = this.db.readAll();
    if (this.isMasterData) this.cache = data;
    return data;
  }

  findById(id) {
    // Search in memory if possible, super fast
    return this.getAll().find(item => item.id === id);
  }
}
```

### C. The Modules (Inheritance and Specialization)

#### 1. Pricing Module (Repo_Pricing)

- Inherits from Repository
- Data: Loads PRICING_RULES table
- Special Method: `calculatePrice(item, context)`
- Advantage: On instantiation, loads all rules in memory (1 Sheet call). Then calculating 50 items takes 0 additional seconds because everything runs in RAM.

#### 2. Constraints Module (Repo_Constraint)

- Inherits from Repository
- Data: Loads CONSTRAINTS table
- Special Method: `validate(quoteObj)`
- Logic: Iterates through rules in memory and verifies if quotation complies.

#### 3. Generic Forms Module

Uses Config_Schemas.js to avoid repeating HTML code.

**Example Schema (Config_Schemas.js):**

```javascript
const SCHEMA_CLIENTE = {
  fields: [
    { key: 'nombre', label: 'Company', type: 'text', required: true },
    { key: 'rut', label: 'RUT', type: 'text', validation: 'rut_chile' },
    { key: 'tipo', label: 'Type', type: 'select', options: ['Company', 'Individual'] }
  ]
};
```

**Flow:**

1. Frontend requests `getFormStructure('CLIENTE')`
2. Backend returns schema JSON
3. Frontend (Vue/Alpine) automatically draws inputs (`v-for field in fields`)

---

## 4. Testing Strategy (Workspaces)

Thanks to this architecture, you can test each module in isolation without needing the full UI.

**Example: Pricing Workspace (Tests_Pricing.js)**

```javascript
function test_PricingEngine() {
  // 1. Mock or instantiate the Repository
  const pricingRepo = new Repo_Pricing();

  // 2. Define test context
  const testContext = { pax: 100, dias: 3 };
  const testItem = { precioBase: 5000, regla: 'POR_PAX' };

  // 3. Execute (Without touching spreadsheet if using mock data)
  const result = pricingRepo.calculate(testItem, testContext);

  // 4. Verify
  console.log(result === 500000 ? "✅ Test Passed" : "❌ Test Failed");
}
```

---

## 5. Advantages of this Architecture

| Benefit | Description |
|---------|-------------|
| **Extreme Performance** | Treating Clients, Items, and Rules as cached "Master Data" reduces Google Sheets API calls by 90% |
| **Maintainability** | Add a "Address" field to Client? Just add it to Config_Schemas.js and Excel column. No HTML or Controller changes needed |
| **Mental Clarity** | Know exactly where to look for bugs. Calculation fails? → Srv_Pricing.js. Data won't save? → Core_SheetDB.js |
| **Scalability** | Tomorrow migrate from Sheets to Firebase or SQL? Just rewrite Core_SheetDB.js. Rest of system continues working |

---

## 6. Implementation Roadmap (Next Steps)

- [ ] **Core:** Create Core_SheetDB and Core_Repository
- [ ] **Config:** Define Config_Schemas for Clients and Items
- [ ] **Master Data:** Implement Repo_Client and Repo_Item and test reading
- [ ] **Logic:** Implement Repo_Pricing and connect calculation logic
- [ ] **UI:** Refactor Client form to use schema generator
