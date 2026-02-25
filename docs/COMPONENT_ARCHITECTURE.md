# Component Architecture

## Overview

The rebuild uses a **hierarchical component pattern** where specialized Item-Containers compose to form a complete quotation system. Each component owns its state machine, manages children, evaluates rules, and aggregates pricing.

**Two base component types:**
1. **Item-Container** (abstract pattern for managing collections)
2. **Item** (leaf node - single quotable item)

**Specialized Item-Containers:**
- **Catalog** (read-only browsing, pricing profiles)
- **Basket** (editable cart with global context)
- **DayCategory** (items grouped by date)

---

## Base Pattern: Item-Container

**Purpose:** Reusable pattern for managing a collection of items or sub-containers with rule evaluation, context passing, and price aggregation.

### Core Responsibilities

#### 1. Child Management
- Own and manage child components (Items or sub-Containers)
- Add/remove/update children
- Maintain parent-child relationships
- Coordinate child lifecycle events

#### 2. Rule Evaluation & Display
- Evaluate own rules locally
- Pass rules down to children (inheritance)
- **Display assigned rules and their evaluation state** (observable, always readable)
- Rules are NOT hidden until enforcement — they're first-class citizens
- Each component exposes rules via `toDisplayObject()`
- Rules show: condition, action, payload, whether they matched, result

#### 3. Context Passing (Down)
- Receive context from parent (global pax, fecha, duracion_dias, hora, dia, etc.)
- Adapt context for children
- Pass down as needed (DayCategory passes day/time, Item receives pax+dia+hora+defaults)
- Children can observe parent context

#### 4. Price Aggregation (Up)
- Children report their totals up
- Container aggregates child prices
- Apply own rules/adjustments to aggregate
- Pass adjusted total up to parent
- Each level respects rule priorities

### State Machine

```
States:
  - uninitialized
  - initializing
  - idle
  - updating
  - recalculating
  - error

Events:
  - INITIALIZE (with context)
  - SET_CONTEXT (updated parent context)
  - ADD_CHILD
  - REMOVE_CHILD
  - UPDATE_CHILD
  - EVALUATE_RULES
  - [Container-specific events]

Context:
  - definition (container config, rules)
  - parentContext (inherited from parent)
  - children (child actors/state)
  - appliedRules (evaluated rules, state)
  - aggregates (totals, availability, etc.)
```

### Public API

```typescript
interface ItemContainer {
  // Child management
  addChild(child: Item | ItemContainer): void
  removeChild(childId: string): void
  updateChild(childId: string, updates: object): void
  
  // Context & rules
  receiveContext(patch: object): void
  evaluateRules(snapshot: object): RuleEvaluation
  
  // Display
  toDisplayObject(): {
    children: array,
    appliedRules: array,  // Rules + their state
    ruleErrors: array,
    ruleWarnings: array,
    aggregates: { totals, availability, ... }
  }
  
  // Persistence
  toSeed(): object
  static fromSeed(seed: object): ItemContainer
}
```

### Rule Flow Example

```
Parent Container receives context update
  ↓
Evaluates own rules (e.g., "if pax > 100, apply 10% discount")
  ↓
Passes updated context + rules down to children
  ↓
Children receive SET_CONTEXT event
  ↓
Children evaluate own rules (e.g., "if duration > 2 days, block this item")
  ↓
Children report results up: { totals, appliedRules, errors, warnings }
  ↓
Parent aggregates: sums totals, applies parent-level adjustments
  ↓
Parent reports up to its parent
  ↓
(repeat until reaching Basket, which reports final totals)
```

---

## Specialized Item-Containers

### Catalog (extends Item-Container)

**What it is:** Read-only browsable list of available items, organized by category/pricing profile.

