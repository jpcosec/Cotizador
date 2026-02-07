# Current State Assessment & Next Tasks Proposal

**Last Updated**: 2026-02-06
**Branch**: master (production)
**Status**: ✅ Working foundation, ready for enhancement

---

## 📊 CURRENT STATE ASSESSMENT

### What Exists (Working)

#### Architecture ✅
- **4-Layer Architecture**: Database → Models → Controllers → Frontend
- **SheetDB**: Micro-ORM for Google Sheets CRUD operations
- **Models**: Cliente, Cotizacion, DetalleCotizacion, Item (basic)
- **Controllers**: servicioGuardarCotizacion(), servicioCargarCotizacion()
- **Database**: 4 tables in Google Sheets (CLIENTES, COTIZACIONES, DETALLE_COTIZACION, ITEMS)

#### Functionality ✅
- Create/save quotations (Borrador → Enviada states)
- Load quotations with smart date calculations
- Client management (create, find, search)
- Basic item catalog with 3-column pricing
- Line item tracking with timestamps
- Customer RUT validation (Chilean format)
- Date formatting (Chilean format)

#### Code Quality ✅
- Clear separation of concerns
- Error handling with try/catch
- Type coercion to prevent NaN errors
- Helper functions (generarID, timestamp, formatFecha, validarRUT)
- Comments in Spanish explaining logic
- Tests.js with some coverage

### What's Missing (Key Gaps)

#### Data Model Gaps ❌
1. **No smart pax logic**
   - Currently: Cant_Personas (single fixed value)
   - Needed: Pax_Global (event default) + per-item pax override
   - Missing: Per-diem pax calculation

2. **No item categorization**
   - Currently: Just "Categoria" string
   - Needed: Service vs. Room vs. Product logic
   - Missing: Category-specific fields & defaults

3. **No item quantities**
   - Currently: Only uses item once
   - Needed: Quantidade selector (show only for items that need it)
   - Missing: Quantity constraints (min/max)

4. **No constraint logic**
   - Missing: Business rule validation
   - Missing: Item incompatibilities
   - Missing: Pax/duration/quantity limits

5. **No multi-day support**
   - Currently: Calculates duration in frontend
   - Needed: Explicit day tracking per item
   - Missing: Daily cost breakdown

6. **No audit trail**
   - Missing: Change history (Historizador)
   - Missing: Version control for quotes
   - Missing: Who changed what, when

#### Feature Gaps ❌
1. **No draft management**
   - Currently: Creates in "Guardada" state
   - Needed: Proper "Borrador" workflow
   - Missing: Resume editing drafts

2. **No line item details/comments**
   - Missing: Special instructions per item
   - Missing: Notes field in DETALLE_COTIZACION
   - Missing: Category-specific details

3. **No "quote new product" feature**
   - Missing: Quick-add items to existing quote
   - Missing: Search/filter items

4. **No output formatting**
   - Missing: Professional PDF layout
   - Missing: Daily breakdown reports
   - Missing: Pricing summaries

5. **No time format improvements**
   - Currently: Flexible timestamp handling
   - Needed: 24-hour format enforcement
   - Missing: Service end time tracking

#### Schema Issues ❌
```
Current ITEM_CATALOGO (from SF_Lodge_v2_DataModel_Plan.md):
  - ID_Item, Nombre, Categoria, ID_Regla, Permite_Override_Pax, Duracion_Default_Min, Activo

Missing columns:
  - Categoria_Tipo (Service/Room/Product)
  - Permite_Cantidad (show qty selector?)
  - Minimo_Pax, Maximo_Pax
  - Minimo_Unidades, Maximo_Unidades
  - Detalle_Especifico (JSON for category details)

Current DETALLE_COTIZACION:
  - ID, ID_Cotizacion, Item, Timestamp_Evento, Cantidad, Precio_Unitario_Aplicado, Total_Linea

Missing columns:
  - Comentarios (special instructions)
  - Pax_Aplicado (actual pax used)
  - Cantidad_Aplicada (actual qty used)
  - Hora_Termino (service end time)
  - Dia (explicit day number)
  - Detalle_Item (category-specific details)

Missing tables:
  - RESTRICCION (business rules)
  - HISTORIAL_COTIZACION (audit log)
  - COMPOSICION_KIT (optional, for complex items)
```

