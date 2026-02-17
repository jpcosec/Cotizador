import { expandCompositions } from './02_expand.js';
import { resolveDefaults } from './03_defaults.js';
import { calculateLinePrice } from './04_pricing.js';
import { applyAdjustments } from './05_adjustments.js';
import { applyManualAdjustments } from './06_manual_adjustments.js';
import { calculateTaxes } from './07_taxes.js';

export function recalculate(ctx, store) {
  // Re-expand (in case compositions changed)
  const rawLineas = ctx.lineas.map(l => ({
    ID_Linea: l.ID_Linea,
    ID_Cotizacion: l.ID_Cotizacion,
    ID_Item: l.ID_Item,
    Override_Pax: l.Override_Pax,
    Override_Cantidad: l.Override_Cantidad,
    Override_Duracion_Min: l.Override_Duracion_Min,
    _source: l._source,
    _parentItem: l._parentItem,
    _tipoPrecio: l._tipoPrecio,
    _cantidadComp: l._cantidadComp,
  }));

  // Stage 3: Defaults
  for (const linea of rawLineas) {
    resolveDefaults(linea, ctx, store);
  }

  // Stage 4: Pricing
  for (const linea of rawLineas) {
    calculateLinePrice(linea, store);
  }

  ctx.lineas = rawLineas;

  // Stage 5: Auto adjustments
  applyAdjustments(ctx, store);

  // Stage 6: Manual adjustments
  applyManualAdjustments(ctx, store);

  // Stage 7: Taxes
  calculateTaxes(ctx, store);

  return ctx;
}
