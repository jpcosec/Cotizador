# Implementation Roadmap: SF Lodge Cotizador v2

**Reference Documents**:
- `db_docs.md` - Data dictionary (v2 schema)
- `PRICING_AND_CONSTRAINTS_v2.md` - Pricing engine and constraint validator
- `composition_logic.md` - Kit/bundle composition system
- `discount-bundles-engine-design-v2-1.md` - Discount rules engine
- `quotation-pipeline-flow.md` - Complete 4-phase processing pipeline
- `technical-design-v2-modular-architecture.md` - Repository pattern architecture
- `CURRENT_STATE_&_NEXT_TASKS.md` - Current gaps analysis

> Note: this roadmap targets v2. For current pipeline sequencing use `docs/quotation-pipeline-flow-v3.md`.

**Status**: Ready to implement v2 design

---

## 📋 V2 Design Summary (What We're Building)

### New Pricing Formula System
```
REGLA_PRECIO (Pricing Rules)
├─ ID_Regla (PK)
├─ Nombre_Formula
├─ Costo_Base_Fijo
├─ Costo_Unitario_Pax
├─ Costo_Unitario_Tiempo (per hour)
├─ Costo_Unitario_Item
└─ Formula_Legible

Formula: Total = Base + (Pax × UnitPax) + (Hours × UnitTime) + (Items × UnitItem)
```

### Smart Item Catalog
```
ITEM_CATALOGO (replaces old ITEMS)
├─ ID_Item (PK)
├─ Nombre
├─ Categoria
├─ ID_Regla (FK → REGLA_PRECIO)
├─ Permite_Override_Pax (editable per line)
├─ Duracion_Default_Min
└─ Activo

COMPOSICION_KIT (optional, for complex items)
├─ ID_Composicion (PK)
├─ ID_Item_Padre (FK)
├─ Recurso_Hijo
├─ Cantidad_Base
└─ Dimension (POR_PAX | FIJO | POR_HORA)
```

### Constraint/Validation System
```
RESTRICCION (Business rules)
├─ ID_Restriccion (PK)
├─ ID_Item (FK)
├─ Tipo (MIN_PAX | MAX_PAX | REQUIERE | EXCLUYE | MIN_HORAS)
├─ Valor
└─ Mensaje_Error
```

### Enhanced Quote Management
```
COTIZACION (Quote header - UPDATED)
├─ ID_Cotizacion
├─ ID_Cliente
├─ Fecha_Emision
├─ Fecha_Evento (NEW - event start date)
├─ Pax_Global (NEW - event attendees)
├─ Duracion_Dias (NEW - explicit)
├─ Estado (Borrador | Guardada | Enviada | Aprobada)
├─ Total_Neto
├─ Total_IVA (NEW)
├─ Total_Final (NEW)
├─ Link_PDF
└─ Notas

LINEA_DETALLE (Line items - UPDATED, renamed from DETALLE_COTIZACION)
├─ ID_Linea (PK)
├─ ID_Cotizacion (FK)
├─ ID_Item (FK) - now references ITEM_CATALOGO properly
├─ Dia (NEW - day 1, 2, 3...)
├─ Hora (NEW - 24-hour format HH:MM)
├─ Input_Pax (NEW - per-line pax, can override Pax_Global)
├─ Input_Unidades (NEW - quantity of items)
├─ Input_Duracion_Min (NEW - duration override)
├─ Config_Override_JSON (NEW - modified composition if needed)
├─ Comentarios (NEW - special instructions)
├─ Precio_Unitario_Calc (calculated by formula)
└─ Precio_Total_Linea (final price)
```

---

## 🎯 Implementation Phases

### PHASE 1: Schema & Data Model Migration (1-2 weeks)

**1.1: Update Google Sheet Structure**
```
Priority: 🔴 CRITICAL
Duration: 2-3 days
Tasks:
  [ ] Create REGLA_PRECIO table in Google Sheet
      - Add 7 rows of test pricing rules
      - Examples: Fixed, PerPax, PerHour, Mixed
  [ ] Create new ITEM_CATALOGO table
      - Migrate items from old ITEMS table
      - Add ID_Regla references
      - Add new fields: Permite_Override_Pax, Duracion_Default_Min
  [ ] Create RESTRICCION table
      - Add MIN_PAX, MAX_PAX constraint examples
  [ ] Update COTIZACION table
      - Add: Fecha_Evento, Pax_Global, Duracion_Dias, Total_IVA, Total_Final
      - Remove or deprecate: Cant_Personas
  [ ] Rename DETALLE_COTIZACION → LINEA_DETALLE
      - Add: Dia, Hora, Input_Pax, Input_Unidades, Input_Duracion_Min
      - Add: Config_Override_JSON, Comentarios
      - Update: Precio_Unitario_Calc, Precio_Total_Linea
  [ ] Keep old tables for migration reference (can delete later)

Deliverable: New Google Sheet structure matching ER diagram
```

