import { createSeededStore } from './store_factory.js';

/**
 * Creates initial context for the quotation state machine.
 * All fields are empty/null until state transitions populate them.
 */
export function createInitialContext(overrides = {}) {
  return {
    previousQuotations: [],
    quotation: null,
    lineas: [],
    totals: { subtotal: 0, taxes: [], total: 0 },
    store: createSeededStore(),
    messages: [],
    errors: [],
    databaseOpen: false,
    databaseUIState: null,
    selectedRowId: null,
    selectedRowData: null,
    ...overrides,
  };
}

/**
 * Creates context with an initialized quotation (ready for basket operations).
 * Useful for tests that need to skip the initialization phase.
 */
export function createBasketContext(opts = {}) {
  const store = createSeededStore();
  const paxGlobal = opts.paxGlobal || 25;
  const cotizacionId = opts.cotizacionId || `COT_TEST_${Date.now()}`;
  const clienteId = opts.clienteId || 'CLI_CORP';

  return {
    ...createInitialContext({ store }),
    quotation: {
      cotizacion: {
        ID_Cotizacion: cotizacionId,
        ID_Cliente: clienteId,
        Fecha_Evento: opts.fechaEvento || '2025-06-15',
        Duracion_Dias: opts.duracionDias || 1,
        Pax_Global: paxGlobal,
        Estado: 'Borrador',
      },
      paxGlobal,
      ajustesManuales: opts.ajustesManuales || [],
      _lineSeq: 0,
    },
  };
}

/**
 * Creates context with items already in the basket.
 * Useful for testing mutation operations (update, remove) without going through add.
 */
export function createBasketContextWithItems(items = [], opts = {}) {
  const ctx = createBasketContext(opts);

  // Simulate added items
  ctx.lineas = items.map((item, idx) => ({
    ID_Linea: `LIN_${idx + 1}`,
    ID_Cotizacion: ctx.quotation.cotizacion.ID_Cotizacion,
    ID_Item: item.itemId,
    _netoBase: item._netoBase || 100000,
    _source: item._source || 'DIRECT',
    ...item,
  }));

  // Recalculate totals (simplified)
  const subtotal = ctx.lineas.reduce((sum, line) => sum + (line._netoBase || 0), 0);
  ctx.totals = {
    subtotal,
    taxes: [{ rate: 0.19, amount: Math.round(subtotal * 0.19) }],
    total: Math.round(subtotal * 1.19),
  };

  return ctx;
}

/**
 * Creates context in validation state (ready for saveQuotation).
 */
export function createValidationContext(opts = {}) {
  return createBasketContextWithItems(opts.items || [], opts);
}
