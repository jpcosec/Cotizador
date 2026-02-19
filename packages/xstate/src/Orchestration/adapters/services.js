// Async services (actors) for the quotation machine.
// Each service receives the full context (passed via invoke.input in the blueprint).
// They must return a plain result object — context mutations happen via onDone actions.
//
// Note: Services are not used in the current thin adapter design,
// but are kept for future async operations (email, PDF generation, etc).

/**
 * Save quotation to store.
 * Called when validation is complete.
 */
export async function saveQuotationService({ quotation, lineas, totals, store }) {
  if (!lineas.length) throw new Error('Cannot save empty quotation');

  const snapshot = {
    cotizacion: { ...quotation.cotizacion },
    lineas: lineas.map(l => ({ ...l })),
    totals: { ...totals },
    ajustesManuales: [...quotation.ajustesManuales],
  };

  store.insert('CACHE_COTIZACION', {
    ID_Cotizacion: quotation.cotizacion.ID_Cotizacion,
    Snapshot_JSON: JSON.stringify(snapshot),
    Updated_At: new Date().toISOString(),
  });

  return { cotizacionId: quotation.cotizacion.ID_Cotizacion };
}

/**
 * Send quotation via email or other channel.
 * Called after quotation is saved.
 * Stub for now — implementation depends on external system (GAS, webhook, etc).
 */
export async function sendQuotationService({ quotation }) {
  if (quotation.cotizacion.Estado !== 'Guardada') {
    throw new Error('Quotation must be saved before sending');
  }

  const payload = {
    cotizacionId: quotation.cotizacion.ID_Cotizacion,
    clienteId: quotation.cotizacion.ID_Cliente,
    fechaEvento: quotation.cotizacion.Fecha_Evento,
    estado: quotation.cotizacion.Estado,
    sentAt: new Date().toISOString(),
  };

  if (typeof quotation.sendTransport === 'function') {
    const response = await quotation.sendTransport(payload);
    return {
      cotizacionId: quotation.cotizacion.ID_Cotizacion,
      status: 'sent',
      transport: response?.transport || 'custom',
      response: response || null,
    };
  }

  return {
    cotizacionId: quotation.cotizacion.ID_Cotizacion,
    status: 'queued',
    transport: 'local-fallback',
    payload,
  };
}
