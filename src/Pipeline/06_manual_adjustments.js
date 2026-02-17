export function applyManualAdjustments(ctx, store) {
  const ajustes = store.findByFK('AJUSTES_COTIZACION', 'ID_Cotizacion', ctx.cotizacion.ID_Cotizacion);

  for (const linea of ctx.lineas) {
    linea._netoFinal = linea._netoAjustado ?? linea._netoBase;
    linea._ajusteManual = null;
  }

  for (const ajuste of ajustes) {
    if (ajuste.Tipo_Ajuste === 'DESCUENTO_GLOBAL' || ajuste.Tipo_Ajuste === 'RECARGO') {
      applyGlobalManual(ctx, ajuste);
      continue;
    }

    const linea = ctx.lineas.find(l => l.ID_Linea === ajuste.ID_Linea);
    if (!linea) continue;

    linea._valorOriginal = linea._netoFinal;

    switch (ajuste.Tipo_Ajuste) {
      case 'OVERRIDE_PRECIO':
        linea._netoFinal = ajuste.Valor_Nuevo;
        break;
      case 'DESCUENTO_LINEA':
        linea._netoFinal -= ajuste.Valor_Nuevo;
        break;
    }

    linea._ajusteManual = ajuste;
  }

  return ctx;
}

function applyGlobalManual(ctx, ajuste) {
  ctx._ajusteGlobalManual = ctx._ajusteGlobalManual || [];
  ctx._ajusteGlobalManual.push(ajuste);
}
