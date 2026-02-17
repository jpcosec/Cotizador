# Step 10: Stage 5 — Automatic Adjustments

**What:** Apply AJUSTE_LINEA and AJUSTE_GLOBAL rules to modify prices or insert new lines.

**File:** `src/Pipeline/05_adjustments.js`

**Function:** `applyAdjustments(ctx, store)` → mutates ctx
- For each line: evaluate AJUSTE_LINEA rules → modify `_netoAjustado`
- For quotation: evaluate AJUSTE_GLOBAL rules → insert adjustment lines
- Respects `Acumulable` flag

**Test file:** `tests/unit/05_adjustments.test.js`
- Salon 240min (standard) → no adjustments, _netoAjustado = _netoBase
- Salon 300min (overtime) → _ajustes has surcharge, _netoAjustado = _netoBase × 1.25
- All Step 07 tests still pass

**Depends on:** Steps 07, 09.
