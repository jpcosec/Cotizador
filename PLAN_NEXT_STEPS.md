# Next Steps: From Standalone Item to Full Component System

## What We Have (Post-Refactoring)

The standalone item (step-03) has:
- `Item` domain class with private fields, calculation pipeline, projections
- Domain modules: pricing, quantity, rules, formatting, schedule
- XState actor per item (catalog/basket states)
- Alpine adapter following counter-basic pattern
- Benchmark-validated: 1000 actors = 29ms, 3.7MB

## What's Missing (From Old claps_codelab)

### 1. Item Visual Representation
The standalone sandbox shows controls but not the actual item as it would appear in production.

**Catalog card** should show:
- Item name
- Pricing formula (disaggregated: "$400 fijo + $1 por unidad")
- Policy hint ("3 und/persona")
- Category badge
- Click to add to basket

**Basket line** should show:
- Accordion header: time input, name, total, quantity
- Accordion body: quantity controls (pax/units/duration), price breakdown (base + rate subtotal = total), comments textarea
- Actions: delete, copy to next day, duplicate

### 2. Rules System (3 types in current rebuild, 9+ in old system)

**Current rebuild has:**
- MAX_PAX, MIN_PAX, ONLY_HOUR_RANGE (hardcoded in `rules.js`)

**Old system has (via JSON-Logic + RulesEngine):**

| Stage | Purpose |
|-------|---------|
| `RESTRICCION_UI` | Block item availability |
| `AJUSTE_LINEA` | Line-level pricing adjustments (MULTIPLY, ADD_FIXED) |
| `CANTIDAD_DEFAULT` | Auto-calculate quantities (SET_DEFAULT) |
| `AJUSTE_GLOBAL` | Basket-level discounts/surcharges |
| `IMPUESTO` | Tax calculation |

**Key features missing:**
- JSON-Logic condition evaluation
- Accumulation control (stop after first match vs. continue)
- Priority ordering
- Blocking vs. non-blocking distinction
- Rule-injected context values that override defaults

### 3. Context Inheritance (Container → Item)

**Old flow:**
```
Quotation Settings (paxGlobal, Fecha_Evento, duracionDias)
  → Basket (evaluates global rules, propagates context)
    → DayCategory (groups items by day)
      → Item (receives context, resolves quantities)
```

**What items inherit from containers:**
- `pax` — from quotation header
- `dia`, `hora` — from the day container
- Price profile — from category default (if item has no override)
- Default quantities — from category (`Def_Unidades_Por_Pax`, `Def_Duracion_Min`)

**User override protection:**
Once a user manually sets pax/cantidad/duracion, that value is locked (`isUserSet = true`) and never reverts even if container context changes.

### 4. Category Structure

Categories provide:
- **Grouping** for UI display (sidebar sections)
- **Price profile inheritance** (`ID_Perfil_Precio_Default`)
- **UI defaults**: `Def_Requiere_Pax`, `Def_Requiere_Cant`, `Def_Requiere_Tiempo`, `Def_Requiere_Hora`
- **Default duration**: `Def_Duracion_Min`
- **Unit calculator**: `Def_Unidades_Por_Pax`
- **Icon**: `Icono_UI`
- **Active flag**: hide if false

### 5. Kit Support

Kits are composite items (parent + children):
- Parent item has zero cost
- Children inherit context from kit
- Kit aggregates child prices
- In catalog: shows as single item
- In basket: expands to show children

### 6. Price Aggregation (Bottom-Up)

```
Item._price (calculated)
  → DayCategory.aggregate() (sum of items for that day)
    → Basket.aggregate() (sum of all days)
      → Apply AJUSTE_GLOBAL rules
        → Apply IMPUESTO rules
          → Final total
```

---

## Implementation Plan (One Step at a Time)

### Step 3.1: Fix Standalone UI Layout
**Goal:** Show the item visually, separate concerns in the sandbox.

**Layout:**
```
┌───────────────────────────┬────────────────────────────┐
│  THE ITEM (left)          │  SANDBOX CONTROLS (right)  │
│                           │                            │
│  [Catalog Card]           │  Mock Container Context    │
│    name, formula, policy  │    paxGlobal, dia, hora    │
│    category badge         │                            │
│    [Add to basket] btn    │  Item Intrinsic Props      │
│                           │    pricing profile editor  │
│  — or —                   │    default init editor     │
│                           │                            │
│  [Basket Line]            │  State Debug               │
│    accordion: time, name  │    collapsible JSON        │
│    qty controls           │                            │
│    price breakdown        │                            │
│    comments               │                            │
│    actions (remove, reset)│                            │
└───────────────────────────┴────────────────────────────┘
```

**Files:** Only `ItemStandalone.html` changes. No logic changes.

### Step 3.2: User Override Protection (`isUserSet`)
**Goal:** Once user overrides pax/cantidad/duracion, it sticks.

Currently `setOverride(key, value)` stores in overrides, and `receiveContext()` can change externalContext. But the override is a separate object so it already takes precedence in `resolveBasketQuantity()`. We need to add:
- `isUserSet` tracking per quantity field (pax, cantidad, duracionMin)
- `receiveContext()` should NOT overwrite user-set quantities
- Visual indicator when a quantity is user-overridden

**Files:** `Item.js` (add `isUserSet` to derived state), `quantity.js` (already returns `isOverridden`).

### Step 3.3: Enhanced Rules (JSON-Logic)
**Goal:** Replace hardcoded rule types with the pluggable rules engine.

- Import `json-logic-js` (already a dependency in claps_codelab)
- Rules have `conditions` (JSON-Logic), `action`, `payload`, `priority`, `accumulate`
- Evaluate conditions against item state snapshot
- Actions: MULTIPLY, ADD_FIXED, SET_VALUE, SET_DEFAULT, WARNING, ERROR
- Blocking rules set `available = false`

**Files:** `domain/rules.js` (rewrite to use JSON-Logic), `Item.js` (update rule snapshot shape).

### Step 3.4: Profile Inheritance from Category
**Goal:** Items can inherit pricing profile from their category.

- Add `categoryDefaults` to seed/definition
- In `calculate()`, if no direct pricing profile, fall back to category profile
- Category provides: `Def_Unidades_Por_Pax`, `Def_Duracion_Min`, icon, active flag

**Files:** `Item.js`, `seeds.js` (add category-aware seed).

### Step 4: DB Viewer Standalone
**Goal:** Load item definitions from database, display catalog.

Per ROADMAP step 4. Separate component, uses `IStore` interface.

### Step 5: Item + DB Integration
**Goal:** Items created from real database definitions.

### Step 6: Category Container
**Goal:** Category owns N item actors, provides context inheritance.

- Category is one actor that coordinates child item actors
- Sends `SET_CONTEXT` to children when global context changes
- Children subscribe to category for context updates
- Category aggregates child totals

### Step 7+: Catalog, Basket, Environment
Build on the container pattern from Step 6.

---

## Key Architectural Rails to Build Now

Even before steps 4+, the standalone item should establish these contracts:

1. **`receiveContext(patch)`** — already exists, used by containers to push context down
2. **`toDisplayObject()`** — already exists, the projection contract for Alpine
3. **`SET_CONTEXT` event** — already in the machine, the container→item communication channel
4. **Catalog card / basket line projections** — already exist as `catalogCard` and `basketLine` getters
5. **`isUserSet` per quantity** — needs to be added (Step 3.2)
6. **Rule evaluation contract** — needs enhancement (Step 3.3)

These contracts mean that when Step 6 (category container) is built, it just sends `SET_CONTEXT` to child item actors and subscribes to their snapshots. No item changes needed.
