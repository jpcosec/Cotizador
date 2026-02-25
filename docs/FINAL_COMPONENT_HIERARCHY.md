# Final Component Hierarchy (Sidebar Clarified)

**Status:** Complete architecture with Sidebar as UIContainerBase  
**Date:** 2026-02-24

---

## Visual Hierarchy

```
QuotationView (UIContainerBase)
│
├─────────────────────────────────────────────────────────────┐
│                                                             │
│  SIDEBAR (UIContainerBase) ← Manages search state          │
│  ┌─────────────────────────────────────┐                   │
│  │ 🔍 [Search input] (HTML, no JS)    │                   │
│  │    ↑ State managed by Sidebar       │                   │
│  │                                     │                   │
│  │ Catalog (UIContainerBase)           │   MAIN AREA       │
│  │ ┌─────────────────────────────────┐ │  ┌─────────────┐ │
│  │ │ CategoryGroup (ViewBase)        │ │  │ Header      │ │
│  │ │ ┌─────────────────────────────┐ │ │  │ Pax/Fecha  │ │
│  │ │ │ CatalogItemCard (ViewBase)  │ │ │  │             │ │
│  │ │ │ [+] Item Name | $1,500      │ │ │  ├─────────────┤ │
│  │ │ └─────────────────────────────┘ │ │  │ DayTabs     │ │
│  │ │ ┌─────────────────────────────┐ │ │  │ [D1] [D2]   │ │
│  │ │ │ CatalogItemCard             │ │ │  ├─────────────┤ │
│  │ │ │ [+] Item Name | $2,000      │ │ │  │ Basket      │ │
│  │ │ └─────────────────────────────┘ │ │  │ ┌─────────┐ │ │
│  │ │                                 │ │  │ │ Accordion│ │ │
│  │ │ CategoryGroup                   │ │  │ │ Item 1  │ │ │
│  │ │ ┌─────────────────────────────┐ │ │  │ │ Item 2  │ │ │
│  │ │ │ CatalogItemCard             │ │ │  │ └─────────┘ │ │
│  │ │ │ [+] Item Name | $3,500      │ │ │  ├─────────────┤ │
│  │ │ └─────────────────────────────┘ │ │  │ Totals      │ │
│  │ └─────────────────────────────────┘ │  │ $59,500     │ │
│  └─────────────────────────────────────┘  └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Tree (Complete)

### Top Level
1. **QuotationView** (UIContainerBase)
   - Purpose: Main quotation editing container
   - Children: Sidebar + Main area
   - Owns: Quotation context, day tabs state
   - Emits: Item added, quantity changed, save, etc.

### Left Side: Sidebar (NEW - CLARIFIED)
2. **Sidebar** (UIContainerBase) ⭐
   - Purpose: Item browser with search
   - State: `searchTerm`, `filteredItems`
   - Children: Catalog
   - Methods: `search(term)`, `clearSearch()`
   - Emits: `ITEM_SELECTED` (when CatalogItemCard clicked)

3. **Catalog** (UIContainerBase)
   - Purpose: Browse items grouped by category
   - State: Categories list
   - Children: CategoryGroup[] (one per category)
   - Methods: `getCategories()`, `filterBySearch(term)`
   - Emits: Bubbles `ITEM_SELECTED` from children

4. **CategoryGroup** (ViewBase)
   - Purpose: Collapsible category section
   - State: `isExpanded`
   - Children: CatalogItemCard[] (items in this category)
   - Methods: `toggle()`, `expand()`, `collapse()`
   - Emits: `CATEGORY_TOGGLED`, `ITEM_SELECTED` (bubbles)

5. **CatalogItemCard** (ViewBase)
   - Purpose: Single item display + add button
   - Display: Name, base price, category badge
   - Methods: `click()` → fires add event
   - Emits: `ITEM_CLICKED` with item data

### Right Side: Main Area

6. **QuotationHeader** (ViewBase)
   - Purpose: Display & modify quotation context
   - Displays: Client name, Pax, Fecha, Duracion
   - Buttons: [Update Quantities] [Save] [PDF] [Database]
   - Emits: Button click events

7. **DayTabs** (ViewBase)
   - Purpose: Navigate between days
   - State: `selectedDayIndex`
   - Displays: Día 1, Día 2, Día 3, etc. (from quotation context)
   - Methods: `selectDay(index)`
   - Emits: `DAY_SELECTED`

8. **Basket** (UIContainerBase)
   - Purpose: Container for day's items
   - Children: DayAccordion (one per day)
   - State: Selected day index
   - Methods: `getItemsForDay(dayIndex)`
   - Emits: Bubbles item events from children

9. **DayAccordion** (ViewBase)
   - Purpose: All items for one day
   - State: `selectedDayIndex`
   - Children: ItemAccordion[] (one per item)
   - Displays: "Día 1 - 5 items - $15,000"
   - Emits: Bubbles from ItemAccordion

10. **ItemAccordion** (ViewBase)
    - Purpose: Single item in basket with editing
    - Display: Time, name, qty controls, price, comments
    - State: `isExpanded`
    - Methods: `setQuantity()`, `setComment()`, `delete()`
    - Emits: `ITEM_UPDATED`, `ITEM_DELETED`

11. **QuotationTotals** (ViewBase)
    - Purpose: Summary footer
    - Displays: Subtotal, IVA, Total
    - Calculates: From aggregated items
    - Emits: None

---

## Updated Component Count

### By Type
- **UIContainerBase**: 5 (QuotationView, Sidebar, Catalog, Basket, Main)
- **ViewBase**: 8 (Header, DayTabs, CategoryGroup, CatalogItemCard, DayAccordion, ItemAccordion, Totals, HomePage)
- **ModalControllerBase**: 6 (ClientSelector, Initializer, GlobalVariablesForm, PreviousQuotationsModal, DatabaseViewer, AppState)
- **Domain**: ItemBase, ContainerBase (managed by orchestration layer)

**Total UI Components: 20**

---

## Key Clarifications

### Sidebar vs Catalog
- **Sidebar** = Container that owns search state + SearchBar input
- **Catalog** = Container that manages categories/items
- **SearchBar** = HTML element (not a component), state in Sidebar
- **Relationship**: Sidebar → Catalog (parent-child)

### Event Flow Example
```
User types in SearchBar
  → Sidebar.search() is called
  → Sidebar updates filteredItems
  → toDisplayObject() returns updated state
  → Alpine re-renders Catalog
  → Only matching CategoryGroups show

