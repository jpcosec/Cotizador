# UI Component Flow & Responsibility Design
**Date:** 2026-02-24  
**Status:** ✅ Approved  
**Objective:** Clear diagram showing components, interactions, and responsibility boundaries from homepage to final quotation

---

## Overview

The rebuild uses a **linear flow architecture** with **reusable modals** to manage the quotation creation process. This design prioritizes:
- Clear separation of concerns
- Easy extensibility (DB viewer, admin tools, future features)
- Independent, testable components
- State preservation when updating quotation context

---

## Terminology (Critical)

| Legacy Term | Our Term | Component(s) |
|-------------|----------|-------------|
| "Basket" | "Quotation" | Quotation context + state |
| "Timeline" | "Basket" | Day-by-day item editing view |
| - | "Catalog" | Sidebar with items by category |

---

## Screen / State Flow

### HomePage (BROWSE State)

**Purpose:** Entry point with 3 main actions

**Layout:**
```
┌─────────────────────────────────────┐
│ SF Lodge Cotizador                  │
│                                     │
│ [New Quotation]                     │
│ [Load Previous]                     │
│ [View Database]                     │
│                                     │
│ (Optional: Recent quotations list)  │
└─────────────────────────────────────┘
```

**Responsibilities:**
- Display entry points
- Manage modal state (which modal is open)
- Navigate to correct flow based on user action

**Outputs:**
- New Quotation → ClientSelector modal
- Load Previous → PreviousQuotationsModal
- View Database → DatabaseViewer modal (independent)

---

### ClientSelector Modal

**Purpose:** Search, select, or create a client

**Triggers:** User clicks [New Quotation] on HomePage

**Features:**
- Search by name, RUT, email (with debounce)
- Display filtered results in left panel
- Show selected client preview in right panel
- Option to create new client (collapsible form)
- Keyboard navigation (arrow keys, Enter)

**Outputs:**
- Selected client ID → QuotationInitializer

**Cancel:** Return to HomePage

---

### QuotationInitializer Modal (INITIALIZE State)

**Purpose:** Collect quotation parameters + pre-load database

**Triggers:** User selects client in ClientSelector

**Fields:**
- Pax Global (number input)
- Fecha Evento (date input)
- Duración Días (number input)

**Background Tasks:**
- Load catalog items from DB
- Load pricing rules from DB
- Load pricing profiles from DB
- Load category defaults from DB
- Cache all reference data for use in QuotationView

**Behavior:**
- Show loading indicator while DB loads
- Display validation errors if DB load fails
- Allow user to cancel and return to HomePage

**Outputs:**
- Quotation context (pax, fecha, duracion, clientId)
- Cached database reference data
- → QuotationView

---

### QuotationView (BASKET State)

**Purpose:** Main editing interface for creating/modifying quotation

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Client Name | [Update Quantities] | [Save] | [PDF]  │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  Sidebar: Catalog    │  Main Area: Basket                  │
│                      │                                      │
│  🔍 Search          │  Quotation Context Display            │
│                      │  ├─ Pax: 50                          │
│  By Category:       │  ├─ Fecha: 2026-03-15                │
│  ├─ Catering [3]    │  └─ Duración: 3 días                │
│  ├─ Beverages [5]   │                                      │
│  └─ Venue [2]       │  Day Tabs: [Día 1] [Día 2] [Día 3]  │
│                      │                                      │
│  Click item → add   │  Items (Accordion by Day):           │
│                      │  ├─ [▼] Time: 19:00                │
│                      │  │    Plated Dinner | $12,500       │
│                      │  │    Pax: 50 | Units: — | Min: —  │
│                      │  │    [Delete] [Copy] [Duplicate]   │
│                      │  │                                  │
│                      │  └─ [▼] Time: 20:00                │
│                      │       Premium Bar | $8,000         │
│                      │       ...                          │
│                      │                                      │
│                      │  Footer: Subtotal $50K | Total $59.5K
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

**Catalog (Sidebar):**
- Search bar (filters items by name)
- Items grouped by category (collapsible)
- Click item → add to basket for current day
- Shows pricing (base price or formula)

**Basket (Main Area):**
- Quotation context display at top (pax, fecha, duracion)
- Day tabs (one per day in quotation)
- Items as accordions (one per added item, grouped by day)
- Each item accordion shows:
  - Time picker (for start time that day)
  - Quantity controls (pax, units, duration min)
  - Price breakdown (base + rate = total)
  - Comments field
  - Actions: Delete, Copy to next day, Duplicate in day