**Initialization Level:** Display Mode
- Does NOT receive global quantities (pax, duracion)
- Shows items grouped by category <!-- for ease of rules application, category is another container -->
- Displays pricing profile in human-readable format (e.g., "$400 fijo + $50/unidad")
- Items are selectable (for adding to basket) but NOT editable
- Rules are displayed but NOT applied (informational, for user guidance) <!-- There are rules that might apply here, for example if too many pax, some items might be unavailable-->

**Responsibilities:**
- Load item definitions from database
- Group items by category (with category metadata)
- Display pricing formulas 
- Track which items user has selected <!-- This should be resolved on basket, not here -->
- Report selections to parent (Quotation/Basket)

**Special Behaviors:**
- Read-only mode (no quantity editing)
- Selection tracking (which items user wants to add) <!-- This should be resolved on basket, not here -->
- Category grouping UI support <!-- this is it's own component -->

**State Machine:**
```
States: uninitialized → initializing → idle → selecting

Events:
  - INITIALIZE (load catalog from DB)
  - SELECT_ITEM (mark for addition) <!-- This should be resolved on basket, not here -->
  - DESELECT_ITEM <!-- This should be resolved on basket, not here. Here should be a button to add to basket -->
  - REQUEST_ITEM_DETAILS (show pricing details)
```

**Operations:**
- Browse categories
- View item details (pricing, rules, requirements)
- Add item to basket (triggers Basket, not Catalog)

---

### Basket (extends Item-Container)

**What it is:** Editable quotation cart. Owns DayCategories, manages quotation state, aggregates global totals, applies global rules.

**Initialization Level:** With Global Quantities
- Receives quotation header context: `paxGlobal`, `fechaEvento`, `duracionDias`, `clienteId`
- Creates/manages DayCategory children (one per day)
- Calculates initial quantities based on global params + category defaults
- Evaluates global rules (apply to entire quotation)

**Responsibilities:**
- Own and manage DayCategory children
- Receive global context (quotation parameters)
- Pass context down to DayCategories
- Evaluate global rules (taxes, global discounts, surcharges)
- Aggregate totals across all days
- Track quotation state (initializing → editing → saved → evaluated)
- Provide operations: replicate day, duplicate item, etc.

**Special Behaviors:**
- Dual-write pattern (basket state + lineas/totals for backward compat)
- Rule evaluation at basket level (global rules)
- Context initialization considers global quantities

**State Machine:**
```
States:
  - uninitialized
  - initializing (loading header params)
  - editing (user updating items)
  - saving
  - saved
  - evaluating (re-calc rules, totals)
  - error

Events:
  - INITIALIZE (with header: paxGlobal, fecha, duracion, etc.)
  - SET_HEADER (update quotation parameters)
  - CREATE_DAY (add new day)
  - REPLICATE_DAY (copy one day's items to another)
  - ADD_ITEM (to specific day/category)
  - REMOVE_ITEM
  - UPDATE_ITEM_QUANTITY
  - SAVE
  - EVALUATE
  - GENERATE_DOCUMENT
```

**Context:**
```javascript
{
  definition: { /* basket config, global rules */ },
  header: {
    paxGlobal,
    fechaEvento,
    duracionDias,
    clienteId,
    // ... quotation metadata
  },
  dayCategories: [ /* child actors */ ],
  appliedRules: [ /* global rules & state */ ],
  aggregates: {
    subtotal,
    discounts,
    taxes,
    total,
    availability,
    errorCount,
    warningCount
  }
}
```

**Public Operations:**
```typescript
// Context
setHeader(header: object): void
receiveGlobalContext(patch: object): void

// Day management
createDay(fecha: string): DayCategory
replicateDay(sourceDay: string, targetDay: string): void

// Item operations (convenience)
addItem(dayId: string, itemId: string, quantity: number): void
removeItem(dayId: string, itemId: string): void
duplicateItem(dayId: string, itemId: string, targetDay?: string): void

// Quotation lifecycle
save(): void
evaluate(): void
generateDocument(format: 'pdf' | 'json' | 'csv'): buffer

// Display
toDisplayObject(): { 
  header, 
  dayCategories, 
  appliedRules, 
  aggregates 
}
```