**1.2: Update Models.js to Match v2 Schema**
```
Priority: 🔴 CRITICAL
Duration: 2-3 days
Tasks:
  [ ] Update Cotizacion model:
      - Change: Cant_Personas → Pax_Global
      - Add: Fecha_Evento, Duracion_Dias
      - Add: Total_IVA, Total_Final calculation
      - Update: estado values (Borrador, Guardada, Enviada, Aprobada)
      - Update: getConDetalle() to return new structure
  [ ] Update DetalleCotizacion model (rename to LineaDetalle):
      - Change: all field names to match LINEA_DETALLE
      - Add: Dia, Hora, Input_Pax, Input_Unidades, Input_Duracion_Min
      - Add: Config_Override_JSON, Comentarios
  [ ] Create PricingRule model:
      - Map to REGLA_PRECIO table
      - Implement calculate(pax, hours, items) method
      - Implement formula validation
  [ ] Create Item model:
      - Map to ITEM_CATALOGO table
      - Link to PricingRule
      - Handle Permite_Override_Pax flag
  [ ] Create Restriction model:
      - Map to RESTRICCION table
      - Implement validation logic

Deliverable: Updated Models.js matching v2 schema
```

**1.3: Update Controllers for v2 Logic**
```
Priority: 🔴 CRITICAL
Duration: 2-3 days
Tasks:
  [ ] Rewrite servicioGuardarCotizacion():
      - Accept: Pax_Global, Fecha_Evento, Duracion_Dias
      - For each line item:
        • Resolve Input_Pax (use global or item override)
        • Resolve Input_Duracion_Min (use default or override)
        • Get REGLA_PRECIO
        • Calculate: Precio_Unitario_Calc via formula
        • Calculate: Precio_Total_Linea = UnitCalc × Input_Unidades
      - Calculate: Total_Neto (sum all lines)
      - Calculate: Total_IVA = Neto × 0.19
      - Calculate: Total_Final = Neto + IVA
      - Save to COTIZACION + LINEA_DETALLE
  [ ] Rewrite servicioCargarCotizacion():
      - Load quote with new fields
      - Recalculate prices (for validation)
      - Return sorted by Dia, Hora
      - Show daily breakdowns
  [ ] Add constraint validation:
      - Check RESTRICCION before saving
      - Return constraint violations with messages
      - Allow override (with warning)?

Deliverable: Updated Controller_Cotizacion.js with v2 logic
```

**1.4: Create PricingEngine Integration**
```
Priority: 🔴 CRITICAL
Duration: 1-2 days
Tasks:
  [ ] Integrate PricingRule class (from Classes_Core.js)
      - Use in Controllers for calculations
      - Verify formula: Base + (Pax × UnitPax) + (Hours × UnitTime) + (Items × UnitItem)
  [ ] Create PricingCalculator utility:
      - Encapsulate formula logic
      - Handle edge cases (0 pax, 0 hours, etc.)
      - Round to nearest 1 (no decimals)
  [ ] Update servicioGuardarCotizacion to use PricingEngine
      - Load REGLA_PRECIO
      - Execute formula per line
      - Store results

Deliverable: PricingEngine integrated and tested
```

**1.5: Data Migration & Testing**
```
Priority: 🔴 CRITICAL
Duration: 2-3 days
Tasks:
  [ ] Create migration script (manual or automated):
      - Map old ITEMS → new ITEM_CATALOGO
      - Create REGLA_PRECIO rules from old pricing logic
      - Test migration integrity
  [ ] Comprehensive testing:
      - Test each REGLA_PRECIO type (Fixed, PerPax, PerHour, Mixed)
      - Test per-line pax override
      - Test per-line duration override
      - Test constraint validation
      - Test calculation accuracy (manual verification)
      - Test daily breakdown
      - Test IVA calculation
  [ ] Validation:
      - Compare old vs new pricing for same items
      - Verify no data loss
      - Check formula accuracy

Deliverable: Migration complete, all tests passing
```

---

### PHASE 2: Enhanced Features (3-4 days)

**2.1: Draft Management Workflow**
```
Priority: 🟡 HIGH
Duration: 1-2 days
Tasks:
  [ ] Proper Borrador state:
      - Create in "Borrador" (not "Guardada")
      - Save changes within same draft
      - Track creation/update timestamps
  [ ] Draft to final transition:
      - Borrador → Enviada (send to client)
      - Enviada → Aprobada (client approval)
      - Aprobada → finalized (read-only)
  [ ] Allow "reopen draft":
      - Enviada can revert to Borrador for changes
      - Aprobada might not allow reopening

Deliverable: Draft workflow implemented
```