---

## 🎯 NEXT TASKS PROPOSAL

### PHASE 1: Foundation (Critical Path) — 3-4 sprints

**Goal**: Establish correct data model & core logic for pax/quantities/categories

#### Task 1.1: Design Data Model Updates
```
Priority: 🔴 CRITICAL - Blocks everything else
Effort: 1 sprint (3-4 days)
Owner: Design session + user input

Actions:
  [ ] Review existing Google Sheet structure
  [ ] Define Pax logic exactly:
      - Per-day? Fixed? Variable by day?
      - How to calculate from passengers?
  [ ] Define Item Categories:
      - What makes Servicio vs Salón vs Producto?
      - What fields specific to each?
  [ ] Document new schema:
      - Updated columns for ITEM_CATALOGO
      - Updated columns for DETALLE_COTIZACION
      - New RESTRICCION table structure
  [ ] Create Google Sheet with new structure

Deliverables:
  - Document: Data model specification (MD + visuals)
  - Updated Google Sheet (with new columns/tables)
  - Mapping: Old data → new schema
```

#### Task 1.2: Implement Core Pax Logic
```
Priority: 🔴 CRITICAL
Effort: 1-2 sprints (5-7 days)
Owner: Backend changes

Changes:
  [ ] Update Cotizacion model:
      - Add Pax_Global field
      - Add Duracion_Dias field
      - Remove Cant_Personas (or keep for legacy)
  [ ] Update DetalleCotizacion model:
      - Add Pax_Aplicado field
      - Add Dia (day number) field
      - Add Comentarios field
  [ ] Create PaxCalculator utility:
      - Calculate pax per day (if multi-day)
      - Resolve item-specific vs. global pax
      - Handle per-diem logic
  [ ] Update servicioGuardarCotizacion():
      - Receive Pax_Global in header
      - Calculate per-item pax correctly
      - Store Pax_Aplicado per line

Tests:
  [ ] Global pax inherited by items
  [ ] Item-specific pax overrides global
  [ ] Multi-day pax calculation
  [ ] Pax validation (min/max)

Deliverables:
  - Updated Models.js with new fields
  - PaxCalculator.js (new utility)
  - Updated Controller_Cotizacion.js
  - Tests covering pax scenarios
```

#### Task 1.3: Implement Item Categories & Types
```
Priority: 🔴 CRITICAL
Effort: 1-2 sprints (5-7 days)
Owner: Backend changes

Changes:
  [ ] Add Categoria_Tipo to Item model:
      - SERVICIO (time-based: DJ, photographer, etc.)
      - SALON (fixed: venue, main room)
      - PRODUCTO (quantity/pax-based: catering, drinks)
  [ ] Create CategoryHandler utility:
      - Define fields for each category
      - Handle category-specific defaults
      - Manage category-specific validation
  [ ] Update CatalogItem class:
      - Resolve defaults based on category
      - Show/hide quantity selector per category
      - Store category-specific details

Logic by Category:
  SERVICIO:
    - Has Hora_Inicio, Hora_Termino
    - Has Cantidad (# of services)
    - Has Duracion
    - Default quantity: 1
    - Show qty selector: YES
    - Pax applicable: Sometimes (DJ+crowd=more equipment)

  SALON:
    - Fixed (1 venue)
    - Can have multiple "rooms" (Cantidad)
    - Fixed cost or cost varies with pax
    - Default quantity: 1
    - Show qty selector: Only if multiple spaces available
    - Pax applicable: YES (affects room capacity)

  PRODUCTO:
    - Has Cantidad (# of units)
    - Usually cost-per-pax or per-unit
    - Can have servings per unit
    - Default quantity: 0 (user must select)
    - Show qty selector: YES
    - Pax applicable: YES (meals per person)

Deliverables:
  - Updated Item model with Categoria_Tipo
  - CategoryHandler.js (new utility)
  - Category-specific detail fields
  - Tests for each category type
```

