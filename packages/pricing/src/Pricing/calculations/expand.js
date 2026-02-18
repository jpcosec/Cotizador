export function expandCompositions(lineas, store) {
  const result = [];

  for (const linea of lineas) {
    const children = store.findByFK('COMPOSICION_KIT', 'ID_Item_Padre', linea.ID_Item);

    if (!children.length) {
      result.push(linea);
      continue;
    }

    for (const comp of children) {
      const childLine = {
        ...linea,
        ID_Item: comp.ID_Item_Hijo,
        _source: 'COMPOSITION',
        _parentItem: comp.ID_Item_Padre,
        _tipoPrecio: comp.Tipo_Precio,
        _cantidadComp: comp.Cantidad,
      };
      result.push(...expandCompositions([childLine], store));
    }
  }

  return result;
}
