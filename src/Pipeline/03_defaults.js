export function resolveDefaults(linea, ctx, store) {
  const item = store.findById('ITEM_CATALOGO', 'ID_Item', linea.ID_Item);
  const cat = store.findById('CATEGORIAS', 'ID_Categoria', item.ID_Categoria);

  linea._categoriaId = cat.ID_Categoria;

  // P (Pax)
  linea._pax = cat.Def_Requiere_Pax
    ? (linea.Override_Pax ?? ctx.paxGlobal)
    : 0;

  // T (Duración)
  linea._duracionMin = cat.Def_Requiere_Tiempo
    ? (linea.Override_Duracion_Min ?? cat.Def_Duracion_Min ?? 0)
    : 0;

  // Q (Cantidad) — depends on resolved _pax
  if (cat.Def_Requiere_Cant) {
    if (linea.Override_Cantidad != null) {
      linea._cantidad = linea.Override_Cantidad;
    } else {
      const unitsPerPax = item.Def_Unidades_Por_Pax_Override ?? cat.Def_Unidades_Por_Pax ?? 0;
      linea._cantidad = Math.round(unitsPerPax * linea._pax);
    }
  } else {
    linea._cantidad = 0;
  }

  return linea;
}