- Footer: Subtotal and total

**Header Buttons:**
- [Update Quantities] → Opens GlobalVariablesForm modal
- [Save Quotation] → Saves to DB, transitions to ValidationSummary
- [Generate PDF] → Generates PDF file
- [View Database] → Opens DatabaseViewer modal

**Modals Available:**
- GlobalVariablesForm (update pax/fecha/duracion)
- DatabaseViewer (view/edit all data)
- PreviousQuotationsModal (load another quotation)

**Data/State:**
- Quotation context (pax, fecha, duracion, clientId)
- Cached DB reference data (catalog, rules, profiles)
- Basket items (array with time, quantities, comments per item per day)
- Totals (subtotal, taxes, total)

**Behavior:**
- Items are evaluated against quotation context (rules, availability, pricing)
- When item quantities change → totals recalculate
- When item is added/removed → affected day is updated
- Totals shown in footer (always visible)

---

### GlobalVariablesForm Modal

**Purpose:** Update quotation context (pax, fecha, duracion) without losing basket items

**Triggers:**
1. After QuotationInitializer (initial creation, can skip if form auto-submits)
2. User clicks [Update Quantities] in QuotationView header

**Fields:** (Same as QuotationInitializer)
- Pax Global
- Fecha Evento (may require recalculating day structure)
- Duración Días (may require creating/removing days)

**Behavior:**
- Show current values (pre-filled)
- On submit:
  - Update quotation context
  - Re-evaluate all items in basket against new context
  - Recalculate totals
  - **Preserve all items** (no deletion)
  - **Preserve item internal state** (user overrides, comments, etc.)
  - Close modal, return to QuotationView

**Cancel:** Close modal without changes

---

### DatabaseViewer Modal

**Purpose:** View and edit all database tables (admin/power-user tool)

**Triggers:**
- User clicks [View Database] on HomePage
- User clicks [View Database] in QuotationView header

**Features:**
- Table selector (dropdown or tabs)
- Display all rows in selected table
- Edit inline (if allowed)
- Add new rows
- Delete rows (with confirmation)
- Export/Import CSV
- Search/filter rows
- Modal can be opened from multiple places (independent)

**Responsibility:**
- Query all tables from DB
- Display in structured format
- Handle create/update/delete operations
- Validate changes before saving

**Note:** Separate from quotation workflow, exists independently

---

### PreviousQuotationsModal

**Purpose:** Load a previously saved quotation

**Triggers:**
- User clicks [Load Previous] on HomePage
- User clicks [Load Previous] in QuotationView header

**Features:**
- Filter by date, client, status
- Sort by date, total, status
- Click [Load] → Load that quotation into QuotationView

**Behavior:**
- Loading previous quotation replaces current basket
- Quotation context + items all restored
- Returns to QuotationView

---

### ValidationSummary (VALIDATION State)

**Purpose:** Final review before saving

**Layout:**
```
┌──────────────────────────────────────┐
│ Resumen de Cotización               │
│                                      │
│ Cliente: Empresa SPA                │
│ Fecha: 2026-03-15                   │
│ Pax: 50                             │
│                                      │
│ Items Table:                         │
│ ├─ Plated Dinner | 50 | $250 | $12.5K │
│ ├─ Premium Bar | 50 | $160 | $8K     │
│ └─ ...                              │
│                                      │
│ Subtotal: $50,000                   │
│ IVA (19%): $9,500                   │
│ Total: $59,500                      │
│                                      │
│ [Back to Basket] [Confirm & Save]  │
└──────────────────────────────────────┘
```

**Features:**
- Summary table of all items (name, qty, unit price, total)
- Client, date, pax info
- Subtotal, taxes, total
- Two buttons: back or confirm

**Outputs:**
- [Confirm & Save] → Save to DB, go to CompletionSuccess
- [Back to Basket] → Return to QuotationView

---

### CompletionSuccess (COMPLETED State)

**Purpose:** Confirmation of successful save

**Display:**
- Success message
- Quotation ID
- Next options (create new, load another, view DB)

**Outputs:**
- [Create New] → HomePage (new quotation flow)
- [Load Previous] → PreviousQuotationsModal
- [View Database] → DatabaseViewer

---

## Component Responsibilities Summary

