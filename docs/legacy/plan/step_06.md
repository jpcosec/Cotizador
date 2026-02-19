# Step 06: Stage 4 — Base Price Calculation

**What:** Calculate net price for each line using the universal formula.

**File:** `src/Pipeline/04_pricing.js`

**Functions:**
- `calculateLinePrice(linea, store)` → mutates linea with `_perfil`, `_netoBase`
- `resolvePerfil(linea, store)` → item override → category default

**Formula:** `Neto = Base + (P × Cp) + (T × Ct) + (Q × Cq)`

**Constraint:** Parent/pack items have NO pricing profile. Only leaf items are priced.

**Test file:** `tests/unit/04_pricing.test.js`
- Salon Chinook (fixed): Base=385,000 → _netoBase=385,000
- Coffee Basic (per-pax, 25 pax): Cp=6,380 × 25 → _netoBase=159,500
- Cerveza (per-unit, 40 units): Cq=3,500 × 40 → _netoBase=140,000
- Item with profile override → uses override profile
- Item without override → uses category default profile

**Depends on:** Steps 02, 03, 05.
