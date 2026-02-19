# Quotation Workflow: User Journey

**What the system does:** Create, edit, and save event quotations with automatic pricing calculation

---

## 8-Step User Journey

### Step 1: Browse Previous Quotations
**State:** `quotation_workflow.browse`

User opens the system and sees a list of previously saved quotations.

**What they can do:**
- Search/filter previous quotations
- Load an existing quotation to edit
- Create a new quotation from scratch

---

### Step 2: Choose Quotation Source
**State:** `quotation.initialize.chooseSource`

User decides whether to create a new quotation or load an existing one.

**Options:**
- **Create New:** Start with empty quotation
- **Load Previous:** Load from saved list

---

### Step 3: Setup Event Details
**State:** `quotation.initialize.creatingNew`

User enters basic event information.

**Required fields:**
- **Client:** Select from client list
- **Event Date:** When is the event?
- **Duration:** How many days?
- **Pax:** How many people?

---

### Step 4: Add Items from Catalog
**State:** `quotation.basket`

User builds the quotation by adding items from the catalog.

**What happens:**
1. User browses catalog (grouped by category: Salones, Cafés, Almuerzos, etc.)
2. Searches for items if needed
3. Clicks item to add to cart
4. System automatically calculates price based on:
   - Base item price
   - Pax count
   - Duration
   - Applied business rules
5. Quantity can be adjusted

**Catalog items include:**
- Venue spaces (Salón Chinook, Salón Fario, etc.)
- Catering options (breakfast, lunch, dinner)
- Beverages and services
- Optional add-ons

---

### Step 5: Review & Edit Items
**State:** `quotation.basket`

User can modify the quotation before saving.

**Actions:**
- **Change Quantity:** Update item count
- **Adjust Price Overrides:** Override automatic pricing if needed
- **Remove Items:** Delete line items
- **Change Event Details:** Update pax, dates, duration
  - Prices automatically recalculate

**Pricing updates in real-time** as quantities and parameters change.

---

### Step 6: Review Summary Before Save
**State:** `quotation.validation`

User sees final quotation summary and confirms details.

**What's shown:**
- All items with quantities and prices
- Subtotal
- Taxes (IVA 19%)
- Any discounts applied
- Grand total

**User can:**
- ✓ Confirm and Save → proceeds to completed
- ← Go Back → returns to basket to make more changes

---

### Step 7: Save Quotation
**State:** `quotation.completed`

Quotation is saved to system with unique ID.

**What happens:**
- Quotation gets unique ID (e.g., COT_20260219_001)
- Saved to spreadsheet with timestamp
- Ready for later retrieval or sharing

**User can:**
- Create new quotation
- View previous quotations
- Generate PDF (Phase 4)
- Send via email (Phase 4)

---

### Step 8: Back to Browse
**State:** `quotation_workflow.browse`

User is back at the starting point and can:
- Create another quotation
- Edit existing quotation
- View quotation history

---

## Parallel Feature: Database Management

While working on a quotation, user can:
- **Open Catalog Editor** to update item prices
- **Edit Pricing Profiles** to change base costs
- **Update Business Rules** to add/modify discount rules
- **Save Changes** → Quotation automatically recalculates with new data

---

## Key Business Rules Applied

### Automatic
- Base item price applied
- Pax-based multipliers
- Duration-based multipliers
- Volume discounts
- Early booking discounts
- Category-specific rules

### Manual
- Price overrides per line item
- Special discounts by client
- Adjustment notes

---

## Data Preserved

When quotation is saved:
- ✅ Client details
- ✅ Event information (date, pax, duration)
- ✅ All line items
- ✅ Quantities and prices
- ✅ Applied rules and calculations
- ✅ Creation timestamp
- ✅ Unique quotation ID

---

## Typical Workflow Time

| Step | Time | Notes |
|------|------|-------|
| Browse & select client | 2 min | Search if many clients |
| Add 5-10 items | 5 min | Browse catalog, click items |
| Review & adjust | 3 min | Change quantities as needed |
| Final review | 2 min | Confirm summary |
| **Total** | **~12 min** | Depends on complexity |

---

## User Success Criteria

User can successfully:
- [ ] Load previous quotations
- [ ] Create new quotation with client, dates, pax
- [ ] Search catalog and add items
- [ ] Adjust quantities and see price updates
- [ ] Review final quotation
- [ ] Save with unique ID
- [ ] Create new quotation from start