### PHASE 2: Extended Features (Next Priority) — 2-3 sprints

**Goal**: Add draft management, comments, improved workflows

#### Task 2.1: Draft Management & Workflow
```
Priority: 🟡 HIGH
Effort: 1 sprint (4-5 days)
Owner: Backend + minimal UI changes

Changes:
  [ ] Update Cotizacion.create():
      - Default to "Borrador" (not "Guardada")
      - Add created/modified timestamps
  [ ] Add Cotizacion.markFinalized():
      - Transition Borrador → sent status
      - Lock editing once finalized
  [ ] Add quote version tracking:
      - Keep history of changes
      - Allow reverting to previous version
  [ ] Update servicioCargarCotizacion():
      - Load draft state information
      - Indicate if quote is editable

Workflow:
  1. User creates quote → Borrador (draft)
  2. User saves changes → updates same draft
  3. User clicks "Send/Finalize" → Borrador → Enviada
  4. Once Enviada → read-only (unless "re-open draft" option)

Deliverables:
  - Updated Controller_Cotizacion.js
  - Draft lifecycle management
  - Tests for draft workflow
```

#### Task 2.2: Line Item Comments & Details
```
Priority: 🟡 HIGH
Effort: 0.5 sprint (2-3 days)
Owner: Backend + minimal UI

Changes:
  [ ] Add Comentarios to DetalleCotizacion
  [ ] Add Detalle_Item (JSON field for category-specific details)
  [ ] Update DetalleCotizacion.insertBatch():
      - Accept comments per line
      - Store category details
  [ ] Update servicioCargarCotizacion():
      - Return comments for each line
      - Return category-specific details

Deliverables:
  - Updated Models.js
  - Enhanced line item schema
  - Tests for comments storage
```

#### Task 2.3: "Quote New Product" Feature
```
Priority: 🟡 MEDIUM
Effort: 0.5 sprint (2-3 days)
Owner: Minimal code (mostly UI)

Changes:
  [ ] Create servicioAgregarItemACotizacion():
      - Takes: quotationId, itemId, pax, cantidad, comentarios
      - Adds item to existing quote
      - Recalculates totals
      - Returns updated quote
  [ ] Add validation:
      - Quote must be in Borrador state
      - Item must exist
      - Pax/cantidad within constraints

Deliverables:
  - New service function
  - Validation logic
  - Tests for adding items to existing quotes
```

### PHASE 3: Time & Output (Polish) — 2-3 sprints

**Goal**: Fix time formats, add reporting, improve output

#### Task 3.1: Time Format & End Time
```
Priority: 🟡 HIGH
Effort: 1 sprint (4-5 days)
Owner: Backend standardization

Changes:
  [ ] Enforce 24-hour format everywhere:
      - Input validation (HH:MM)
      - Output formatting (HH:MM)
      - Internal storage (string HH:MM)
  [ ] Add Hora_Termino to services:
      - Track when service ends
      - Calculate actual duration: Hora_Termino - Hora_Inicio
  [ ] Update timeline calculations:
      - Sort by start time
      - Show gaps/overlaps
      - Calculate total hours per day

Deliverables:
  - TimeFormatter utility (with 24-hr validation)
  - Updated schemas
  - Tests for time operations
```

