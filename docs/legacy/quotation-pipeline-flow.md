# Quotation Pipeline Flow: Complete Architecture

**Version:** 2.1
**Status:** Technical Definition
**Purpose:** Document the complete processing pipeline that transforms a raw item selection into a validated quotation line.

> Note: This is the legacy v2.1 flow. For the current orchestrator sequence with cascade defaults, flexible taxes, and v3 overrides, see `docs/quotation-pipeline-flow-v3.md`.

---

## Overview: The Assembly Line Model

The quotation system works like an assembly line:
- **Input:** Raw item selected by user (e.g., user clicks "MENU-GOLD")
- **Output:** Validated quotation line with all calculations, validations, and audit trails complete

The pipeline has **4 distinct phases**, executed in strict order. Each phase has a specific purpose and cannot be reordered.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER SELECTS ITEM (e.g., MENU-GOLD)                                   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                      ┌────────▼────────┐
                      │ PHASE 1:        │
                      │ EXPANSION       │ (Composition)
                      │ "What is this?" │
                      └────────┬────────┘
                               │ Explodes composite items into components
                               │
                      ┌────────▼────────┐
                      │ PHASE 2:        │
                      │ VALUATION       │ (Pricing Engine)
                      │ "How much?"     │
                      └────────┬────────┘
                               │ Calculates price for each component
                               │
                      ┌────────▼────────┐
                      │ PHASE 3:        │
                      │ ADJUSTMENT      │ (Discount Engine)
                      │ "Deserves a     │
                      │  reward?"       │
                      └────────┬────────┘
                               │ Applies promotional discounts
                               │
                      ┌────────▼────────┐
                      │ PHASE 4:        │
                      │ AUDIT           │ (Constraint Validator)
                      │ "Is this       │
                      │  legal?"        │
                      └────────┬────────┘
                               │ Validates business rules
                               │
                      ┌────────▼────────────────────┐
                      │ VALIDATED QUOTATION LINE    │
                      │ (Ready to save to database) │
                      └─────────────────────────────┘
```

---

## Phase 1: Expansion (Composition Engine)

**Question:** "What is this really?"

**Purpose:** Resolve hierarchical item structures. A user selects a single item that might be a container (bundle, kit, menu) for multiple sub-items.

### Input
User selection: Single item ID (e.g., `MENU-GOLD`)

### Process

```javascript
// Pseudocode for Phase 1
function expandItem(itemId, composicionRepo) {
  const expanded = [];

  // 1. Add the parent item itself
  expanded.push({
    ID_Item: itemId,
    Nivel: 'PADRE',
    Cantidad: 1
  });

  // 2. Query COMPOSICION table: "Does this item have children?"
  const hijos = composicionRepo.getChildren(itemId);

  // 3. If children exist, recursively expand each (supports nested kits)
  hijos.forEach(hijo => {
    const hijosExpandidos = expandItem(hijo.ID_Item_Hijo, composicionRepo);
    expanded.push(...hijosExpandidos);
  });

  return expanded;
}
```

### Example Expansion

**Input:**
```
User selects: MENU-GOLD
```

**COMPOSICION table lookups:**
```
MENU-GOLD (parent)
├─ ENTRADA-CLASICA (child, cantidad=1)
├─ LOMO-VETADO (child, cantidad=1)
└─ POSTRE-GOURMET (child, cantidad=1)
```

**Output:** List of 4 items in memory
```
[
  { ID_Item: 'MENU-GOLD', Nivel: 'PADRE' },
  { ID_Item: 'ENTRADA-CLASICA', Nivel: 'HIJO', Cantidad: 1 },
  { ID_Item: 'LOMO-VETADO', Nivel: 'HIJO', Cantidad: 1 },
  { ID_Item: 'POSTRE-GOURMET', Nivel: 'HIJO', Cantidad: 1 }
]
```

### Key Characteristics

- **Recursive:** Supports nested kits (kit inside kit inside kit).
- **Protective:** Must detect cycles to prevent infinite loops (A→B→A).
- **Quantity Multipliers:** If a kit contains 4 speakers and you buy 2 kits, multiply: 4 × 2 = 8 speakers reserved.

---

## Phase 2: Valuation (Pricing Engine)

**Question:** "How much does each part cost?"

**Purpose:** Calculate the unit price and line subtotal for each item using the pricing rules.

### Input
Expanded list of items from Phase 1

### Process

```javascript
// Pseudocode for Phase 2
function calculatePrices(expandedItems, pricingRepo, context) {
  const valorizado = [];

  expandedItems.forEach(item => {
    // 1. Look up the item's pricing rule
    const regla = pricingRepo.findRule(item.ID_Item);

    // 2. Build calculation context (resolve priority chain)
    const pax = item.Input_Pax || context.Pax_Global;
    const duracion = item.Input_Duracion || context.Duracion_Evento;
    const cantidad = item.Input_Cantidad || 1;

    // 3. Apply universal formula: Base + (Pax × Cost_Pax) + (Duracion × Cost_Duracion) + ...
    const precioUnitario = (regla.Base || 0) +
                           (pax * (regla.Costo_Unitario_Pax || 0)) +
                           (duracion * (regla.Costo_Unitario_Tiempo || 0)) +
                           (cantidad * (regla.Costo_Unitario_Item || 0));

    // 4. Calculate line subtotal
    const precioTotal = precioUnitario * (item.Cantidad || 1);

    valorizado.push({
      ID_Item: item.ID_Item,
      Precio_Unitario_Calculado: precioUnitario,
      Precio_Total_Linea: precioTotal,
      Contexto: { pax, duracion, cantidad }
    });
  });

  return valorizado;
}
```

### Example Valuation

**Input:** Expanded list of 4 items + context { Pax_Global: 100 }

**REGLA_PRECIO lookups:**
```
MENU-GOLD         → Regla "COSTO-CERO" → Base=$0, Cp=0, Ct=0, Cq=0 → $0
ENTRADA-CLASICA   → Regla "LISTA-APROX" → Base=0, Cp=$5.000 → $5.000 × 100 = $500.000
LOMO-VETADO       → Regla "PREMIUM"     → Base=0, Cp=$15.000 → $15.000 × 100 = $1.500.000
POSTRE-GOURMET    → Regla "LISTA-APROX" → Base=0, Cp=$5.000 → $5.000 × 100 = $500.000
```

**Output:** Valorized list
```
[
  { ID_Item: 'MENU-GOLD', Precio_Unitario: $0, Precio_Total_Linea: $0 },
  { ID_Item: 'ENTRADA-CLASICA', Precio_Unitario: $5.000, Precio_Total_Linea: $500.000 },
  { ID_Item: 'LOMO-VETADO', Precio_Unitario: $15.000, Precio_Total_Linea: $1.500.000 },
  { ID_Item: 'POSTRE-GOURMET', Precio_Unitario: $5.000, Precio_Total_Linea: $500.000 }
]

