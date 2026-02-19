# Step 07: addItem Orchestrator

**What:** Main entry point for user interaction. Adds item to cart, resolves defaults, calculates price, updates totals.

**File:** `src/Pipeline/add_item.js`

**Function:** `addItem(ctx, itemId, overrides, store)` → returns updated ctx
1. Creates LINEA_DETALLE from itemId + overrides
2. Calls `resolveDefaults()` on the new line
3. Calls `calculateLinePrice()` on the new line
4. Appends to `ctx.lineas`
5. Recalculates `ctx.totals.subtotal`
6. Returns ctx

**Test file:** `tests/unit/add_item.test.js`
- Empty cart + Salon Chinook → 1 line, subtotal=385,000
- + Coffee Basic (25 pax) → 2 lines, subtotal=544,500
- + Cerveza (auto-qty) → 3 lines, subtotal increased
- Add with Override_Pax=50 → that line uses 50, others unchanged
- **Retrocompatibility:** these tests must NEVER be modified in later steps

**Depends on:** Steps 05, 06.
