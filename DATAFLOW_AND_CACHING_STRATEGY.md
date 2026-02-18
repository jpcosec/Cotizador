# Data Flow & Caching Strategy

**Version:** 1.0
**Date:** 2026-02-18
**Context:** Revised architecture to make pricing truly pure and optimize performance

---

## Problem with Current Design

**Current (Before Revision):**
```
┌─────────────────────────────────────┐
│ XState Orchestrator                 │
│ ├─ Create QuotationPipeline         │
│ └─ Call pipeline.calculateFull()    │
└────────────────┬────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│ QuotationPipeline (has store dependency) │
│ ├─ Load catalog from store              │
│ ├─ Load rules from store                │
│ ├─ Calculate (6 stages)                 │
│ └─ Return results                       │
└──────────────────────────────────────────┘
```

**Issues:**
1. Pricing depends on store (not pure)
2. Store data loaded on every calculation (inefficient)
3. No caching across item additions
4. Hard to mock store for pricing tests (needs abstraction)

---

## Proposed Solution: Orchestrator-Driven Data Flow

Move **all** database interaction to XState. Make Pricing **100% pure**.

```
┌──────────────────────────────────────────────────────────┐
│ XState Orchestrator (Owner of State + Data Loading)      │
│                                                          │
│ 1. Initialize:                                           │
│    ├─ Load: catalog (CATEGORIAS, ITEM_CATALOGO, etc)    │
│    ├─ Load: rules (REGLAS_NEGOCIO)                       │
│    ├─ Load: profiles (PERFILES_PRECIO)                   │
│    └─ CACHE in context.dataCache                        │
│                                                          │
│ 2. On ADD_ITEM event:                                    │
│    ├─ Persist line to database                          │
│    ├─ Call pricing.calculateFull(                        │
│    │    lineas,          // from context                 │
│    │    catalog,         // from context.dataCache       │
│    │    rules,           // from context.dataCache       │
│    │    profiles         // from context.dataCache       │
│    │  )                                                  │
│    └─ Cache result in context.totals                    │
│                                                          │
│ 3. On ADVANCE_TO_VALIDATION:                             │
│    ├─ Check if cache valid (no schema changes)          │
│    ├─ OR recalculate if needed                          │
│    └─ Store snapshot in database (CACHE_COTIZACION)     │
└──────────────────────────────────────────────────────────┘
        ↓ PURE DATA, NO SIDE EFFECTS ↓
┌──────────────────────────────────────────────────────────┐
│ Pricing Pipeline (100% Pure Functions)                   │
│                                                          │
│ Input Parameters (NO store):                             │
│  ├─ lineas: Array<LineItem>                             │
│  ├─ catalog: { items, categories, profiles }            │
│  ├─ rules: Array<Rule>                                  │
│  └─ Optional: cache_hint (for optimization)             │
│                                                          │
│ Calculation (6 Pure Stages):                             │
│  ├─ Stage 1: CANTIDAD_DEFAULT                           │
│  ├─ Stage 2: RESTRICCION_UI                             │
│  ├─ Stage 3: PRECIO_BASE                                │
│  ├─ Stage 4: AJUSTE_LINEA                               │
│  ├─ Stage 5: AJUSTE_GLOBAL                              │
│  └─ Stage 6: IMPUESTO                                   │
│                                                          │
│ Output:                                                 │
│  └─ {                                                    │
│      success,                                            │
│      lineas: [{ id, item, qty, price, rules_applied }], │
│      totals: { neto, iva, total },                       │
│      warnings,                                           │
│      errors                                              │
│    }                                                     │
└──────────────────────────────────────────────────────────┘
        ↓ RESULTS CACHED ↓
┌──────────────────────────────────────────────────────────┐
│ Context (State Machine Context)                         │
│                                                          │
│ context = {                                              │
│   quotation: { ID, cliente, estado },                   │
│   lineas: [ ... ],                                       │
│   dataCache: {                                           │
│     catalog: { ... },          // Loaded once at init   │
│     rules: [ ... ],             // Loaded once at init   │
│     loadedAt: timestamp,        // Track cache age      │
│     version: schema_version     // Detect schema changes │
│   },                                                     │
│   calculatedResults: {          // Cache pricing output  │
│     lineas: [ ... ],                                     │
│     totals: { ... },                                     │
│     calculatedAt: timestamp,                             │
│     validFor: [ item_ids ]      // Invalidate on change  │
│   },                                                     │
│   errors: [ ... ],                                       │
│   warnings: [ ... ]                                      │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
```

---

## Detailed Data Flow: Step by Step