Subtotal: $2.500.000
```

### Key Characteristics

- **Universal Formula:** One formula handles all pricing strategies (fixed, pax-based, time-based, mixed, complex).
- **Context Priority Chain:** Item-level overrides trump quotation-level defaults.
- **No Discount Logic Here:** Prices are calculated independently; discounts are separate concern.

---

## Phase 3: Adjustment (Discount Engine)

**Question:** "Does this deserve a reward?"

**Purpose:** Apply promotional or contractual discounts. Adds negative-value lines without modifying original item prices.

### Input
Valorized list from Phase 2 (with all unit prices calculated)

### Process

```javascript
// Pseudocode for Phase 3
function applyDiscounts(valorizadoList, discountRepo, context) {
  const conDescuentos = [...valorizadoList];
  const descuentosAplicados = [];

  // 1. Fetch all active discount rules
  const reglas = discountRepo.getAll();

  reglas.forEach(regla => {
    // 2. Check if the trigger item exists in the list
    const itemGatillador = valorizadoList.find(l => l.ID_Item === regla.Trigger_Item);

    if (!itemGatillador) return; // Rule doesn't apply

    // 3. Validate cumulability
    if (!regla.Acumulable && descuentosAplicados.length > 0) {
      return; // Can't combine this with other non-cumulative discounts
    }

    // 4. Calculate discount amount
    let montoDescuento = 0;

    if (regla.Tipo_Calculo === 'POR_PAX') {
      const pax = itemGatillador.Contexto.pax;
      montoDescuento = regla.Valor * pax;
    } else if (regla.Tipo_Calculo === 'FIJO') {
      montoDescuento = regla.Valor;
    } else if (regla.Tipo_Calculo === 'PORCENTAJE') {
      // Calculate current subtotal from positive-price items
      const subtotal = conDescuentos
        .filter(l => l.Precio_Total_Linea > 0)
        .reduce((sum, l) => sum + l.Precio_Total_Linea, 0);
      montoDescuento = (subtotal * regla.Valor) / 100;
    }

    // 5. Add negative line for discount
    if (montoDescuento > 0) {
      conDescuentos.push({
        ID_Item: 'DESC-AUTO',
        Nombre: regla.Nombre,
        Precio_Total_Linea: -montoDescuento, // NEGATIVE
        Es_Descuento: true,
        ID_Regla_Descuento: regla.ID_Descuento
      });

      descuentosAplicados.push(regla.ID_Descuento);
    }
  });

  return conDescuentos;
}
```

### Example Adjustment

**Input:** Valorized list with subtotal $2.500.000

**REGLAS_DESCUENTO lookup:**
```
Trigger: MENU-GOLD exists? YES
Regla: DESC-MENU-GOLD
  Tipo: POR_PAX
  Valor: $2.000
  Acumulable: false