**2.2: Constraint Validation**
```
Priority: 🟡 HIGH
Duration: 1-2 days
Tasks:
  [ ] Implement ConstraintValidator:
      - Load RESTRICCION rules
      - Validate quote before saving:
        • MIN_PAX: Input_Pax >= Valor
        • MAX_PAX: Input_Pax <= Valor
        • REQUIERE: If ItemA selected, ItemB must be too
        • EXCLUYE: ItemA and ItemB cannot be together
        • MIN_HORAS: Input_Duracion_Min >= Valor
      - Return violations with messages
  [ ] Add constraint enforcement:
      - Check before save (prevent invalid quotes)
      - Show warnings to user (soft constraints?)
      - Allow override (with audit trail)

Deliverable: Constraint system working
```

**2.3: Line Item Comments & Details**
```
Priority: 🟡 MEDIUM
Duration: 0.5 days
Tasks:
  [ ] Comentarios field already in schema
      - Save special instructions per line
      - Display in quote summary
      - Include in PDF
  [ ] Config_Override_JSON for complex items:
      - Allow modification of compositions
      - Store in LINEA_DETALLE
      - Use in price calculation if needed

Deliverable: Comments working end-to-end
```

---

### PHASE 3: Output & Reporting (3-4 days)

**3.1: Daily Breakdown**
```
Priority: 🟡 MEDIUM
Duration: 1-2 days
Tasks:
  [ ] Create DailyBreakdown utility:
      - Group LINEA_DETALLE by Dia
      - Calculate daily subtotals
      - Show items per day with times
      - Timeline view (Hora column)
  [ ] servicioObtenerResumenDiario(ID_Cotizacion):
      - Return day-by-day breakdown
      - Include start times, durations
      - Calculate daily totals

Deliverable: Daily breakdowns available
```

**3.2: Professional Quotation Output**
```
Priority: 🟡 MEDIUM
Duration: 2-3 days
Tasks:
  [ ] Create QuoteFormatter utility:
      - Header: Company, client, dates
      - Daily breakdown section
      - Item details with specifications
      - Pricing summary (subtotal, IVA, total)
      - Terms & conditions
      - Signature line (optional)
  [ ] Generate PDF:
      - Use existing PDF generation (if available)
      - Or implement HTML → PDF
  [ ] Add quote preview:
      - Before sending, show formatted view
      - Editable with live refresh

Deliverable: Professional PDF quotes
```

---

### PHASE 4: Quality & Audit (2-3 days)

**4.1: Audit Trail (Historizador)**
```
Priority: 🟢 LOW (but production-important)
Duration: 1-2 days
Tasks:
  [ ] Create HISTORIAL_COTIZACION table:
      - ID, ID_Cotizacion, Timestamp, Usuario, Campo_Cambio
      - Valor_Anterior, Valor_Nuevo, Accion, Comentario
  [ ] Create HistoryLogger utility:
      - Log all quote changes
      - Track field-level changes
      - Include who, when, what changed
  [ ] Integration:
      - Log in servicioGuardarCotizacion
      - Log in constraint overrides
      - Log in state transitions (Borrador → Enviada, etc.)
  [ ] Retrieval:
      - servicioObtenerHistorial(ID_Cotizacion)
      - Return changes chronologically

Deliverable: Full audit trail working
```

---

## ✅ Success Criteria by Phase

### Phase 1 (Schema & Model)
- [ ] New Google Sheet structure matches ER diagram
- [ ] All models updated and tested
- [ ] Controllers working with v2 schema
- [ ] All pricing formulas calculate correctly
- [ ] Data migrated from v1 to v2
- [ ] No data loss in migration
- [ ] All tests passing (5+ scenarios per rule type)

### Phase 2 (Features)
- [ ] Draft workflow: create → save → send → approve
- [ ] Constraints validated before save
- [ ] Invalid quotes rejected with messages
- [ ] Comments saved and loaded per line
- [ ] All tests passing

### Phase 3 (Output)
- [ ] Daily breakdowns accurate
- [ ] PDF output professional and complete
- [ ] Quote preview working
- [ ] All calculations verified manually

### Phase 4 (Audit)
- [ ] History table tracking all changes
- [ ] Can retrieve change history
- [ ] Timestamps and user info logged

---

## 🗓️ Timeline Estimate

| Phase | Tasks | Effort | Start | End |
|-------|-------|--------|-------|-----|
| 1 | Schema, Models, Controllers, Integration | 1-2 weeks | Week 1 | Week 2 |
| 2 | Drafts, Constraints, Comments | 3-4 days | Week 3 | Week 3 |
| 3 | Daily breakdown, PDF, Output | 3-4 days | Week 3-4 | Week 4 |
| 4 | Audit trail | 2-3 days | Week 4 | Week 4 |
| **Total** | | **~4-5 weeks** | | |

---

## 🚀 Next Step

**Start with Phase 1, Task 1.1**: Update Google Sheet structure to match v2 ER diagram.

Once the sheet is ready with new tables and columns, everything else builds on that foundation.

All design specifications are documented in the `docs/` folder. See `README.md` for a reading guide.