| Component | Input | Process | Output |
|-----------|-------|---------|--------|
| **HomePage** | User action | Route to modal or view | Modal state change |
| **ClientSelector** | - | Search/select/create client | Client ID |
| **QuotationInitializer** | Client ID | Collect pax/fecha/duracion, load DB | Quotation context + cached DB |
| **Catalog (Sidebar)** | Cached DB, search term | Display items by category, filter | Selected item |
| **Basket (Main)** | Quotation context, items | Manage items, calculate totals | Item updates, total recalc |
| **GlobalVariablesForm** | Current context | Collect new pax/fecha/duracion | Updated context (items stay) |
| **DatabaseViewer** | DB query | Display tables, handle edits | DB updates |
| **PreviousQuotationsModal** | Saved quotations | Filter/search, load selected | Restore quotation to view |
| **ValidationSummary** | Quotation context | Display summary table | Confirmation signal |
| **CompletionSuccess** | Quotation ID | Display success info | Navigation signal |

---

## Data Flow Summary

```
HomePage
  ↓ [New Quotation]
ClientSelector
  ↓ Select client
QuotationInitializer
  ├─ Collect: pax, fecha, duracion
  ├─ Load: catalog, rules, profiles (cached)
  └─ Pass to: QuotationView
      ↓
QuotationView (MAIN EDITING VIEW)
  ├─ Display: Catalog (sidebar) + Basket (main)
  ├─ User action: Add item
  ├─ Basket updates: Recalculate totals
  │
  ├─ User clicks [Update Quantities]
  │  → GlobalVariablesForm modal
  │  → User updates pax/fecha/duracion
  │  → Form submits
  │  → Quotation context updated
  │  → Items re-evaluated (but NOT removed)
  │  → Totals recalculated
  │  → Modal closes
  │
  ├─ ... (more item editing)
  │
  └─ [Save Quotation]
      ↓
ValidationSummary
  ├─ Display: Summary table with totals
  └─ [Confirm & Save]
      ↓
CompletionSuccess
  └─ [Create New] or [Load Previous] → Loop back
```

---

## Key Design Principles

✅ **Linear Flow** — Each screen/modal is a clear, sequential step  
✅ **Reusable Modals** — GlobalVariablesForm used for both initialization and updates  
✅ **Independent Views** — DatabaseViewer, PreviousQuotations not coupled to quotation flow  
✅ **Extensible** — New modals/views slot easily into the flow  
✅ **Clear Responsibilities** — Each component owns specific data and UI  
✅ **State Preservation** — Update quantities without losing basket items or their internal state  
✅ **Graceful Degradation** — Each modal can be canceled, returning to previous state  

---

## Implementation Notes

### Database Pre-loading (Optimization)

QuotationInitializer should:
1. Start loading DB reference data immediately when modal opens
2. Allow user to fill form while DB loads in background
3. Check if DB is ready before submitting
4. Show loading indicator if user submits before DB is ready

This reduces perceived latency and improves UX.

### Item State Preservation (Critical)

When GlobalVariablesForm updates quotation context:
1. DO update context (pax, fecha, duracion)
2. DO re-evaluate items (rules, availability, pricing)
3. DO NOT remove items from basket
4. DO NOT clear user overrides (comments, manual quantities)
5. DO preserve item internal state (time picker values, etc.)

### Day Structure Changes (Edge Case)

If user changes "Duración Días" (e.g., 3 days → 2 days):
1. Questions to resolve in implementation:
   - Remove items from deleted days, or move them to remaining days?
   - Keep day structure as-is but collapse empty days?
   - Recommended: Move items to remaining days (preserve data)

---

## Success Criteria

- ✅ User can create new quotation (client → form → items → save)
- ✅ User can update global quantities without losing items
- ✅ Items re-evaluate when context changes
- ✅ All modals can be canceled
- ✅ Database viewer is independent (can open from multiple places)
- ✅ Linear flow is clear and easy to navigate
- ✅ Each component has single responsibility

---

## Next Steps

1. Create implementation plan with step-by-step tasks
2. Build HomePage with entry points
3. Build ClientSelector modal
4. Build QuotationInitializer (with DB pre-loading)
5. Integrate with existing Catalog/Basket components
6. Build GlobalVariablesForm modal
7. Build ValidationSummary (may already exist)
8. Build CompletionSuccess (may already exist)
9. Integrate DatabaseViewer as independent modal
10. Test full linear flow end-to-end

---

**Design approved:** 2026-02-24
