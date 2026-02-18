export function resolvePerfil(linea, store) {
  const item = store.findById('ITEM_CATALOGO', 'ID_Item', linea.ID_Item);
  if (item.ID_Perfil_Precio_Override) {
    return store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', item.ID_Perfil_Precio_Override);
  }
  const cat = store.findById('CATEGORIAS', 'ID_Categoria', item.ID_Categoria);
  return store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', cat.ID_Perfil_Precio_Default);
}

export function calculateLinePrice(linea, store) {
  const perfil = resolvePerfil(linea, store);
  linea._perfil = perfil?.ID_Perfil_Precio ?? null;

  if (!perfil) {
    linea._netoBase = 0;
    return linea;
  }

  const P = linea._pax || 0;
  const T = linea._duracionMin || 0;
  const Q = linea._cantidad || 0;

  linea._netoBase =
    (perfil.Costo_Base_Fijo || 0) +
    (P * (perfil.Costo_Unitario_Pax || 0)) +
    (T * (perfil.Costo_Unitario_Tiempo || 0)) +
    (Q * (perfil.Costo_Unitario_Item || 0));

  return linea;
}