```

**Calculation:**
```
Descuento = $2.000 × 100 pax = $200.000
```

**Output:** List with discount line added
```
[
  ... (same 4 items from Phase 2)
  { ID_Item: 'DESC-AUTO', Nombre: 'Gold Pack Discount', Precio_Total_Linea: -$200.000 }
]

New Total: $2.500.000 - $200.000 = $2.300.000
```

### Key Characteristics

- **Non-Destructive:** Original item prices stay unchanged (transparency for margin analysis).
- **Separate Lines:** Each discount visible as distinct line (auditing clarity).
- **Pattern-Based:** Looks for triggers in cart, not hardcoded per customer.

---

## Phase 4: Audit (Constraint Validator)

**Question:** "Is this legal?"

**Purpose:** Validate that the quotation complies with all business rules before allowing save.

### Input
Complete quotation with prices and discounts from Phase 3

### Process

```javascript
// Pseudocode for Phase 4
function validateConstraints(cotizacion, constraintRepo) {
  const errores = [];
  const warnings = [];

  // 1. Fetch all active constraint rules
  const reglas = constraintRepo.getAll();

  reglas.forEach(regla => {
    // 2. Identify affected items
    const itemsAfectados = cotizacion.lineas.filter(l =>
      l.ID_Item === regla.Item_Trigger || regla.Item_Trigger === '*'
    );

    if (itemsAfectados.length === 0) return;

    // 3. Validate based on constraint type
    itemsAfectados.forEach(linea => {
      if (regla.Tipo === 'MIN_PAX') {
        const pax = linea.Contexto?.pax || cotizacion.Pax_Global;
        if (pax < regla.Valor) {
          const err = {
            nivel: regla.Severidad, // 'ERROR' or 'WARNING'
            msg: `Item "${linea.Nombre}" requires minimum ${regla.Valor} pax.`
          };
          if (regla.Severidad === 'ERROR') errores.push(err);
          else warnings.push(err);
        }
      }

      if (regla.Tipo === 'REQUIERE') {
        const targetExists = cotizacion.lineas.some(l => l.ID_Item === regla.Item_Target);
        if (!targetExists) {
          const err = {
            nivel: regla.Severidad,
            msg: `If you select "${linea.Nombre}", you must also select "${regla.Item_Target_Nombre}".`
          };
          if (regla.Severidad === 'ERROR') errores.push(err);
          else warnings.push(err);
        }
      }

      if (regla.Tipo === 'EXCLUYE') {
        const conflictExists = cotizacion.lineas.some(l => l.ID_Item === regla.Item_Target);
        if (conflictExists) {
          const err = {
            nivel: regla.Severidad,
            msg: `Cannot select "${linea.Nombre}" together with "${regla.Item_Target_Nombre}".`
          };
          if (regla.Severidad === 'ERROR') errores.push(err);
          else warnings.push(err);
        }
      }

      if (regla.Tipo === 'MIN_VENTA') {
        const totalNeto = cotizacion.lineas
          .reduce((sum, l) => sum + l.Precio_Total_Linea, 0);
        if (totalNeto < regla.Valor) {
          const err = {
            nivel: regla.Severidad,
            msg: `Minimum sale amount is $${regla.Valor}. Current: $${totalNeto}.`
          };
          if (regla.Severidad === 'ERROR') errores.push(err);
          else warnings.push(err);
        }
      }
    });
  });

  return { errores, warnings };
}
```

### Example Audit

**Input:** Complete quotation with 5 lines (items + discount), Total=$2.300.000

**RESTRICCIONES lookups:**
```
Regla 1: MENU-GOLD requires MIN_PAX=50
  Check: Actual pax = 100 ✓ PASS

Regla 2: Any quotation requires MIN_VENTA=$500.000
  Check: Total = $2.300.000 ✓ PASS

Regla 3: Can't combine DJ-A with DJ-B
  Check: Neither selected ✓ PASS