#### Task 3.2: Daily Breakdown & Reporting
```
Priority: 🟡 MEDIUM
Effort: 1 sprint (4-5 days)
Owner: Calculation + reporting

Changes:
  [ ] Create DailyBreakdown utility:
      - Group items by day
      - Calculate daily subtotals
      - Track daily pax
      - Show daily timeline
  [ ] Create servicioObtenerResumenDiario():
      - Returns day-by-day breakdown
      - Shows costs per day
      - Shows pax per day
      - Shows items per day
  [ ] Create servicioObtenerResumenCostos():
      - Subtotal by category
      - Subtotal by day
      - Taxes & totals
      - Comparison with budget (if applicable)

Deliverables:
  - DailyBreakdown utility
  - Reporting service functions
  - Tests for calculations
```

#### Task 3.3: Output Formatting & PDF
```
Priority: 🟡 MEDIUM
Effort: 1-2 sprints (5-7 days)
Owner: UI/PDF generation (may be frontend heavy)

Changes:
  [ ] Create quote formatting logic:
      - Professional header (company, contact, date)
      - Daily breakdown section
      - Item details with specifications
      - Pricing summary section
      - Terms & conditions
  [ ] Generate PDF output:
      - Use existing PDF generation (if any)
      - Or implement HTML → PDF
  [ ] Create quote preview:
      - Show formatted view before sending
      - Allow edits with live preview

Deliverables:
  - QuoteFormatter utility
  - PDF generation (backend)
  - Quote preview (if UI-based)
```

### PHASE 4: Constraints & Validation (Business Logic) — 1-2 sprints

**Goal**: Enforce business rules

#### Task 4.1: Constraint System
```
Priority: 🟡 MEDIUM
Effort: 1 sprint (4-5 days)
Owner: Backend rules engine

Create RESTRICCION table:
  ID_Restriccion, Tipo, Item_1, Item_2, Valor, Mensaje

Constraint Types:
  - MIN_PAX: "Minimum 10 pax"
  - MAX_PAX: "Maximum 500 pax"
  - REQUIERE: "If Service X, must include Room Y"
  - EXCLUYE: "Cannot combine Service X with Y"
  - MIN_DURACION: "Minimum 2 hours"
  - MAX_DURACION: "Maximum 8 hours"

Changes:
  [ ] Create ConstraintValidator utility:
      - Load restrictions from sheet
      - Check quote against restrictions
      - Return violations + messages
  [ ] Update servicioGuardarCotizacion():
      - Validate constraints before saving
      - Return constraint violations
  [ ] Add ConstraintValidator.check(quote):
      - Called when quote changes
      - Returns: valid (bool) + messages (array)

Deliverables:
  - RESTRICCION table (Google Sheet)
  - ConstraintValidator.js
  - Updated Controllers
  - Tests for constraint validation
```

### PHASE 5: Audit & History (Governance) — 1 sprint

**Goal**: Track all changes

#### Task 5.1: Audit Trail (Historizador)
```
Priority: 🟢 LOW (but important for production)
Effort: 0.5-1 sprint (3-4 days)
Owner: Backend logging

Create HISTORIAL_COTIZACION table:
  ID, ID_Cotizacion, Timestamp, Usuario, Campo_Cambio,
  Valor_Anterior, Valor_Nuevo, Accion, Comentario

Changes:
  [ ] Create HistoryLogger utility:
      - Log all quote changes
      - Track field-level changes
      - Include user info (if available)
  [ ] Update servicioGuardarCotizacion():
      - Log quote creation
      - Log all line item additions
  [ ] Update servicioCargarCotizacion():
      - Log quote access (optional)
  [ ] Create servicioObtenerHistorial():
      - Return change history for a quote
      - Timestamped chronologically

Deliverables:
  - HISTORIAL_COTIZACION table (Google Sheet)
  - HistoryLogger.js
  - Updated Controllers
  - History retrieval service
```

---

## 🚀 RECOMMENDED EXECUTION ORDER

### Sprint 1-2: Critical Foundation (MUST DO)
1. **Task 1.1**: Data model design & schema updates
2. **Task 1.2**: Core pax logic implementation
3. **Task 1.3**: Item categories & types

