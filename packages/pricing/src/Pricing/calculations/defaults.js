export function resolveDefaults(linea, paxGlobal, store) {
  const item = store.findById('ITEM_CATALOGO', 'ID_Item', linea.ID_Item);
  const cat = store.findById('CATEGORIAS', 'ID_Categoria', item.ID_Categoria);

  linea._categoriaId = cat.ID_Categoria;

  // Overrides bypass category requirements
  if (linea.Override_Pax != null) {
    linea._pax = linea.Override_Pax;
  } else {
    linea._pax = cat.Def_Requiere_Pax ? paxGlobal : 0;
  }

  if (linea.Override_Duracion_Min != null) {
    linea._duracionMin = linea.Override_Duracion_Min;
  } else {
    linea._duracionMin = cat.Def_Requiere_Tiempo ? (cat.Def_Duracion_Min ?? 0) : 0;
  }

  if (linea.Override_Cantidad != null) {
    linea._cantidad = linea.Override_Cantidad;
  } else if (cat.Def_Requiere_Cant) {
    const unitsPerPax = item.Def_Unidades_Por_Pax_Override ?? cat.Def_Unidades_Por_Pax ?? 0;
    linea._cantidad = Math.round(unitsPerPax * linea._pax);
  } else {
    linea._cantidad = 0;
  }

  return linea;
}
