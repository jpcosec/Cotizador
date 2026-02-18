# Step 12: Stage 7 — Taxes

**What:** Calculate taxes on consolidated neto total. IVA 19%.

**File:** `src/Pipeline/07_taxes.js`

**Function:** `calculateTaxes(ctx, store)` → mutates ctx.totals
- Sum all `_netoFinal` → subtotal
- Evaluate IMPUESTO rules → tax amounts
- `totals: { subtotal, taxes: [{ name, rate, amount }], total }`

**Test file:** `tests/unit/07_taxes.test.js`
- Single line 385,000 → subtotal=385,000, IVA=73,150, total=458,150
- Two lines → subtotal = sum, IVA on sum
- No tax rules → total = subtotal

**Depends on:** Steps 09, 11.