User clicks CatalogItemCard
  → CatalogItemCard emits ITEM_CLICKED
  → CategoryGroup bubbles to Catalog
  → Catalog bubbles to Sidebar
  → Sidebar emits ITEM_SELECTED to QuotationView
  → QuotationView creates new ItemAccordion in Basket
```

### SearchBar Implementation
```html
<!-- In QuotationView template -->
<div class="sidebar">
  <input 
    type="text"
    placeholder="🔍 Buscar item"
    @input="sidebar.search($el.value)"
  />
  <!-- Catalog renders based on sidebar.getFilteredItems() -->
</div>
```

The SearchBar is just HTML + Alpine binding. The Sidebar component owns the state and provides the method.

---

## Base Classes Mapped to Components

### Domain (Not in this list, orchestration layer)
- ItemBase ← Used by quotation items
- ContainerBase ← Used by Basket, DayCategory, etc.

### UI Controllers
- ModalControllerBase
  - ClientSelector, QuotationInitializer, GlobalVariablesForm, PreviousQuotationsModal, DatabaseViewer, AppState

### UI Containers
- UIContainerBase
  - QuotationView, Sidebar, Catalog, Basket, Main

### Simple Views
- ViewBase
  - HomePage, QuotationHeader, DayTabs, CategoryGroup, CatalogItemCard, DayAccordion, ItemAccordion, QuotationTotals

---

## Next Steps

1. ✅ Approve component hierarchy
2. ✅ Create 10 mixins
3. ✅ Create 5 base classes
4. ✅ Refactor counter-composed (validation)
5. ✅ Build 20 components

**Ready to start implementation?**

