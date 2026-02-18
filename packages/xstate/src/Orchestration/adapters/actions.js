// XState actions for the quotation machine.
// Thin adapters that delegate orchestration to pricing module functions.
// Each action is a pure assign — no side effects outside of context mutation.
//
// Import paths assume the merged project structure (src/Pricing/ + src/Orchestration/).
// In the worktree phase, configure your bundler to resolve these from the pricing branch.

import { assign } from 'xstate';
import {
  expandItemCompositions,
  resolveItemDefaults,
  recalculateItemPrice,
  applyItemRules,
  aggregateBasketTotals,
  fullRecalculateBasket,
} from '../../../../pricing/src/Pricing/pipeline.js';

// --- Helpers ---

function nextId(quotation) {
  quotation._lineSeq = (quotation._lineSeq || 0) + 1;
  return `LIN_${quotation._lineSeq}`;
}

// --- Browse Actions ---

export const browseActions = {
  listPreviousQuotations: assign(({ context }) => {
    // Fetch previous quotations from store and display them
    // Implementation: call store.findAll('CACHE_COTIZACION') and format
    return {};
  }),

  loadPreviousQuotation: assign(({ event }) => {
    const { cotizacionId } = event;
    // Fetch from store and initialize quotation context
    return { /* quotation loaded and initialized */ };
  }),
};

// --- Initialization Actions ---

export const initActions = {
  initializeBasketFromLoaded: assign(({ event }) => {
    const quotation = event.data; // From loaded quotation
    return {
      quotation,
      lineas: quotation.lineas || [],
      totals: quotation.totals || { subtotal: 0, taxes: [], total: 0 },
      messages: [],
      errors: [],
    };
  }),

  initializeEmptyBasket: assign(({ event }) => {
    const { paxGlobal, clienteId, fechaEvento, duracionDias, cotizacionId } =
      event;
    return {
      quotation: {
        cotizacion: {
          ID_Cotizacion: cotizacionId || `COT_${Date.now()}`,
          ID_Cliente: clienteId,
          Fecha_Evento: fechaEvento ?? null,
          Duracion_Dias: duracionDias ?? null,
          Pax_Global: paxGlobal,
          Estado: 'Borrador',
        },
        paxGlobal,
        ajustesManuales: [],
        _lineSeq: 0,
      },
      lineas: [],
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages: [],
      errors: [],
    };
  }),

  captureError: assign(({ context, event }) => ({
    errors: [
      ...context.errors,
      { source: 'initialization', message: event.error?.message || 'Error' },
    ],
  })),
};

// --- Basket Mutation Actions (Thin adapters calling pricing module) ---

/**
 * Add item to basket.
 * Delegates to pricing module: expandItemCompositions → resolveItemDefaults → recalculateItemPrice → applyItemRules → aggregateBasketTotals
 */
export const basketActions = {
  addItem: assign(({ context, event }) => {
    const { itemId, overrides = {} } = event;
    const { store } = context;
    const quotation = { ...context.quotation };

    const baseLine = {
      ID_Linea: nextId(quotation),
      ID_Cotizacion: quotation.cotizacion.ID_Cotizacion,
      ID_Item: itemId,
      Override_Pax: overrides.Override_Pax ?? null,
      Override_Cantidad: overrides.Override_Cantidad ?? null,
      Override_Duracion_Min: overrides.Override_Duracion_Min ?? null,
    };

    // Step 1: Expand compositions
    const expanded = expandItemCompositions(baseLine, store).map(line =>
      line === baseLine ? line : { ...line, ID_Linea: nextId(quotation) }
    );

    // Step 2-4: For each expanded line, resolve + price + apply rules
    const newMessages = [];
    const newErrors = [];
    for (const linea of expanded) {
      resolveItemDefaults(linea, quotation.paxGlobal, store);
      recalculateItemPrice(linea, store);
      const ruleResult = applyItemRules(linea, store);
      if (ruleResult.errors.length > 0) {
        newErrors.push(...ruleResult.errors);
      }
    }

    // Step 5: Update global totals
    const { totals, messages: globalMessages } = aggregateBasketTotals(
      [...context.lineas, ...expanded],
      quotation.ajustesManuales,
      store
    );

    return {
      quotation,
      lineas: [...context.lineas, ...expanded],
      totals,
      messages: [...context.messages, ...globalMessages],
      errors: [...context.errors, ...newErrors],
    };
  }),

  /**
   * Update item in basket.
   * Delegates to pricing module: resolveItemDefaults → recalculateItemPrice → applyItemRules → aggregateBasketTotals
   */
  updateItem: assign(({ context, event }) => {
    const { lineId, overrides = {} } = event;
    const { store } = context;

    // Find and update the line
    const updated = context.lineas.map(linea => {
      if (linea.ID_Linea !== lineId) return linea;
      const next = { ...linea };
      if (overrides.Override_Pax !== undefined) next.Override_Pax = overrides.Override_Pax;
      if (overrides.Override_Cantidad !== undefined)
        next.Override_Cantidad = overrides.Override_Cantidad;
      if (overrides.Override_Duracion_Min !== undefined)
        next.Override_Duracion_Min = overrides.Override_Duracion_Min;
      return next;
    });

    // Re-price the updated line
    const targetLinea = updated.find(l => l.ID_Linea === lineId);
    if (targetLinea) {
      resolveItemDefaults(targetLinea, context.quotation.paxGlobal, store);
      recalculateItemPrice(targetLinea, store);
      applyItemRules(targetLinea, store);
    }

    // Update global totals
    const { totals, messages } = aggregateBasketTotals(
      updated,
      context.quotation.ajustesManuales,
      store
    );

    return {
      lineas: updated,
      totals,
      messages: [...context.messages, ...messages],
    };
  }),

  /**
   * Remove item from basket (soft delete).
   * Marks as removed but keeps in history for replay/recovery.
   * Delegates to pricing module: aggregateBasketTotals (with filtered display items)
   */
  removeItem: assign(({ context, event }) => {
    const { lineId } = event;

    // Mark as removed but keep in history
    const updated = context.lineas.map(linea => {
      if (linea.ID_Linea === lineId) {
        return { ...linea, _removed: true };
      }
      return linea;
    });

    // Filter out from displayed cart (but keep in history)
    const displayed = updated.filter(l => !l._removed);

    // Recalc with only displayed items
    const { totals, messages } = aggregateBasketTotals(
      displayed,
      context.quotation.ajustesManuales,
      context.store
    );

    return {
      lineas: updated, // Keep full history
      totals,
      messages: [...context.messages, ...messages],
    };
  }),

  /**
   * Discard quotation and return to browse.
   * Clears all quotation context.
   */
  discardQuotation: assign(() => ({
    quotation: null,
    lineas: [],
    totals: { subtotal: 0, taxes: [], total: 0 },
    messages: [],
    errors: [],
  })),
};

