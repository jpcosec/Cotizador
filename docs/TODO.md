# TODO: Quotation System Enhancement & Pricing Engine Integration

## Phase 1: Core Data Model & Logic Updates

### Pax & Pricing Logic
- [ ] Implement global event pax as default (can be overridden per item)
  - Each item can have different pax than event default
  - Pax calculated from passenger count, not manual input
  - Pax validation & constraints logic
- [ ] Implement per-diem pax logic (pax per day, not per event)
  - Calculate pax distribution across multiple days
  - Handle day-specific pax variations
- [ ] Item quantities instead of pax
  - Items have `unidades` (units/quantity), not pax
  - Quantity selector appears only for items that support it
  - Quantity constraints based on item type

### Item Types & Categories
- [ ] Create internal service categorization logic
  - Service types: Servicio / Salón / Producto
  - Category-specific properties & defaults
  - Category-specific details handling
- [ ] Add category-specific detail fields
  - Different details for Servicios vs Salones vs Productos
  - Custom fields per category in quotes
- [ ] Item details in quotation context
  - Show relevant details for each item in quote
  - Description/specification field for each line item

### Time & Duration
- [ ] Change time format to 24-hour format (HH:MM)
  - Update all time inputs/displays
  - Validate time format
- [ ] Change event duration selector
  - Better UX for duration input
  - Consider day-based or time-range based
- [ ] Add service end time
  - Track when each service ends (not just start time)
  - Calculate actual duration from start/end times
- [ ] Sort items by time
  - Display items chronologically in quotes
  - Handle multi-day events

---

## Phase 2: Quotation Features & Workflow

### Save & Draft Management
- [ ] Add save draft functionality
  - Save quotation in "Borrador" (Draft) state
  - Resume editing drafts
  - Track draft creation/modification dates
- [ ] Implement draft vs. finalized quotations
  - Allow edits on drafts only
  - Version control for quotes

### Line Item Details
- [ ] Add comments/notes field to quote line items
  - Special instructions per item
  - Client-facing notes vs. internal notes
- [ ] Quantity selector for items
  - Show only when item type supports quantities
  - Validate min/max quantities
  - Calculate subtotals based on quantity

### Product Quote Button
- [ ] Add "Cotizar Producto Nuevo" (Quote New Product) button
  - Quick add items to existing quote
  - Search/select from catalog
  - Pre-fill pricing based on rules
  - Immediate calculation & update

---

## Phase 3: Pricing & Calculation

### Cost Calculation
- [ ] Implement cost-per-pax logic
  - Calculate: quantity × pax × cost_per_pax
  - Handle fixed costs vs. variable costs
  - Day-by-day cost breakdown
- [ ] Integrate pricing rules with quotations
  - Use PricingRule formula from new pricing engine
  - Support all formula types: fixed, pax, time, mixed, complex
- [ ] Constraint logic
  - Min/max pax per item
  - Min/max duration constraints
  - Item compatibility rules (can't select X with Y)
  - Business rule enforcement

---

## Phase 4: Output & Formatting

### Quote Output Format
- [ ] Fix quote output format
  - Professional PDF layout
  - Clear pricing breakdown
  - Summary vs. detailed view
  - Client-friendly vs. internal format
- [ ] Improve Google Sheet layout
  - Better organization of columns
  - Cleaner data entry
  - Improved readability
  - Proper table headers & formatting

### Reports & Visibility
- [ ] Daily breakdown view
  - Show costs per day
  - Pax per day summary
  - Timeline visualization
- [ ] Pricing summary
  - Subtotals per category
  - Taxes & discounts
  - Grand total

---

## Phase 5: Audit & History

### Change Tracking
- [ ] Implement history/audit log (Historizador)
  - Track all changes to quotes
  - Who changed what, when
  - Before/after values
  - Reason for change (optional comment)
- [ ] Version control for quotations
  - Keep previous versions
  - Restore previous versions
  - Compare versions side-by-side

---

## Architecture Changes Needed

### Database Schema Updates
- [ ] Add columns to ITEM_CATALOGO:
  - `Categoria_Tipo` (Servicio/Salón/Producto)
  - `Permite_Cantidad` (show quantity selector?)
  - `Permite_Pax` (item has pax or not?)
  - `Minimo_Pax`, `Maximo_Pax`
  - `Minimo_Unidades`, `Maximo_Unidades`
  - `Detalle_Especifico` (category-specific details JSON)

- [ ] Update DETALLE_COTIZACION:
  - Add `Comentarios` field
  - Add `Pax_Aplicado` (actual pax used)
  - Add `Cantidad_Aplicada` (actual quantity used)
  - Add `Hora_Inicio`, `Hora_Termino`
  - Add `Dia` (for multi-day events)
  - Add `Detalle_Item` (specific details for this quote line)

- [ ] Create HISTORIAL_COTIZACION table:
  - `ID_Cotizacion`
  - `Timestamp`
  - `Usuario`
  - `Campo_Cambio` (what field changed)
  - `Valor_Anterior`
  - `Valor_Nuevo`
  - `Comentario`

- [ ] Create RESTRICCIONES table:
  - `ID_Restriccion`
  - `Tipo` (pax_range, duration_range, incompatibility, etc.)
  - `Item_1`, `Item_2` (affected items)
  - `Condicion` (rule description)
  - `Activa` (boolean)

### Code Structure Updates
- [ ] Enhance Models.js with new properties
- [ ] Add constraint validation logic
- [ ] Add audit/history logging to Controllers
- [ ] Improve Controllers.js for draft management
- [ ] Add category-specific logic to CatalogItem

### UI/Frontend Changes (When Applicable)
- [ ] Time format display (24-hour)
- [ ] Duration selector redesign
- [ ] Quantity selector component
- [ ] Add comment field to line items
- [ ] Add "New Product" button
- [ ] Daily breakdown view
- [ ] History/audit log view

---

## Implementation Suggested Order

1. **First**: Update data model (schema changes)
   - Add new columns to sheets
   - Create new tables
   - Document field purposes

2. **Second**: Core pax & quantity logic
   - Implement pax calculation from passengers
   - Implement quantity selectors
   - Validate constraints

3. **Third**: Quotation workflow
   - Save drafts
   - Add line item details
   - Comments functionality

4. **Fourth**: Pricing & calculations
   - Integrate pricing rules
   - Calculate costs correctly
   - Handle multi-day scenarios

5. **Fifth**: Output & formatting
   - Professional quote format
   - Improve sheet layout
   - Daily breakdown reports

6. **Last**: Audit & history
   - Implement audit logging
   - Version control
   - History tracking

---

## Questions to Clarify

Before implementing:

1. **Pax Logic**: Is pax:
   - Per day (e.g., 50 pax/day for 3 days = 150 total)?
   - Fixed for entire event (100 pax for 3 days)?
   - Varies by day?

2. **Item Categories**: For each category (Servicio/Salón/Producto):
   - What are category-specific required fields?
   - Should quantity selector appear for all or specific categories?
   - What constraints apply to each?

3. **Multi-day Events**:
   - How are costs calculated across days?
   - Can items be on specific days or all days?
   - Should pax/quantity vary by day?

4. **Pricing Formula**:
   - Should use new PricingEngine (PricingRule + CatalogItem)?
   - Or keep current Item.getCatalogo() logic?
   - How to handle cost-per-pax?

5. **Output Format**:
   - PDF or HTML?
   - What sections should quote include?
   - Client signature needed?

6. **Constraints**:
   - Hard constraints (prevent invalid combos)?
   - Soft warnings (allow but alert)?
   - Business rules priority?