### Step 0: Initialization (Browser Load)

```
User opens app
  ↓
Alpine.js instantiates
  ↓
XState machine starts (INITIALIZE event)
  ↓
XState action: initializeApp()
  ├─ Load from database:
  │  ├─ database.CATEGORIAS.all()
  │  ├─ database.ITEM_CATALOGO.all()
  │  ├─ database.PERFILES_PRECIO.all()
  │  ├─ database.COMPOSICION_KIT.all()
  │  └─ database.REGLAS_NEGOCIO.all()
  │
  └─ Store in context.dataCache:
     {
       catalog: {
         items: [ ... ],
         categories: [ ... ],
         profiles: [ ... ],
         compositions: [ ... ]
       },
       rules: [ ... ],
       loadedAt: Date.now(),
       version: 1
     }
  ↓
State machine ready (basket state)
```

**Performance:** Single database load at startup. No repeated queries.

---

### Step 1: User Adds Item (ADD_ITEM Event)

```
Frontend: Click "Add Chinook Salon"
  ↓
Bridge: send('ADD_ITEM', { itemId: 'CHINOOK', dia: 1 })
  ↓
XState: on['ADD_ITEM'] → addItemToBasket action
  ├─ Persist to database:
  │  └─ database.LINEA_DETALLE.insert({
  │      ID_Cotizacion: 'COT-0001',
  │      ID_Item: 'CHINOOK',
  │      Dia_Numero: 1,
  │      ...
  │    })
  │
  ├─ Update context.lineas (add new line)
  │
  ├─ Call calculateFull() action
  │  └─ pricing.calculateFull(
  │      lineas: context.lineas,        // ← Already in context
  │      catalog: context.dataCache.catalog,  // ← Cached
  │      rules: context.dataCache.rules,      // ← Cached
  │      profiles: context.dataCache.profiles // ← Cached
  │    )
  │
  └─ Cache result in context.calculatedResults:
     {
       lineas: [ calculated line data ],
       totals: { subtotal, iva, total },
       calculatedAt: Date.now(),
       validFor: ['CHINOOK'] // ← Track which items this is valid for
     }
  ↓
Bridge: subscribe fires with new snapshot
  ↓
Alpine reactivity updates UI with new totals
```

**Performance:** One database write. Calculation uses cached data. Result cached in state.

---

### Step 2: User Adds Another Item

```
User clicks "Add Dinner Buffet"
  ↓
Same flow as Step 1:
  ├─ Persist line to database
  ├─ Call pricing.calculateFull() with:
  │  └─ lineas: [CHINOOK, DINNER]  (now 2 items)
  │  └─ catalog, rules, profiles (SAME as before, from cache)
  │
  └─ Update context.calculatedResults
     {
       lineas: [ CHINOOK calculated, DINNER calculated ],
       totals: { recalculated },
       validFor: ['CHINOOK', 'DINNER']
     }
  ↓
UI updates with new subtotals
```

**Performance:** No catalog/rules re-fetch. Only recalculate prices. Instant.

---

### Step 3: User Changes Schema (Edit Database Panel)

```
User opens database admin panel
  ├─ Edits rule directly in REGLAS_NEGOCIO sheet
  ├─ Closes panel
  │
  └─ CLOSE_DB_PANEL event fires
     ├─ Invalidate cache:
     │  └─ context.dataCache.version += 1
     │
     ├─ Reload affected data:
     │  └─ database.REGLAS_NEGOCIO.all()
     │
     ├─ Update context.dataCache.rules
     │
     └─ Recalculate:
        └─ pricing.calculateFull() with new rules
           (same lineas, but different rules)
```

**Performance:** Only reload changed table. Recalculate.

---

### Step 4: User Advances to Validation

```
User clicks "Review & Validate"
  ↓
XState: on['ADVANCE_TO_VALIDATION'] → advanceToValidation action
  ├─ Check: Is cache still valid?
  │  └─ context.dataCache.version === last_known_version?
  │
  ├─ If valid: use context.calculatedResults directly
  │ If invalid: recalculate (schema changed)
  │
  ├─ Persist snapshot to database:
  │  └─ database.CACHE_COTIZACION.insert({
  │      ID_Cotizacion: 'COT-0001',
  │      Snapshot_JSON: context.calculatedResults
  │    })
  │
  └─ Update state to 'validation'
```

**Performance:** Snapshot from cache. One database write.

---

### Step 5: User Saves

