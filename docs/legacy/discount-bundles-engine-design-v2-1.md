# Discount and Bundles Engine Design Document (v2.1)

**Version:** 2.1
**Status:** Technical Definition
**Dependencies:** Requires `PRICING_AND_CONSTRAINTS_v2.md`, `composition_logic.md`
**Purpose:** Specify the algorithm for applying automatic discounts based on patterns detected in the shopping cart.

---

## Concept: Discount Engine

The discount system works analogously to the **ConstraintValidator**. It is a rules engine that observes the cart, searches for patterns (e.g., "Menu Gold exists") and applies a positive consequence (a price reduction).

**Key advantage:** Does not modify individual item prices. Instead, inserts a **negative discount line** that is visible in the final quotation, facilitating audit and accounting.

---

## 1. New Master Entity: REGLAS_DESCUENTO

This table (isMasterData = true) defines the conditions for applying rebates.

| Field | Type | Description |
|-------|------|-------------|
| ID_Descuento | PK | Unique identifier (e.g., `DESC-MENU-GOLD`). |
| Nombre | String | Text that appears on the quotation (e.g., "Wedding Pack Discount"). |
| Trigger_Item | FK | The item that activates the discount (e.g., `MENU-GOLD`). |
| Tipo_Calculo | Enum | `POR_PAX` ($-X per person), `FIJO` ($-X total), `PORCENTAJE` (% of total). |
| Valor | Money | The amount to discount (must be positive, system subtracts it). |
| Condicion_Extra | String | (Optional) Extra logic (e.g., `MIN_PAX_100`). |
| Acumulable | Bool | Whether it can be combined with other discounts. |

### Design Notes:

- **Valor always positive:** The system internally subtracts the value. This avoids confusion when loading data.
- **Trigger_Item can be a pattern:** Allows detecting not just exact items but also categories (via prefixes or special flags).
- **Condicion_Extra:** Reserved for complex logic in future versions (e.g., discounts that only apply if pax > 100).
- **Acumulable:** If `false`, the system ensures it is not applied simultaneously with other non-cumulative discounts.

---

## 2. Engine Logic (Srv_Discount.js)

This service runs **after base price calculation** and **before calculating the final total**.

### 2.1 Execution Flow

1. **Calculate Prices:** System sums all individual components (base + children per Tipo_Precio).
2. **Search Rules:** DiscountEngine iterates through the REGLAS_DESCUENTO table.
3. **Validate Condition (Match):** Is the Trigger_Item present in the cart?
4. **Apply Discount:** Inserts a negative virtual line into the quotation.
5. **Validate Cumulability:** If multiple discounts exist, ensures they follow combination rules.

### 2.2 Algorithm (Pseudocode)

```javascript
class DiscountService {
  applyDiscounts(cotizacion) {
    const reglas = this.repoDescuentos.getAll(); // From cache
    const lineasDescuento = [];
    const descuentosAplicados = []; // To validate cumulability

    reglas.forEach(regla => {
      // 1. Check if 'Trigger' (e.g., Menu Gold) exists in the quotation
      const itemGatillador = cotizacion.lineas.find(l => l.ID_Item === regla.Trigger_Item);

      if (itemGatillador) {

        // 1.5 Validate cumulability
        if (!regla.Acumulable && descuentosAplicados.length > 0) {
          // This discount is not cumulative, and another is already applied
          // Skip this rule (or generate warning, per policy)
          return;
        }

        // 2. Calculate discount amount
        let montoDescuento = 0;

        if (regla.Tipo_Calculo === 'POR_PAX') {
          // Use trigger item's pax (if override exists) or global pax
          const paxAplicable = itemGatillador.Input_Pax || cotizacion.Pax_Global;
          montoDescuento = regla.Valor * paxAplicable;
        }
        else if (regla.Tipo_Calculo === 'FIJO') {
          montoDescuento = regla.Valor;
        }
        else if (regla.Tipo_Calculo === 'PORCENTAJE') {
          // Calculate current subtotal (sum of positive prices)
          const subtotal = cotizacion.lineas
            .filter(l => l.Precio_Total_Linea > 0)
            .reduce((sum, l) => sum + l.Precio_Total_Linea, 0);
          montoDescuento = (subtotal * regla.Valor) / 100; // Valor = % (e.g., 10 for 10%)
        }

        // 3. Create discount line (Negative Price)
        if (montoDescuento > 0) {
          lineasDescuento.push({
            ID_Item: 'DESC-AUTO',
            Nombre: regla.Nombre, // "Menu Gold Bonus"
            Precio_Total_Linea: -montoDescuento, // NEGATIVE
            Es_Descuento: true,
            ID_Regla_Descuento: regla.ID_Descuento // For audit
          });

          descuentosAplicados.push(regla.ID_Descuento);
        }
      }
    });

    // Add discount lines to the final cart
    return [...cotizacion.lineas, ...lineasDescuento];
  }
}
```

### 2.3 Implementation Considerations

- **Execution Order:** Discounts apply in the order defined in the DB. If order matters, add a `Prioridad` field.
- **No Circular Protection:** Not applicable (unlike Pricing with recursive compositions).
- **Rounding:** Amounts must be rounded to nearest integer, consistent with Pricing.
- **Corrupt Rules Validation:** If Valor < 0, service must reject the rule when loading cache.

---

## 3. Menu Implementation Case

Now, apply this logic to solve the menu requirement with $0 price and detailed list.

### Step A: Configure the "Menu" Item in ITEM_CATALOGO

```
Item: MENU-GOLD
Name: "Gold Pack Menu"
ID_Regla_Precio: REGLA-COSTO-CERO
Composition_Tipo_Precio: ABSORBIDO
```

