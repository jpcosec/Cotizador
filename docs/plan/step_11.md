# Step 11: Stage 6 — Manual Adjustments

**What:** Apply user-entered overrides from AJUSTES_COTIZACION table.

**File:** `src/Pipeline/06_manual_adjustments.js`

**Function:** `applyManualAdjustments(ctx, store)` → mutates ctx
- Reads AJUSTES_COTIZACION for this quotation
- Applies OVERRIDE_PRECIO, DESCUENTO_LINEA, DESCUENTO_GLOBAL, RECARGO
- Records `_valorOriginal` and `_valorNuevo`

**Test file:** `tests/unit/06_manual_adjustments.test.js`
- No adjustments → _netoFinal = _netoAjustado
- OVERRIDE_PRECIO → _netoFinal = new value, _valorOriginal preserved
- DESCUENTO_LINEA → _netoFinal = _netoAjustado - discount

**Depends on:** Step 10.
