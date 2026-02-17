let _seqId = 0;

export function createQuotation({ paxGlobal, fechaEvento, duracionDias, clienteId }, store) {
  const client = store.findById('CLIENTES', 'ID_Cliente', clienteId);
  _seqId += 1;

  return {
    cotizacion: {
      ID_Cotizacion: `COT_${_seqId}`,
      ID_Cliente: clienteId,
      Fecha_Evento: fechaEvento,
      Duracion_Dias: duracionDias,
      Pax_Global: paxGlobal,
      Estado: 'Borrador',
    },
    paxGlobal,
    lineas: [],
    totals: { subtotal: 0, taxes: [], total: 0 },
    messages: [],
  };
}

export function updatePax(ctx, newPax) {
  ctx.paxGlobal = newPax;
  ctx.cotizacion.Pax_Global = newPax;
  return ctx;
}
