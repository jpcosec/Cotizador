import { expandCompositions } from './02_expand.js';
import { resolveDefaults } from './03_defaults.js';
import { calculateLinePrice } from './04_pricing.js';

let _lineSeq = 0;

export function addItem(ctx, itemId, overrides = {}, store) {
  _lineSeq += 1;

  const linea = {
    ID_Linea: `LIN_${_lineSeq}`,
    ID_Cotizacion: ctx.cotizacion.ID_Cotizacion,
    ID_Item: itemId,
    Override_Pax: overrides.Override_Pax ?? null,
    Override_Cantidad: overrides.Override_Cantidad ?? null,
    Override_Duracion_Min: overrides.Override_Duracion_Min ?? null,
  };

  const expanded = expandCompositions([linea], store);

  for (const line of expanded) {
    resolveDefaults(line, ctx, store);
    calculateLinePrice(line, store);
    ctx.lineas.push(line);
  }

  recalcSubtotal(ctx);
  return ctx;
}

function recalcSubtotal(ctx) {
  ctx.totals.subtotal = ctx.lineas.reduce((sum, l) => sum + (l._netoBase || 0), 0);
}
