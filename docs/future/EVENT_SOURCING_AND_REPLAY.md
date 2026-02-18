# Event Sourcing & Replay System for Quotation Machine

**Status:** Design Document (Implementation Pending)
**Purpose:** Enable complete auditability, reproducibility, and testability of quotation state evolution
**Priority:** High (critical for future compliance, debugging, and testing)

---

## Table of Contents

1. [Overview](#overview)
2. [Why Event Sourcing](#why-event-sourcing)
3. [Core Concepts](#core-concepts)
4. [Architecture](#architecture)
5. [Event Log Structure](#event-log-structure)
6. [Determinism Requirements](#determinism-requirements)
7. [Storage Strategy](#storage-strategy)
8. [Replay Implementation](#replay-implementation)
9. [Anti-Patterns & What NOT to Do](#anti-patterns--what-not-to-do)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Checklist](#implementation-checklist)

---

## Overview

Event sourcing is an architectural pattern where every state change in the quotation system is captured as an immutable event. Instead of storing only the current state, we store the **sequence of events** that led to that state. This enables:

- **Full auditability**: "How did this quotation change?"
- **Reproducibility**: "Recreate this exact quotation state for testing"
- **Time-travel debugging**: "What was the state at time T?"
- **Compliance**: "Prove what happened and when"
- **Undo/Redo**: Natural event-based undo capability
- **Better testing**: Deterministic replays of complex scenarios

---

## Why Event Sourcing

### Current State (Before)
```
quotation: { state-at-now }
lineas: [items-at-now]
totals: { totals-at-now }

↓ Problem: Lost history
- Can't answer "how did we get here?"
- Can't reproduce bugs deterministically
- Hard to test complex sequences
```

### With Event Sourcing (After)
```
Event 1: ADD_ITEM { itemId: 'IT_001', ... }
  → state becomes { quotation, lineas, totals, ... }

Event 2: UPDATE_ITEM { lineId: 'LIN_001', Override_Pax: 10 }
  → state mutates with new pricing

Event 3: REMOVE_ITEM { lineId: 'LIN_002' }
  → item marked as removed, totals recalculated

↓ Benefits: Full traceability
- Can replay to any point in time
- Can test "what if we changed pax at this step?"
- Deterministic bug reproduction
```

---

## Core Concepts

### Events vs State

| Aspect | Events | State |
|--------|--------|-------|
| **What** | Immutable facts of what happened | Current computed snapshot |
| **Mutability** | Never change once recorded | Changes with each event |
| **Storage** | Append-only log | Single current record |
| **Time Travel** | Can replay up to any point | Can't go back |
| **Truth** | Event log is the source of truth | Derived from events |

### Event Anatomy

```javascript
{
  // Identity & Sequencing
  eventId: 'EVT_COT_001_ADD_001',     // Unique within quotation
  quotationId: 'COT_001',               // Which quotation
  sequence: 1,                          // Order within quotation

  // Metadata
  timestamp: '2025-02-18T10:30:45.123Z',
  userId: 'user_123',                   // Who triggered it
  source: 'UI_BASKET',                  // Where it came from

  // Content
  eventType: 'ADD_ITEM',                // What happened
  payload: {                            // What changed
    itemId: 'IT_PASTA_001',
    overrides: { Override_Pax: 10 }
  },

  // Determinism snapshot
  storeVersion: 'CATALOG_2025_02_18',   // Store/catalog state version
  rulesVersion: 'RULES_2025_01_15',     // Rules version at event time

  // Result (for validation & replay)
  resultingContext: {                   // What state became after
    quotation: { ... },
    lineas: [ ... ],
    totals: { ... },
    messages: [ ... ],
    errors: [ ... ]
  },

  // Metadata for debugging
  metadata: {
    performanceMs: 45,                  // How long the action took
    calculationDetails: { ... }         // Internal calculation state
  }
}
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────┐
│          XState Quotation Machine                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ├─→ Event Logger (Middleware)
                     │   └─→ Records every action
                     │
                     ├─→ Context (Current State)
                     │   └─→ quotation, lineas, totals
                     │
                     └─→ Action Adapters
                         └─→ Call pricing pipeline
                             └─→ Trigger state updates

┌─────────────────────────────────────────────────────┐
│          Event Storage (Database)                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ QUOTATION_EVENTS table                       │   │
│  │ ├─ event_id (PK)                             │   │
│  │ ├─ quotation_id (FK)                         │   │
│  │ ├─ sequence                                  │   │
│  │ ├─ event_type                                │   │
│  │ ├─ payload (JSON)                            │   │
│  │ ├─ resulting_context (JSON)                  │   │
│  │ ├─ timestamp                                 │   │
│  │ ├─ created_at                                │   │
│  │ └─ metadata (JSON)                           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          Replay System                              │
│  ├─→ Load event log by quotationId                 │
│  ├─→ Reconstruct initial state                     │
│  ├─→ Replay events in sequence                     │
│  └─→ Return state at any point                     │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (ADD_ITEM)
  ↓
XState Event Handler
  ↓
Action Adapter (addItem)
  ↓
Call Pricing Pipeline
  ↓
Context Update (assign)
  ↓
[EVENT LOGGER MIDDLEWARE] ← Capture here
  ↓
Store Event to Database
  ↓
Return Event to UI
```

---

## Determinism Foundations: Clock & ID Abstraction

**CRITICAL BLOCKER:** Before implementing event sourcing, the codebase must be refactored to eliminate time-dependent and random behavior. This is non-negotiable — without this, replay will be impossible.

### Current Non-Determinism Issues

| Location | Issue | Impact |
|----------|-------|--------|
| `src/Orchestration/adapters/actions.js:61` | `initializeEmptyBasket` uses `Date.now()` | ID generation differs on each run |
| `src/Orchestration/adapters/actions.js:264` | `validateAndSave` uses `new Date().toISOString()` | Timestamp differs, breaks replay equality |
| `src/Pricing/operations/addItem.js` | ID generation may use time-based component | Composition expansion creates inconsistent IDs |

### Solution: Inject Clock & IdGenerator

Create abstract interfaces for time and ID generation, injected via machine context:

```javascript
// src/Config/Abstractions.js
export interface Clock {
  now(): string;        // Returns ISO 8601 timestamp
}

export interface IdGenerator {
  nextLineId(quotationId: string): string;
  nextEventId(quotationId: string): string;
  nextCompositionId(): string;
}

// Production implementations
export const productionClock = {
  now: () => new Date().toISOString(),
};

export const productionIdGenerator = {
  nextLineId: (quotId) => `LIN_${Date.now()}_${Math.random()}`,  // Current (bad)
  nextEventId: (quotId) => `EVT_${quotId}_${Date.now()}`,        // Current (bad)
  nextCompositionId: () => `COMP_${Date.now()}`,                 // Current (bad)
};

// Test implementations (deterministic)
export const testClock = {
  now: () => '2025-06-15T10:00:00.000Z',  // Fixed timestamp
};

export const deterministicIdGenerator = {
  _lineCounter: 0,
  _eventCounter: 0,
  _compCounter: 0,

  nextLineId: (quotId) => `LIN_${++this._lineCounter}`,
  nextEventId: (quotId) => `EVT_${quotId}_${++this._eventCounter}`,
  nextCompositionId: () => `COMP_${++this._compCounter}`,
};
```

### Changes Required

#### 1. Machine Context Extension

Add Clock & IdGenerator to context:

```javascript
// src/Orchestration/quotationMachineBlueprint.js
context: {
  // ... existing fields ...
  _clock: { now: () => new Date().toISOString() },         // Injected
  _idGenerator: null,  // Injected at runtime
}
```

#### 2. Action Adapter Refactoring

Replace all `Date.now()` and `nextId()` calls:

```javascript
// BEFORE (non-deterministic)
export const initActions = {
  initializeEmptyBasket: assign(({ event }) => ({
    quotation: {
      cotizacion: {
        ID_Cotizacion: cotizacionId || `COT_${Date.now()}`,  // ❌ Time-dependent
        ...
      },
      _lineSeq: 0,  // ❌ Sequential counter only, not unique
    },
  })),
};

// AFTER (deterministic)
export const initActions = {
  initializeEmptyBasket: assign(({ event, context }) => {
    const idGen = context._idGenerator;  // Injected
    const cotizacionId = event.cotizacionId || idGen.nextQuotationId();
    return {
      quotation: {
        cotizacion: {
          ID_Cotizacion: cotizacionId,
          ...
        },
        _lineSeq: 0,
      },
    };
  }),
};

// nextId() helper should use injected generator
function nextLineId(quotation, idGenerator) {
  return idGenerator.nextLineId(quotation.cotizacion.ID_Cotizacion);
}
```

#### 3. validateAndSave Action

```javascript
// BEFORE
validateAndSave: assign(({ context }) => {
  store.insert('CACHE_COTIZACION', {
    ...snapshot,
    Updated_At: new Date().toISOString(),  // ❌ Non-deterministic
  });
  return { quotation: { ...quotation, Estado: 'Guardada' } };
}),

// AFTER
validateAndSave: assign(({ context }) => {
  const { _clock } = context;  // Injected
  store.insert('CACHE_COTIZACION', {
    ...snapshot,
    Updated_At: _clock.now(),  // ✅ Deterministic (injected)
  });
  return { quotation: { ...quotation, Estado: 'Guardada' } };
}),
```

#### 4. Pricing Pipeline Integration

The pricing module's `addItem.js` and composition expansion also need Clock/IdGenerator injection:

```javascript
// src/Pricing/operations/addItem.js
export function addItem(event, context, store, clock, idGenerator) {
  // Pass to composition expansion
  const expanded = expandItemCompositions(
    baseLine,
    store,
    { clock, idGenerator }
  );

  // Each line gets ID from generator, not from Date.now()
  expanded.forEach(line => {
    line.ID_Linea = line.ID_Linea || idGenerator.nextLineId(context.quotationId);
  });

  return { lineas: expanded, messages, errors };
}
```

### Migration Strategy

**Phase 1: Infrastructure (Week 1)**
- [ ] Create `Abstractions.js` with Clock & IdGenerator interfaces
- [ ] Create `ProductionProvider.js` and `TestProvider.js`
- [ ] Add `_clock` and `_idGenerator` to machine context
- [ ] Update vitest config to inject test implementations

**Phase 2: Adapter Refactoring (Week 2)**
- [ ] Update all actions to use `context._clock` and `context._idGenerator`
- [ ] Remove all `Date.now()`, `Math.random()` from adapters
- [ ] Replace `nextId()` function with `context._idGenerator.nextLineId()`
- [ ] Add unit tests for each adapter with mock clock

**Phase 3: Pricing Module Integration (Week 2-3)**
- [ ] Update pricing operations to accept clock & idGenerator params
- [ ] Update pipeline functions for deterministic ID generation
- [ ] Add tests with seeded RNG for randomized scenarios (if any)

**Phase 4: Validation (Week 3)**
- [ ] Add determinism property tests: "Same inputs → Same outputs"
- [ ] Verify replay tests pass with clock injections
- [ ] Update documentation with injection patterns

### Testing Determinism

Once Clock & IdGenerator are injected, test like this:

```javascript
// tests/unit/adapters/determinism.test.js
describe('Determinism with Injected Clock & IdGenerator', () => {
  it('same event sequence produces identical state', () => {
    const clock = { now: () => '2025-06-15T10:00:00.000Z' };
    const idGen = createDeterministicIdGenerator();

    const run1 = executeWithInjections(events, { clock, idGen });
    const run2 = executeWithInjections(events, { clock, idGen });

    expect(run1.context).toEqual(run2.context);
    expect(run1.lineas.map(l => l.ID_Linea))
      .toEqual(run2.lineas.map(l => l.ID_Linea));
  });

  it('composition expansion produces deterministic IDs', () => {
    const idGen = createDeterministicIdGenerator();
    const expanded1 = expandItemCompositions(pack, store, { idGen });
    const expanded2 = expandItemCompositions(pack, store, { idGen });

    expect(expanded1.map(l => l.ID_Linea))
      .toEqual(expanded2.map(l => l.ID_Linea));
  });
});
```

### Why This Matters

Without this refactoring:
- ❌ Event replay produces different totals on each run
- ❌ Line IDs differ between replay runs
- ❌ Timestamps vary (can't guarantee event order)
- ❌ Property-based testing impossible

With Clock & IdGenerator injection:
- ✅ Replay is deterministic
- ✅ Event sourcing works correctly
- ✅ Property-based testing validates invariants
- ✅ Perfect reproducibility for debugging

---

## Event Log Structure

### Storage Schema (PostgreSQL)

```sql
CREATE TABLE quotation_events (
  event_id UUID PRIMARY KEY,
  quotation_id VARCHAR(50) NOT NULL,
  sequence INTEGER NOT NULL,

  event_type VARCHAR(50) NOT NULL,    -- ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM, etc
  payload JSONB NOT NULL,              -- The input data

  resulting_context JSONB NOT NULL,   -- Full context after event

  store_version VARCHAR(100),          -- Catalog/store version at time
  rules_version VARCHAR(100),          -- Rules version at time

  timestamp TIMESTAMPTZ NOT NULL,
  user_id VARCHAR(100),
  source VARCHAR(100),                 -- UI_BASKET, API, IMPORT, etc

  performance_ms INTEGER,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(quotation_id, sequence),      -- Enforce sequence integrity
  FOREIGN KEY (quotation_id) REFERENCES cotizaciones(ID_Cotizacion)
);

CREATE INDEX idx_quotation_events_quotation_id ON quotation_events(quotation_id);
CREATE INDEX idx_quotation_events_timestamp ON quotation_events(timestamp);
```

### Event Types & Payloads

```javascript
// BROWSE EVENTS
{
  eventType: 'VIEW_PREVIOUS_QUOTATIONS',
  payload: { filters: { /* ... */ } }
}

{
  eventType: 'START_NEW_QUOTATION',
  payload: { paxGlobal, clienteId, fechaEvento, duracionDias }
}

{
  eventType: 'LOAD_QUOTATION',
  payload: { cotizacionId }
}

// INITIALIZATION EVENTS
{
  eventType: 'QUOTATION_LOADED',
  payload: { quotation: { /* ... */ } }
}

{
  eventType: 'QUOTATION_INITIALIZED',
  payload: { paxGlobal, clienteId, /* ... */ }
}

// BASKET MUTATION EVENTS
{
  eventType: 'ADD_ITEM',
  payload: {
    itemId: 'IT_PASTA_001',
    overrides: { Override_Pax: 10, Override_Cantidad: 2 }
  }
}

{
  eventType: 'UPDATE_ITEM',
  payload: {
    lineId: 'LIN_001',
    overrides: { Override_Pax: 15 }
  }
}

{
  eventType: 'REMOVE_ITEM',
  payload: { lineId: 'LIN_002' }
}

// VALIDATION EVENTS
{
  eventType: 'ADVANCE_TO_VALIDATION',
  payload: { /* no payload, context-driven */ }
}

{
  eventType: 'VALIDATE_AND_SAVE',
  payload: { /* no payload */ }
}

// DATABASE EVENTS
{
  eventType: 'OPEN_DATABASE',
  payload: { /* no payload */ }
}

{
  eventType: 'CLOSE_DATABASE',
  payload: { /* no payload */ }
}

{
  eventType: 'SAVE_ROW',
  payload: { modifiedData: { /* ... */ } }
}
```

---

## Determinism Requirements

**CRITICAL:** For replay to work correctly, every action must be **deterministic**. Given the same inputs and store state, it must always produce the same output.

### Rules for Determinism

#### ✅ DO

- **Use pure functions**: All pricing calculations are already pure — they depend only on inputs
- **Version external dependencies**: Store version, rules version, catalog version
- **Capture store snapshot**: If store data affects calculation, include version
- **Store full payload**: Capture everything needed to replay
- **Deterministic ordering**: lineas array order must be reproducible
- **Use timestamps consistently**: Store UTC, use same timezone for all calculations

**Example (GOOD - Deterministic):**
```javascript
// Action: ADD_ITEM
// Given: same store version, same item data, same overrides
// Result: always same lineas, same totals, same messages

{
  eventType: 'ADD_ITEM',
  payload: { itemId: 'IT_001', overrides: { Override_Pax: 10 } },
  storeVersion: 'CATALOG_2025_02_18',  // ← Captured
  rulesVersion: 'RULES_2025_01_15',    // ← Captured
  resultingContext: { /* ... */ }
}
```

#### ❌ DON'T

- **Use `Date.now()` for business logic**: Timestamps are for audit, not for calculations
- **Depend on random values**: No `Math.random()` in pricing calculations
- **Depend on external APIs during action**: Rules/pricing must be pre-loaded
- **Store mutable references**: Always deep clone in context
- **Skip store version capture**: Store changes break determinism
- **Assume rule stability**: Rules can change; capture version at event time
- **Use floating point directly**: Accounting requires precise decimal arithmetic

**Example (BAD - Non-Deterministic):**
```javascript
// ❌ This breaks determinism:
{
  eventType: 'ADD_ITEM',
  payload: { itemId: 'IT_001', Override_Pax: 10 },
  // storeVersion: ??? — MISSING! Different catalog versions = different results
  // rulesVersion: ??? — MISSING! Different rules = different results
  resultingContext: { /* ... */ }
  // ← If replay uses different store/rules, result won't match
}

// ❌ This action depends on time:
function applyTimeBasedDiscount(linea) {
  if (new Date().getDay() === 1) {  // Monday discount
    linea.discount = 0.1;
  }
  // ← Replaying Monday event on Friday gives wrong result!
}

// ✅ Instead, pass discount info in payload:
{
  eventType: 'ADD_ITEM',
  payload: {
    itemId: 'IT_001',
    appliedPromotions: ['MONDAY_DISCOUNT']  // ← Captured at event time
  }
}
```

### Determinism Checklist

Before implementing an action:
- [ ] Does it call pricing pipeline functions? (Already deterministic)
- [ ] Does it depend on store/catalog data? (Capture version)
- [ ] Does it depend on rules? (Capture rules version)
- [ ] Does it use timestamps for business logic? (Store in payload, not calculation)
- [ ] Does it do any I/O or external calls? (Move to services, not actions)
- [ ] Does it use Math.random or similar? (Not allowed in actions)
- [ ] Are all inputs captured in payload? (Complete snapshot)
- [ ] Can I replay this deterministically? (Yes → good to ship)

---

## Storage Strategy

### Where to Store Events

#### Option 1: Same Database (RECOMMENDED)
**Pros:**
- Transactions with quotation state
- Single source of truth
- Easier consistency

**Cons:**
- Database bloat over time
- Requires archival strategy

**Implementation:**
```sql
-- New table for event log
CREATE TABLE quotation_events ( /* ... */ );

-- Modify quotations table
ALTER TABLE cotizaciones ADD COLUMN
  event_log_status VARCHAR(20) DEFAULT 'INCOMPLETE';
  -- INCOMPLETE, ARCHIVAL_PENDING, ARCHIVED
```

#### Option 2: Event Store Database (FUTURE)
Separate immutable event store (EventStoreDB, Postgres replica, etc.)

**When to consider:** If quotation volume exceeds storage limits

### Archival Strategy

As quotations age, compress and archive events:

```
Year 1: All events live in quotation_events table
Year 2+: Archive old events to compressed format
  - Keep last snapshot + important milestones
  - Compress full event log to JSONB
  - Move to quotation_events_archive
```

Example archive structure:
```javascript
{
  quotation_id: 'COT_001',
  archived_at: '2026-02-18T00:00:00Z',
  event_count: 25,

  // Keep first event (initialization)
  first_event: { eventType: 'QUOTATION_INITIALIZED', ... },

  // Keep all user-visible events
  milestones: [
    { sequence: 1, eventType: 'QUOTATION_INITIALIZED' },
    { sequence: 5, eventType: 'ADD_ITEM' },
    { sequence: 15, eventType: 'VALIDATE_AND_SAVE' }
  ],

  // Full compressed log (if needed for replay)
  full_log_compressed: 'gzipped JSON array',

  // Final state snapshot
  final_context: { quotation, lineas, totals }
}
```

---

## Replay Implementation

### Core Replay Function

```javascript
/**
 * Reconstruct quotation state at a specific point in event history.
 *
 * @param {string} quotationId - The quotation to reconstruct
 * @param {number|null} upToSequence - Replay up to this event (null = all)
 * @param {object} store - Store/catalog for determinism
 * @returns {Promise<object>} - Reconstructed context
 *
 * Determinism guaranteed if:
 * - store versions match original event store versions
 * - rules versions match original event store versions
 */
async function replayQuotation(quotationId, upToSequence = null, store) {
  // 1. Load all events for this quotation
  const events = await loadEventLog(quotationId);

  if (events.length === 0) {
    throw new Error(`No events found for quotation ${quotationId}`);
  }

  // 2. Start with initial state
  let context = getInitialContext();

  // 3. Replay each event in sequence
  for (const event of events) {
    // Stop if we've reached the target sequence
    if (upToSequence && event.sequence > upToSequence) {
      break;
    }

    // Validate store/rules versions match for determinism
    if (event.storeVersion && event.storeVersion !== store.version) {
      console.warn(
        `Store version mismatch: Event was recorded with ${event.storeVersion}, ` +
        `replaying with ${store.version}. Results may differ.`
      );
    }

    // Replay the event
    context = replayEvent(event, context, store);

    // Validate result matches recorded result (sanity check)
    if (!contextMatchesRecording(context, event.resultingContext)) {
      throw new Error(
        `Replay validation failed at sequence ${event.sequence}. ` +
        `Expected state doesn't match recorded state. ` +
        `This indicates non-deterministic behavior or store version mismatch.`
      );
    }
  }

  return context;
}

/**
 * Replay a single event.
 */
function replayEvent(event, context, store) {
  switch (event.eventType) {
    case 'QUOTATION_INITIALIZED':
      return replayQuotationInitialized(event, context);

    case 'ADD_ITEM':
      return replayAddItem(event, context, store);

    case 'UPDATE_ITEM':
      return replayUpdateItem(event, context, store);

    case 'REMOVE_ITEM':
      return replayRemoveItem(event, context, store);

    case 'VALIDATE_AND_SAVE':
      return replayValidateAndSave(event, context, store);

    default:
      throw new Error(`Unknown event type: ${event.eventType}`);
  }
}

/**
 * Validate that replayed state matches the recorded state.
 * Uses deep equality check, ignoring fields that may differ (timestamps, etc).
 */
function contextMatchesRecording(replayedContext, recordedContext) {
  const fieldsToCompare = [
    'quotation',      // Structure, not timestamps
    'lineas',         // Items and pricing
    'totals',         // Summary totals
    'messages',       // Pricing messages
    'errors'          // Error state
  ];

  for (const field of fieldsToCompare) {
    if (!deepEqual(replayedContext[field], recordedContext[field])) {
      return false;
    }
  }

  return true;
}
```

### Example: Replay ADD_ITEM

```javascript
function replayAddItem(event, context, store) {
  const { itemId, overrides } = event.payload;

  // Use exact pricing pipeline as original
  const baseLine = {
    ID_Linea: nextId(context.quotation),
    ID_Cotizacion: context.quotation.cotizacion.ID_Cotizacion,
    ID_Item: itemId,
    Override_Pax: overrides?.Override_Pax ?? null,
    Override_Cantidad: overrides?.Override_Cantidad ?? null,
    Override_Duracion_Min: overrides?.Override_Duracion_Min ?? null,
  };

  // Step 1-4: Exact same pipeline as original action
  const expanded = expandItemCompositions(baseLine, store);
  const newMessages = [];
  const newErrors = [];

  for (const linea of expanded) {
    resolveItemDefaults(linea, context.quotation.paxGlobal, store);
    recalculateItemPrice(linea, store);
    const ruleResult = applyItemRules(linea, store);
    if (ruleResult.errors.length > 0) {
      newErrors.push(...ruleResult.errors);
    }
  }

  const { totals, messages: globalMessages } = aggregateBasketTotals(
    [...context.lineas, ...expanded],
    context.quotation.ajustesManuales,
    store
  );

  // Return new context
  return {
    ...context,
    lineas: [...context.lineas, ...expanded],
    totals,
    messages: [...context.messages, ...globalMessages],
    errors: [...context.errors, ...newErrors],
  };
}
```

### Usage Examples

```javascript
// Replay entire quotation history
const finalState = await replayQuotation('COT_001', null, store);

// Replay up to sequence 5 (see state after 5th action)
const stateAfter5 = await replayQuotation('COT_001', 5, store);

// Find state at specific point for debugging
const stateWhenErrorOccurred = await replayQuotation('COT_001', 12, store);
```

---

## Anti-Patterns & What NOT to Do

### ❌ Anti-Pattern 1: Storing Derived State in Events

**BAD:**
```javascript
{
  eventType: 'ADD_ITEM',
  payload: { itemId: 'IT_001' },
  resultingContext: {
    lineas: [ ... ],
    totals: { subtotal: 1000, taxes: 200, total: 1200 }  // ← DERIVED!
  }
}

// Problem: Next replay might calculate 1200.01 due to rounding
// Then validation fails because it doesn't match recorded 1200
```

**GOOD:**
```javascript
{
  eventType: 'ADD_ITEM',
  payload: { itemId: 'IT_001', Override_Pax: 10 },
  resultingContext: {
    lineas: [ ... ],
    totals: { /* actual calculated values */ }
  }
}

// Replay recalculates totals from scratch, exact match guaranteed
```

### ❌ Anti-Pattern 2: Mixing Business Logic into Event Logger

**BAD:**
```javascript
// In event logger middleware:
const event = {
  eventType: 'ADD_ITEM',
  payload: action.payload,
  calculatedDiscount: applyDiscount(action.payload),  // ← BUSINESS LOGIC HERE!
};
```

**GOOD:**
```javascript
// In action adapter (where pricing pipeline lives):
function addItem(context, event) {
  // All pricing logic here
  const expanded = expandItemCompositions(baseLine, store);
  // ... apply all rules ...

  return { quotation, lineas, totals };
}

// Then event logger just captures the result
```

### ❌ Anti-Pattern 3: Forgetting to Version Dependencies

**BAD:**
```javascript
{
  eventType: 'ADD_ITEM',
  payload: { itemId: 'IT_001' },
  // No storeVersion, no rulesVersion
  resultingContext: { /* ... */ }
}

// 6 months later, catalog has 100 new items, rules changed
// Replay gives completely different result
```

**GOOD:**
```javascript
{
  eventType: 'ADD_ITEM',
  payload: { itemId: 'IT_001' },
  storeVersion: 'CATALOG_2025_02_18',        // ← Captured
  rulesVersion: 'RULES_2025_01_15',          // ← Captured
  resultingContext: { /* ... */ }
}

// Replay can verify versions match or warn about mismatch
```

### ❌ Anti-Pattern 4: Event Order Ambiguity

**BAD:**
```javascript
// Events stored without guaranteeing order
Event A: ADD_ITEM { itemId: 'IT_001' }
Event B: UPDATE_ITEM { lineId: 'LIN_001' }

// But which happened first? Unclear!
// Replay might process B then A, getting wrong result
```

**GOOD:**
```javascript
// Use sequence numbers + timestamps + database constraints
{
  sequence: 1,
  timestamp: '2025-02-18T10:30:00.000Z',
  eventType: 'ADD_ITEM',
  ...
}

{
  sequence: 2,
  timestamp: '2025-02-18T10:30:01.500Z',
  eventType: 'UPDATE_ITEM',
  ...
}

// UNIQUE(quotation_id, sequence) in database prevents duplicates
```

### ❌ Anti-Pattern 5: Replaying from Stale Store State

**BAD:**
```javascript
// Load events from 6 months ago
const events = await loadEventLog('COT_001');

// Replay with current store (catalog changed 5 times since)
const state = await replayQuotation('COT_001', null, currentStore);
// ← WRONG! Results don't match original
```

**GOOD:**
```javascript
// Option 1: Use versioned store snapshots
async function replayQuotation(quotationId, upToSequence, storeVersion) {
  const events = await loadEventLog(quotationId);
  const store = await loadStoreVersion(storeVersion);  // Historical version!
  return doReplay(events, upToSequence, store);
}

// Option 2: Warn about version mismatch
if (event.storeVersion !== store.version) {
  console.warn('Version mismatch - results may differ from original');
}

// Option 3: Store historical snapshots with events
{
  eventType: 'ADD_ITEM',
  storeSnapshot: {
    catalogVersion: 'CATALOG_2025_02_18',
    // Or full snapshot of relevant items
    items: { 'IT_001': { ... }, 'IT_002': { ... } }
  }
}
```

### ❌ Anti-Pattern 6: Mutating Original Context in Replay

**BAD:**
```javascript
function replayAddItem(event, context) {
  // ← Mutating context directly!
  context.lineas.push(newLine);
  context.totals = newTotals;
  return context;
}

// Problem: Original context is polluted
// Replaying twice gives different results
```

**GOOD:**
```javascript
function replayAddItem(event, context) {
  return {
    ...context,                    // ← Spread first
    lineas: [...context.lineas, newLine],  // ← New array
    totals: { ...newTotals }       // ← New object
  };
}

// Each replay starts fresh
```

---

## Testing Strategy

### Unit Tests: Event Replay

```javascript
describe('Event Replay', () => {
  describe('ADD_ITEM event', () => {
    it('should replay ADD_ITEM deterministically', async () => {
      const event = {
        eventType: 'ADD_ITEM',
        payload: { itemId: 'IT_001', overrides: { Override_Pax: 10 } },
        storeVersion: 'CATALOG_2025_02_18',
        rulesVersion: 'RULES_2025_01_15',
      };

      const store = loadFixtureStore('CATALOG_2025_02_18');
      const context1 = replayEvent(event, initialContext, store);
      const context2 = replayEvent(event, initialContext, store);

      // Same inputs → same outputs
      expect(context1).toEqual(context2);

      // Results match recorded result
      expect(context1).toEqual(event.resultingContext);
    });

    it('should warn when store version mismatches', async () => {
      const event = {
        eventType: 'ADD_ITEM',
        storeVersion: 'CATALOG_2025_02_18',
        ...
      };

      const differentStore = loadFixtureStore('CATALOG_2026_02_18');

      expect(() => {
        replayEvent(event, initialContext, differentStore);
      }).toLog.warning('Store version mismatch');
    });
  });

  describe('Full quotation replay', () => {
    it('should replay entire quotation history', async () => {
      const events = [
        { eventType: 'QUOTATION_INITIALIZED', ... },
        { eventType: 'ADD_ITEM', itemId: 'IT_001', ... },
        { eventType: 'UPDATE_ITEM', lineId: 'LIN_001', ... },
        { eventType: 'ADD_ITEM', itemId: 'IT_002', ... },
      ];

      const finalState = await replayQuotation('COT_001', null, store);

      // Should have 2 items
      expect(finalState.lineas.filter(l => !l._removed)).toHaveLength(2);

      // First item should have pax = 15 (from update)
      const firstItem = finalState.lineas[0];
      expect(firstItem.Override_Pax).toBe(15);
    });

    it('should replay up to specific sequence', async () => {
      const stateAfter2Events = await replayQuotation('COT_001', 2, store);

      // After 2 events (INIT + ADD_ITEM), should have 1 item
      expect(stateAfter2Events.lineas.length).toBe(1);
    });
  });

  describe('Replay validation', () => {
    it('should fail if replay doesnt match recorded state', async () => {
      // Scenario: Event was recorded with CATALOG_V1
      // But replay uses CATALOG_V2 (different prices)

      const oldEvent = await loadEventFromDB('EVT_001');
      const wrongStore = loadStore('CATALOG_V2');

      expect(async () => {
        await replayQuotation('COT_001', 1, wrongStore);
      }).rejects.toThrow('Replay validation failed');
    });
  });
});
```

### Integration Tests: Event Capture & Replay

```javascript
describe('Event Capture & Replay (E2E)', () => {
  it('should capture events and allow full replay', async () => {
    // 1. Perform actions on state machine
    const machine = createQuotationXStateMachine(adapters);

    await machine.send('START_NEW_QUOTATION', {
      paxGlobal: 100, clienteId: 'C_001'
    });

    await machine.send('ADD_ITEM', { itemId: 'IT_001' });
    await machine.send('ADD_ITEM', { itemId: 'IT_002' });
    await machine.send('UPDATE_ITEM', { lineId: 'LIN_001', Override_Pax: 150 });

    const originalState = machine.getSnapshot();

    // 2. Events should be captured in DB
    const events = await loadEventLog('COT_001');
    expect(events).toHaveLength(4);  // INIT + 3 actions

    // 3. Replay should reconstruct exact state
    const replayedState = await replayQuotation('COT_001', null, store);

    expect(replayedState.quotation).toEqual(originalState.quotation);
    expect(replayedState.lineas).toEqual(originalState.lineas);
    expect(replayedState.totals).toEqual(originalState.totals);
  });
});
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] Design event log database schema (QUOTATION_EVENTS table)
- [ ] Create event payload type definitions (TypeScript interfaces)
- [ ] Implement event logger middleware in XState machine
- [ ] Add store/rules version capture to all actions
- [ ] Create database migrations

### Phase 2: Replay System (Week 2-3)

- [ ] Implement `replayQuotation()` function
- [ ] Implement individual `replayEvent()` handlers
- [ ] Add determinism validation (context matching)
- [ ] Create replay utilities (time-travel, point-in-time recovery)
- [ ] Add version mismatch warnings

### Phase 3: Testing & Validation (Week 3-4)

- [ ] Write unit tests for each replay function
- [ ] Write integration tests (capture → replay)
- [ ] Add determinism verification tests
- [ ] Test version mismatch scenarios
- [ ] Load test with large event logs

### Phase 4: Tooling (Week 4-5)

- [ ] Create admin UI to view event logs
- [ ] Create replay debugging tool (inspect state at any sequence)
- [ ] Add audit trail visualization
- [ ] Implement event export (for support/debugging)

### Phase 5: Documentation & Archival (Week 5-6)

- [ ] Document replay API for developers
- [ ] Create runbook for debugging with replay
- [ ] Implement event archival strategy
- [ ] Set up monitoring for event log size

---

## Future Considerations

### Event Snapshots (Performance)
For quotations with 1000+ events, replay becomes slow. Consider:
- Every 100 events, save a snapshot
- Replay from latest snapshot instead of beginning
- Reduces replay time O(n) → O(n/100)

### Event Sourcing with CQRS
Command Query Responsibility Segregation:
- Commands: ADD_ITEM, UPDATE_ITEM (write events)
- Queries: GetQuotation, ListQuotations (read from snapshots)
- Separates write path (events) from read path (current state)

### Temporal Queries
"Show me all quotations that had price > 5000 at any point"
- Event timestamps enable historical queries
- Build time-indexed data structure
- Answer questions about past state efficiently

### Machine Learning / Analytics
- Event logs provide rich training data
- Analyze pricing patterns
- Predict common modifications
- Identify bottlenecks

---

## Related Documentation

- [`docs/quotation-pipeline-flow-v3.md`](../quotation-pipeline-flow-v3.md) - Pricing pipeline (must be deterministic)
- [`docs/xstate-machine-design.md`](../xstate-machine-design.md) - State machine design
- `src/Orchestration/adapters/` - Where actions are implemented

---

## Questions & Clarifications

**Q: Won't storing all events use a lot of database space?**
A: Yes, but quotations are not high-volume. Estimate: 1KB/event × 20 events/quotation × 1000 quotations/year = ~20MB/year. Archival at year boundary keeps it manageable.

**Q: What if rules change? Will old replays give wrong results?**
A: YES! This is why we capture `rulesVersion` with each event. When replaying, you must use the same rules version, or explicitly accept the mismatch and document it.

**Q: Do we need to replay on every state machine update?**
A: No. Replay is for:
- Debugging ("why did this quotation end up with this price?")
- Testing (reproducible scenarios)
- Audit/compliance (proving what happened)

Normal operations just use current state.

**Q: Can events be modified after creation?**
A: NO! Events are immutable. If you need to correct something, create a new event (e.g., MANUAL_ADJUSTMENT) that reverts and re-applies the correction.

---

**Last Updated:** 2025-02-18
**Author:** Architecture Team
**Status:** Design Phase (Ready for Implementation)