```
User clicks "Save Quotation"
  ↓
XState: on['VALIDATE_AND_SAVE'] → validateAndSave action
  ├─ Final validation (already did in Step 4)
  │
  ├─ Update COTIZACIONES:
  │  └─ database.Cotizacion.update({
  │      ID_Cotizacion: 'COT-0001',
  │      Estado: 'Guardada',
  │      Updated_At: timestamp
  │    })
  │
  ├─ Log to HISTORIAL_COTIZACION:
  │  └─ database.HISTORIAL_COTIZACION.insert({
  │      ID_Cotizacion: 'COT-0001',
  │      Accion: 'QUOTATION_SAVED',
  │      ...
  │    })
  │
  └─ Transition to 'completed' state
```

---

## Caching Strategy

### What to Cache

```javascript
context = {
  // ✅ Cache (loaded once)
  dataCache: {
    catalog: {
      items: [ ... ],        // ITEM_CATALOGO
      categories: [ ... ],   // CATEGORIAS
      profiles: [ ... ],     // PERFILES_PRECIO
      compositions: [ ... ]  // COMPOSICION_KIT
    },
    rules: [ ... ],          // REGLAS_NEGOCIO
    loadedAt: timestamp,
    version: schema_version
  },

  // ✅ Cache (updated after calculation)
  calculatedResults: {
    lineas: [ ... ],         // With prices
    totals: { ... },
    calculatedAt: timestamp,
    validFor: ['CHINOOK', 'DINNER']  // Items included
  },

  // ❌ Don't cache (changes per line)
  lineas: [ ... ],           // Input lines (not calculated)

  // ❌ Don't cache (transient)
  errors: [ ... ],
  warnings: [ ... ]
}
```

### Cache Invalidation

**When to invalidate `dataCache`:**
1. Schema version changes (user edits REGLAS_NEGOCIO)
2. Manual refresh requested
3. Session timeout (reload from database)

**When to invalidate `calculatedResults`:**
1. Any line item added/removed/updated
2. Any line field changed (qty, pax, duration)
3. Manual refresh requested

**Implementation:**

```javascript
// In XState actions

// Invalidate calculated cache only
context.calculatedResults = null;

// Invalidate both caches (schema changed)
context.dataCache.version += 1;
context.calculatedResults = null;

// Reload data from database
const newRules = await database.REGLAS_NEGOCIO.all();
context.dataCache.rules = newRules;
context.calculatedResults = null; // Force recalculate

// Recalculate with current cache
if (!context.calculatedResults) {
  context.calculatedResults = await pricing.calculateFull(
    context.lineas,
    context.dataCache.catalog,
    context.dataCache.rules
  );
}
```

---

## Testing Implications

### Pricing Tests (100% Pure Now)

```javascript
// tests/pricing/full-flow.test.js

describe('Pricing Pipeline (Pure Functions)', () => {
  it('calculates prices with provided data', async () => {
    // No store needed!
    const result = await pricing.calculateFull(
      // Input data (no store dependency)
      lineas: [
        { ID_Item: 'CHINOOK', Dia: 1, Pax: 50 }
      ],
      catalog: {
        items: [ /* mock items */ ],
        categories: [ /* mock categories */ ],
        profiles: [ /* mock profiles */ ]
      },
      rules: [ /* mock rules */ ]
    );

    // Verify pure calculation
    expect(result.totals.total).toBe(expectedValue);
  });

  it('is deterministic (same input = same output)', async () => {
    const result1 = await pricing.calculateFull(...);
    const result2 = await pricing.calculateFull(...);
    expect(result1).toEqual(result2);
  });
});
```

**Benefits:**
- No store mocking needed
- Tests run instantly
- Pure functions are guaranteed deterministic
- Easy to test edge cases

---

### XState Tests (Data Loading + Caching)

```javascript
// tests/xstate/data-flow.test.js

describe('XState Orchestrator (Data Loading & Caching)', () => {
  it('loads catalog once at initialization', async () => {
    const store = new MockInMemoryStore();
    const actor = createTestActor(store);

    actor.send({ type: 'INITIALIZE' });

    // Verify data cached
    expect(actor.getSnapshot().context.dataCache.catalog).toBeDefined();
    expect(actor.getSnapshot().context.dataCache.loadedAt).toBeDefined();
  });

  it('reuses cached data for multiple calculations', async () => {
    const actor = createTestActor(store);
    actor.send({ type: 'INITIALIZE' });

    const loadedAtBeforeAdd = actor.getSnapshot().context.dataCache.loadedAt;

    // Add item (should use cached catalog/rules)
    actor.send({ type: 'ADD_ITEM', itemId: 'CHINOOK' });

    const loadedAtAfterAdd = actor.getSnapshot().context.dataCache.loadedAt;

    // Cache timestamp unchanged (no reload)
    expect(loadedAtAfterAdd).toBe(loadedAtBeforeAdd);
  });

  it('invalidates cache on database close', async () => {
    const actor = createTestActor(store);
    actor.send({ type: 'INITIALIZE' });

    const versionBefore = actor.getSnapshot().context.dataCache.version;

    // User edits database and closes panel
    actor.send({ type: 'CLOSE_DB_PANEL' });

    const versionAfter = actor.getSnapshot().context.dataCache.version;

    // Version incremented (cache invalidated)
    expect(versionAfter).toBe(versionBefore + 1);
  });
});
```