// --- Validation Actions (LEVEL 2 recalculation) ---

/**
 * Validate and save quotation.
 * Delegates to pricing module: fullRecalculateBasket (strips computed fields, runs full pipeline, validates rules)
 * Then saves to store and marks quotation as 'Guardada'.
 */
export const validationActions = {
  validateAndSave: assign(({ context }) => {
    // Full recalculation (LEVEL 2)
    const result = fullRecalculateBasket(
      context.lineas,
      context.quotation,
      context.store
    );

    // If there are blocking errors, validation fails
    if (result.errors.some(e => e.blocking)) {
      return {
        errors: result.errors,
      };
    }

    // Save to store
    const { quotation, lineas, totals, store } = context;
    const snapshot = {
      cotizacion: { ...quotation.cotizacion },
      lineas: result.lineas.map(l => ({ ...l })),
      totals: result.totals,
      ajustesManuales: [...quotation.ajustesManuales],
    };

    store.insert('CACHE_COTIZACION', {
      ID_Cotizacion: quotation.cotizacion.ID_Cotizacion,
      Snapshot_JSON: JSON.stringify(snapshot),
      Updated_At: new Date().toISOString(),
    });

    return {
      lineas: result.lineas,
      totals: result.totals,
      messages: result.messages,
      errors: result.errors,
      quotation: {
        ...quotation,
        cotizacion: { ...quotation.cotizacion, Estado: 'Guardada' },
      },
    };
  }),
};

// --- Context Management ---

export const contextActions = {
  clearQuotationContext: assign(() => ({
    quotation: null,
    lineas: [],
    totals: { subtotal: 0, taxes: [], total: 0 },
    messages: [],
    errors: [],
  })),
};

// --- Database Management Actions ---

export const databaseActions = {
  selectRowToModify: assign(({ event }) => {
    const { rowId, rowData } = event;
    return {
      selectedRowId: rowId,
      selectedRowData: rowData,
      databaseUIState: 'modify_row',
    };
  }),

  saveRowModification: assign(({ context, event }) => {
    const { modifiedData } = event;
    // Store save logic (implementation depends on data store)
    if (context.store) {
      // TODO: call context.store.update(...) with modified data
    }
    return {
      selectedRowId: null,
      selectedRowData: null,
      databaseUIState: 'browse_database',
    };
  }),

  cancelRowModification: assign(() => ({
    selectedRowId: null,
    selectedRowData: null,
    databaseUIState: 'browse_database',
  })),

  saveNewRow: assign(({ context, event }) => {
    const { newRowData } = event;
    // Store save logic
    if (context.store) {
      // TODO: call context.store.insert(...) with new row data
    }
    return {
      databaseUIState: 'browse_database',
    };
  }),

  cancelAddRow: assign(() => ({
    databaseUIState: 'browse_database',
  })),

  /**
   * Full recalculation when closing database.
   * Catches any price changes from database modifications (new rules, catalog updates, etc).
   * Delegates to pricing module: fullRecalculateBasket
   */
  fullRecalculateOnDatabaseClose: assign(({ context }) => {
    if (!context.quotation) {
      return { databaseOpen: false };
    }

    const result = fullRecalculateBasket(
      context.lineas,
      context.quotation,
      context.store
    );

    return {
      databaseOpen: false,
      lineas: result.lineas,
      totals: result.totals,
      messages: [...context.messages, ...result.messages],
      errors: result.errors,
    };
  }),
};

// --- Combine all actions ---

export const actions = {
  ...browseActions,
  ...initActions,
  ...basketActions,
  ...validationActions,
  ...contextActions,
  ...databaseActions,
};