**Note:** The `REGLA-COSTO-CERO` rule is special—it always returns 0 (Base=0, Cp=0, Ct=0, Cq=0).

### Step B: Configure Components in ITEM_CATALOGO

```
Item: LOMO-VETADO
Name: "Vetted Loin"
ID_Regla_Precio: REGLA-PROTEINA-PREMIUM
Costo_Unitario_Pax: $15,000
```

```
Item: ENTRADA-CLASICA
Name: "Classic Appetizer"
ID_Regla_Precio: REGLA-ENTRADA-BASICA
Costo_Unitario_Pax: $5,000
```

```
Item: POSTRE-GOURMET
Name: "Gourmet Dessert"
ID_Regla_Precio: REGLA-POSTRE-PREMIUM
Costo_Unitario_Pax: $5,000
```

### Step C: Configure Composition in COMPOSICION

```
ID_Composicion: COMP-MENU-GOLD-1
ID_Item_Padre: MENU-GOLD
ID_Item_Hijo: ENTRADA-CLASICA
Cantidad: 1
Tipo_Precio: ABSORBIDO

---

ID_Composicion: COMP-MENU-GOLD-2
ID_Item_Padre: MENU-GOLD
ID_Item_Hijo: LOMO-VETADO
Cantidad: 1
Tipo_Precio: ABSORBIDO

---

ID_Composicion: COMP-MENU-GOLD-3
ID_Item_Padre: MENU-GOLD
ID_Item_Hijo: POSTRE-GOURMET
Cantidad: 1
Tipo_Precio: ABSORBIDO
```

### Step D: Configure Discount in REGLAS_DESCUENTO

```
ID_Descuento: DESC-MENU-GOLD
Nombre: "Gold Pack Promotion Discount"
Trigger_Item: MENU-GOLD
Tipo_Calculo: POR_PAX
Valor: 2000 (always positive, system subtracts it)
Condicion_Extra: null
Acumulable: false
```

### Result in Quotation (100 Pax)

**Line Breakdown:**
```
Gold Menu:                        $0 (container)
├─ Classic Appetizer:   $5,000 x 100 = $500,000
├─ Vetted Loin:        $15,000 x 100 = $1,500,000
└─ Gourmet Dessert:     $5,000 x 100 = $500,000

Gold Pack Discount:             -$2,000 x 100 = -$200,000
────────────────────────────────────────────────────
FINAL TOTAL:                                $2,300,000
```

*Comparison:* Without discount, total would be $2,500,000. With discount, reduced to $2,300,000.

---

## 4. Architecture Advantages

### 4.1 Conceptual Analogy

Works like exceptions: "If I find X, apply Y."

### 4.2 Agile Maintenance

- **Seasonal Promo:** Want to run a "Winter Special"? Just add one row to REGLAS_DESCUENTO activating on "Winter Pack" item.
- **Amount Change:** Modify the record in DB, no code changes.
- **No Deployment Required:** Sales/admin staff can add new discounts without redeployment.

### 4.3 Clear Accounting

- **Separate Line:** Having discount as a separate negative line makes it easy to:
  - Calculate true margins.
  - Audit how much is "given away" in discounts per period.
  - Generate discount reports by type.

### 4.4 Clean Composition

- **Prices Unchanged:** No need to modify child prices. Loin stays at $15,000.
- **Clear Semantics:** Customer sees exactly what components the Pack includes and what discount they received.
- **Compatibility:** Works with any Tipo_Precio strategy in composition.

---

## 5. Advanced Use Cases (Future)

### 5.1 Volume-Based Discounts

If `Condicion_Extra = MIN_PAX_100`, discount only applies if pax >= 100.

```javascript
if (regla.Condicion_Extra === 'MIN_PAX_100') {
  const paxReal = itemGatillador.Input_Pax || cotizacion.Pax_Global;
  if (paxReal < 100) return; // Does not apply
}
```

### 5.2 Tiered Discounts

Multiple rows for the same rule:

```
DESC-VOL-1: If 50-99 pax, -$1,000 per pax
DESC-VOL-2: If 100+ pax, -$2,000 per pax
```

Service would execute both and select the one providing maximum discount (with additional logic).

### 5.3 Customer Loyalty Discounts

Future CRM integration: If customer has > 3 previous quotations, apply extra discount.

---

## 6. General Integration Flow

The main controller (`Controller_Main.js`) orchestrates:

1. **Calculate Prices** → `Srv_Pricing.js`
2. **Validate Constraints** → `Srv_Constraint.js`
3. **Apply Discounts** → `Srv_Discount.js` ← **NEW**
4. **Save Quotation** → Persistence

If any step fails (e.g., blocking constraint), quotation is not saved.

---

## 7. Implementation Checklist

- [ ] Create REGLAS_DESCUENTO table in DB with specified fields.
- [ ] Implement `DiscountService` with match and calculation logic.
- [ ] Load REGLAS_DESCUENTO into cache on application startup.
- [ ] Integrate `applyDiscounts()` call into save flow.
- [ ] Validate rounding and monetary calculation precision.
- [ ] Create test discount rule (e.g., DESC-MENU-GOLD).
- [ ] Test with sample quotation (100 pax menu).
- [ ] Document new response fields in Controller API.
- [ ] Add validation against cumulability cycles (if multiple non-cumulative).
- [ ] Write unit tests for `DiscountService`.

---

## 8. Cross References

- **Pricing and Price Rules:** See `PRICING_AND_CONSTRAINTS_v2.md` (Part 1).
- **Constraints (Business Rules):** See `PRICING_AND_CONSTRAINTS_v2.md` (Part 2). Discount engine uses the same validation pattern.
- **Item Composition:** See `composition_logic.md` to understand how menus and bundles are structured.
