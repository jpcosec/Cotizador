export function applyManualAdjustments(lineas, ajustesManuales) {
  for (const linea of lineas) {
    linea._netoFinal = linea._netoAjustado ?? linea._netoBase;
    linea._ajusteManual = null;
  }

  for (const ajuste of ajustesManuales) {
    if (ajuste.Tipo_Ajuste === 'DESCUENTO_GLOBAL' || ajuste.Tipo_Ajuste === 'RECARGO') {
      continue; // global adjustments handled separately
    }

    const linea = lineas.find(l => l.ID_Linea === ajuste.ID_Linea);
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
}

export function getGlobalManualAdjustments(ajustesManuales) {
  return ajustesManuales.filter(
    a => a.Tipo_Ajuste === 'DESCUENTO_GLOBAL' || a.Tipo_Ajuste === 'RECARGO'
  );
}
