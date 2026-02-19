# Step 14: Integration Tests

**What:** End-to-end tests simulating real user sessions.

**File:** `tests/integration/full_pipeline.test.js`

**Scenario 1: Corporate Seminar (25 pax, 1 day)**
1. createQuotation(25 pax) → empty, total=0
2. addItem(Salon Chinook) → subtotal=385,000
3. addItem(Coffee Basic) → subtotal=385,000 + 159,500 = 544,500
4. addItem(Almuerzo) → subtotal updated
5. recalculate with taxes → total = subtotal × 1.19
6. updatePax(50) → coffee + almuerzo recalculated, salon unchanged
7. verify final totals

**Scenario 2: Wedding (80 pax, 1 day, with overtime + composition)**
1. createQuotation(80 pax)
2. addItem(Salon Chinook, Override_Duracion=300) → overtime surcharge
3. addItem(Coffee Break Pack) → expands to children
4. addItem(DJ) → fixed price
5. addItem(Cerveza) → auto-qty from pax
6. verify: overtime, pack expanded, auto-qty correct, IVA on total

**Retrocompatibility:** All unit tests from steps 02-12 still pass.

**Depends on:** Step 13.