```

**Output:**
```
{
  errores: [],
  warnings: []
}
Status: VALID → Can save
```

### Key Characteristics

- **Executed Last:** Validates the final result, not intermediate states.
- **Severity Levels:** ERROR blocks save, WARNING allows with notification.
- **All-or-Nothing:** If validation fails, quotation doesn't save at all.

---

## Why This Order Is Critical

### ❌ Wrong Order Would Break:

**If we valued before expanding:**
```
Can't calculate "MENU-GOLD" price without knowing its components exist.
Result: $0 or broken calculation.
```

**If we discounted before valuing:**
```
Discount might be "10% of total", but we don't have the total yet.
Result: Wrong math or circular dependency.
```

**If we audited before discounting:**
```
Constraint: "Minimum sale must be $500.000"
Without discounts: $2.500.000 ✓ passes
With discounts: $2.300.000 → fails?
Result: Unpredictable behavior, audit fails at wrong point.
```

### ✓ Correct Order Guarantees:

1. **Composición primero:** We know what components exist before pricing them.
2. **Precio antes de Descuento:** We have the full subtotal needed for percentage discounts.
3. **Descuentos antes de Auditoría:** Validation checks against final real price, not intermediate.

---

## Service Architecture

This pipeline is implemented across four **independent, focused services**:

```
┌────────────────────────────────────────────────────────────────┐
│ Controller_Quotation.js (Orchestrator)                         │
│                                                                │
│  1. Calls Srv_Composition.expandItems()                       │
│  2. Calls Srv_Pricing.calculatePrices()                       │
│  3. Calls Srv_Discount.applyDiscounts()                       │
│  4. Calls Srv_Constraint.validate()                           │
│  5. If all pass: saves to DB                                  │
│  6. Else: returns errors to user                              │
└────────────────────────────────────────────────────────────────┘
         │
         ├─→ Srv_Composition.js
         │   └─ Uses: Repo_Composicion (from cache)
         │
         ├─→ Srv_Pricing.js
         │   └─ Uses: Repo_ReglasPrecio (from cache)
         │
         ├─→ Srv_Discount.js
         │   └─ Uses: Repo_Descuentos (from cache)
         │
         └─→ Srv_Constraint.js
             └─ Uses: Repo_Restricciones (from cache)
```

---

## Data Flow Example (Full Journey)

**Scenario:** Event for 100 people selecting Menu Gold

```
STEP 1: USER INPUT
────────────────────────────────
Input: MENU-GOLD (from UI)
Context: Pax_Global = 100

STEP 2: COMPOSITION EXPANSION
────────────────────────────────
Srv_Composition.expandItems('MENU-GOLD')
  └─ Queries COMPOSICION table
     └─ Returns: [MENU-GOLD, ENTRADA, LOMO, POSTRE]

STEP 3: PRICING VALUATION
────────────────────────────────
Srv_Pricing.calculatePrices([...4 items], { Pax: 100 })
  └─ Queries REGLA_PRECIO for each item
     └─ Calculates:
        MENU-GOLD:     $0
        ENTRADA:       $5.000 × 100 = $500.000
        LOMO:          $15.000 × 100 = $1.500.000
        POSTRE:        $5.000 × 100 = $500.000
        ──────────────────────────────────
        Subtotal:                    $2.500.000

STEP 4: DISCOUNT ADJUSTMENT
────────────────────────────────
Srv_Discount.applyDiscounts([...4 items + subtotal])
  └─ Finds rule: DESC-MENU-GOLD
     └─ Trigger found: MENU-GOLD ✓
        └─ Calculates: $2.000 × 100 = $200.000 discount
           └─ Adds line: "Gold Pack Discount" → -$200.000

New Total: $2.300.000

STEP 5: CONSTRAINT AUDIT
────────────────────────────────
Srv_Constraint.validate({...5 lines, Total: $2.300.000})
  └─ Checks all RESTRICCIONES:
     ✓ MIN_PAX=50: actual=100 → PASS
     ✓ MIN_VENTA=$500k: actual=$2.3M → PASS
     ✓ No conflicts → PASS

Result: [No errors, no warnings]

STEP 6: SAVE
────────────────────────────────
Controller saves to DETALLE_COTIZACION:
  - 5 line items (4 products + 1 discount)
  - All prices locked
  - All validations passed
  - Ready for client PDF export
```

---

## Implementation Principles

1. **Single Responsibility:** Each service does one phase only.
2. **Immutable Flow:** Each phase creates a new data structure; doesn't mutate input.
3. **Fail-Fast:** If any phase fails, pipeline stops (Constraint errors prevent save).
4. **Cacheable Masters:** All lookups use cached master data (no live DB hits per calculation).
5. **Testable:** Each service can be unit-tested in isolation with mocked repos.

---

## Cross References

- **Composition Details:** See `composition_logic.md`
- **Pricing Details:** See `PRICING_AND_CONSTRAINTS_v2.md` (Part 1)
- **Discount Details:** See `discount-bundles-engine-design-v2-1.md`
- **Constraint Details:** See `PRICING_AND_CONSTRAINTS_v2.md` (Part 2)