**UI Workflow Stages:**
1. **Init quotation** → Create empty Basket, show entry form
2. **Introduce global params** → User enters paxGlobal, fechaEvento, duracionDias → Set header, rules evaluated <!-- Global params should be set before entering the quotation, not inside it. Though basket is initialized before basker is initialized. I think you have a component composition issue here , We should solve it creating that diagrama first  -->
3. **Update** → User adds items, modifies quantities → Basket recalculates continuously <!-- Here should also go the "update global quantity too-->
4. **Save** → Persist to database
5. **Evaluate** → Re-run all rules, refresh totals, flag errors/warnings
6. **Generate document** → Create output file (PDF, etc.)

---

### DayCategory (extends Item-Container)

**What it is:** Items grouped by a single calendar day within a quotation. Owns Items, passes day-specific context, aggregates day subtotal.

**Initialization Level:** With Parent Context
- Receives context from parent Basket: `fecha`, `dia`, `paxGlobal`, `duracionDias`
- Adapts context for Items: passes `dia`, `hora` (time range), `pax`, quantity defaults
- Creates/manages Item children for that day

**Responsibilities:** <!-- MANAGES TIME RELATED RULES AND DATA, the most important feature this component has -->
- Own and manage Items for the day
- Pass day context (date, time range, inherited pax) to Items
- Inherit global rules from Basket, evaluate for Items
- Aggregate day subtotal (sum of all items for that day)
- Support day-level operations: replicate to another day, duplicate items within day

**Special Behaviors:**
- Time range filtering (show items available for that day/time)
- Day-level aggregation (day subtotal, day error count, etc.)
- Can be replicated to other days (copy all items + quantities)

**State Machine:**
```
States:
  - uninitialized
  - initializing (with parent context)
  - idle
  - updating (items being modified)
  - recalculating
  - error

Events:
  - INITIALIZE (with parent context: fecha, pax, etc.)
  - SET_CONTEXT (updated parent context)
  - ADD_ITEM
  - REMOVE_ITEM
  - UPDATE_ITEM
  - DUPLICATE_ITEM (within day or to another day)
  - EVALUATE_RULES
```

**Context:**
```javascript
{
  definition: { /* day config, inherited rules */ },
  parentContext: {
    paxGlobal,
    fechaEvento,
    duracionDias,
    clienteId,
    // ... global context
  },
  dayInfo: {
    fecha,
    dia, // day number (1-N)
    horaInicio,
    horaFin,
  },
  items: [ /* child Item actors */ ],
  appliedRules: [ /* rules from parent, evaluated */ ],
  aggregates: {
    daySubtotal,
    itemCount,
    availability,
    errors,
    warnings
  }
}
```

**Operations:**
```typescript
addItem(itemId: string): Item
removeItem(itemId: string): void
duplicateItem(itemId: string, targetDay?: string): void
replicateToDay(targetDayId: string): void  // Copy all items to another day

toDisplayObject(): { 
  fecha, 
  dia, 
  items, 
  appliedRules, 
  daySubtotal 
}
```

---

## Leaf Component: Item

**What it is:** Single quotable item with its own pricing, quantities, rules, and UI mode.

**Responsibilities:** 
- Calculate own pricing (based on quantity, category profile, item overrides)
- Manage own quantity (resolve from context defaults, respect overrides)
- Evaluate own rules (blocking, warnings, adjustments, time related rules, add another item <!-- For instance if an event is over the limit hour, an extra fee must be added-->)
- Track user overrides (which quantities user manually set)
- Support catalog and basket display modes
- Report pricing up to parent