**Why first**: All other features depend on correct pax/quantity/category logic

**Effort**: 5-7 days of focused work

**Deliverable**: Models working with correct pax/category logic

---

### Sprint 3-4: Essential Features
4. **Task 2.1**: Draft management workflow
5. **Task 3.1**: Time format standardization
6. **Task 2.2**: Line item comments

**Why next**: Improves core quotation workflow

**Effort**: 4-5 days

**Deliverable**: Professional quotation workflow

---

### Sprint 5-6: Polish & Reporting
7. **Task 3.2**: Daily breakdown & reporting
8. **Task 3.3**: Output formatting & PDF
9. **Task 4.1**: Constraint validation

**Why later**: Dependent on earlier features working correctly

**Effort**: 5-7 days

**Deliverable**: Professional reports & constraint enforcement

---

### Sprint 7: Production Hardening
10. **Task 2.3**: "Quote new product" feature
11. **Task 5.1**: Audit trail implementation
12. Testing, debugging, refinement

**Effort**: 3-4 days

**Deliverable**: Production-ready system

---

## 📋 QUESTIONS FOR USER BEFORE STARTING

Before we begin Phase 1, please clarify:

1. **Pax Logic** (Critical - blocks Phase 1)
   ```
   For a 3-day event with 100 pax:
   A) Pax = 100 (same all 3 days)?
   B) Pax = 100/3 per day (distributed)?
   C) Variable by day (e.g., Day1: 50, Day2: 100, Day3: 75)?
   ```

2. **Item Category Defaults**
   ```
   SERVICIO (e.g., DJ):
     - Default quantity: 1 or 0?
     - Show quantity selector always?
     - Should pax affect it (more attendees = more equipment)?

   SALON (e.g., Venue):
     - Can you rent multiple spaces (qty > 1)?
     - Fixed cost or varies with pax?

   PRODUCTO (e.g., Catering):
     - Default quantity: 0 (user must choose)?
     - Always linked to pax?
   ```

3. **Multi-day Events**
   ```
   Should items be:
   A) Available all days by default?
   B) Specific to certain days?
   C) Repeated each day with separate costs?
   ```

4. **Current Google Sheet**
   ```
   Can you share:
   - Screenshot of ITEMS tab (current structure)?
   - Screenshot of COTIZACION tab?
   - DETALLE_COTIZACION structure?
   - Any custom columns you're using?
   ```

5. **Priority**
   ```
   Which matters most:
   A) Correct pax calculations?
   B) Professional output format?
   C) Draft management workflow?
   D) Category-specific details?
   ```

---

## 📈 METRICS & SUCCESS CRITERIA

### Phase 1 Success (Data Model)
- [ ] New pax logic tested with 5+ scenarios
- [ ] Categories working (Service/Room/Product)
- [ ] Quantity logic per category
- [ ] All tests passing
- [ ] Google Sheet updated with new structure

### Phase 2 Success (Features)
- [ ] Draft workflow fully functional
- [ ] Comments saved/loaded correctly
- [ ] Time format consistent (24-hr)
- [ ] Add-item-to-quote feature working

### Phase 3 Success (Polish)
- [ ] Daily breakdown reports accurate
- [ ] PDF output professional
- [ ] Constraint validation prevents invalid quotes
- [ ] All calculations verified against manual examples

### Phase 4 Success (Audit)
- [ ] History log tracks all changes
- [ ] Can retrieve and view change history
- [ ] No data loss on conflicts

---

## 🎯 FINAL RECOMMENDATION

**Start with Phase 1 (Tasks 1.1-1.3)** immediately after clarifying the 5 questions above.

This 1-2 week sprint establishes the correct foundation. Everything after depends on it being right.

Once Phase 1 is done, the system will be significantly more powerful and flexible.

**Estimated Total Timeline**: 4-5 weeks for all 5 phases (with normal interruptions)