---

## Performance Analysis

### Before Revision

```
Scenario: Add 5 items one by one

Database calls:
├─ Init: Load catalog (1), rules (1) = 2 calls
├─ Add item 1: persist + calculate = 1 + 3 DB reads in pipeline = 4 calls
├─ Add item 2: persist + calculate = 1 + 3 DB reads in pipeline = 4 calls
├─ Add item 3: persist + calculate = 1 + 3 DB reads in pipeline = 4 calls
├─ Add item 4: persist + calculate = 1 + 3 DB reads in pipeline = 4 calls
└─ Add item 5: persist + calculate = 1 + 3 DB reads in pipeline = 4 calls

TOTAL: 2 + 5×4 = 22 database calls
TIME: Each calculate() reloads catalog/rules (I/O overhead)
```

### After Revision

```
Scenario: Add 5 items one by one

Database calls:
├─ Init: Load catalog (1), rules (1), compositions (1), profiles (1) = 4 calls
├─ Add item 1: persist + calculate (0 DB reads) = 1 call
├─ Add item 2: persist + calculate (0 DB reads) = 1 call
├─ Add item 3: persist + calculate (0 DB reads) = 1 call
├─ Add item 4: persist + calculate (0 DB reads) = 1 call
└─ Add item 5: persist + calculate (0 DB reads) = 1 call

TOTAL: 4 + 5×1 = 9 database calls (59% reduction!)
TIME: Calculations use RAM cache (instant)
```

### Cache Invalidation Cost

```
Scenario: User edits 1 rule, then adds 1 more item

Database calls:
├─ Close DB panel: Reload rules (1) = 1 call
├─ Recalculate with new rules (0 DB reads) = 0 calls
├─ Add item: Persist (1) + calculate (0 DB reads) = 1 call

TOTAL: 2 database calls
TIME: Smart invalidation (only reload changed table)
```

---

## Summary: New Data Flow Advantages

| Aspect | Before | After |
|--------|--------|-------|
| **Pricing Purity** | Has store dependency | 100% pure ✅ |
| **Database Calls** | 22 for 5 items | 9 for 5 items (-59%) ✅ |
| **Caching Strategy** | None | Context-based (smart) ✅ |
| **Schema Changes** | Full reload needed | Selective reload ✅ |
| **Testing** | Mock store required | No mocks needed (pure) ✅ |
| **State Management** | Scattered | Centralized in context ✅ |
| **Performance** | Slow on large datasets | Fast (cached) ✅ |

---

## Implementation Notes

### For Phase 1 (Database Worktree)

No changes needed - IStore interface stays the same. The orchestrator will use it.

### For Phase 2 (AlpineXStateBridge)

No changes - bridge just syncs state.

### For Phase 3 (Pricing Integration)

**Change:** Remove store from QuotationPipeline constructor.

**Before:**
```javascript
const pipeline = new QuotationPipeline(store, rulesEngine);
const result = await pipeline.calculateFull(cotizacionId);
```

**After:**
```javascript
const pipeline = new QuotationPipeline();  // No store!
const result = await pipeline.calculateFull(
  lineas,
  catalog,
  rules
);
```

### For Phase 4 (XState Orchestration)

**New responsibility:** Load and cache all data in context at initialization.

**In `initializeEmptyBasket` action:**
```javascript
async initializeEmptyBasket(context, event) {
  // Load all reference data ONCE
  context.dataCache = {
    catalog: {
      items: await database.ITEM_CATALOGO.all(),
      categories: await database.CATEGORIAS.all(),
      profiles: await database.PERFILES_PRECIO.all(),
      compositions: await database.COMPOSICION_KIT.all()
    },
    rules: await database.REGLAS_NEGOCIO.all(),
    loadedAt: Date.now(),
    version: 1
  };

  // Create quotation
  context.quotation = await Cotizacion.insert({...});
  context.lineas = [];
}
```

---

**This architecture is cleaner, faster, and more testable.** Ready to update Phase 3-4 designs?