**State Machine:**
```
States:
  - uninitialized
  - catalog (read-only, no quantities)
  - basket (editable, with quantity inputs)
  - calculating
  - error

Events:
  - SET_MODE (CATALOG or BASKET)
  - SET_CONTEXT (receive parent context)
  - SET_OVERRIDE (user manually sets quantity)
  - CLEAR_OVERRIDE
  - RESET
  - EVALUATE_RULES

Context:
  - definition (item config, pricing profile, rules)
  - parentContext (inherited from parent: pax, dia, hora, etc.)
  - quantities (pax, cantidad, duracionMin, with overrides)
  - pricing (neto, subtotal, total)
  - appliedRules (evaluated rules, state)
  - userSetFields (which quantities user manually set)
```

**Public API:**
```typescript
interface Item {
  setMode(mode: 'CATALOG' | 'BASKET'): void
  setOverride(field: string, value: number): void
  clearOverride(field: string): void
  receiveContext(parentContext: object): void
  
  toDisplayObject(): {
    name,
    mode,
    quantities: { pax, cantidad, duracionMin, ... },
    pricing: { neto, subtotal, total, ... },
    appliedRules,
    ruleErrors,
    ruleWarnings,
    userSetFields: Set,
    isUserSetPax,
    isUserSetCantidad,
    isUserSetDuracion,
    available
  }
  
  toSeed(): object
  static fromSeed(seed: object): Item
}
```

**Current Implementation Status:** ✅ Mostly complete (363 tests passing)
- Item class working
- Pricing calculation working
- Quantity resolution working
- Rules evaluation working (JSON-Logic based)
- User override tracking working
- Catalog/basket modes working



<!-- Missing components,
Database viewer to see and edit the data ion the DB,
Quotations loader
Client loader
Homepage
New quotation initializer
--->

---

## External Systems (Service Layer)

### Database / Store (IStore)

**Responsibility:** Persist and retrieve all data
- Item definitions
- Category metadata
- Quotation history
- Client data
- Rule definitions

**Interface:**
```typescript
interface IStore {
  get(table: string, id: string): object
  set(table: string, id: string, data: object): void
  all(table: string): array
  create(table: string, data: object): string  // returns new id
  update(table: string, id: string, updates: object): void
}
```

**Implementations (from legacy):**
- InMemoryStore (testing)
- FileStore (local dev)
- GasSheetStore (production with Google Sheets)

### Cache Layer

**Responsibility:** Cache frequently accessed data (catalog, rules, pricing profiles)
- Reference data loaded at Basket init and cached
- Invalidated on definition changes
- Reduces DB round-trips

### Output Generation

**Responsibility:** Generate documents
- PDF quotation
- JSON export
- CSV export
- Email templates

---

## Data Flow Summary

```
User Action (UI)
  ↓
Basket receives event
  ↓
Basket updates context/header
  ↓
Basket passes SET_CONTEXT to DayCategories
  ↓
DayCategory passes context to Items
  ↓
Items calculate pricing, evaluate rules
  ↓
Items report { pricing, rules, availability } up
  ↓
DayCategory aggregates item totals
  ↓
DayCategory reports up
  ↓
Basket aggregates day totals, applies global rules
  ↓
Basket reports final totals + rules + errors to UI
  ↓
UI renders updated state
```

---

## Summary

| Component | Type | Owns | Children | Special |
|-----------|------|------|----------|---------|
| **Item-Container** | Abstract pattern | Collection mgmt, rules, aggregation | Items or Containers | Rule eval + display |
| **Catalog** | Container | Items by category | Items | Read-only, pricing display |
| **Basket** | Container | DayCategories | DayCategories | Global context, global rules |
| **DayCategory** | Container | Items by day | Items | Day context passing |
| **Item** | Leaf | Own pricing/quantity | None | Catalog/basket modes |

**Key Principles:**
- ✅ Each component has own state machine
- ✅ Rules are observable (always readable, not hidden)
- ✅ Context flows down, aggregates flow up
- ✅ Components are composable and reusable
- ✅ Highly modular, testable, extensible
