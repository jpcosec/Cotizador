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
import { DATA_SCHEMA } from '../../../../../src/Config/Config_Schema.js';

// --- Helpers ---

function nextId(quotation) {
  quotation._lineSeq = (quotation._lineSeq || 0) + 1;
  return `LIN_${quotation._lineSeq}`;
}

function buildSchemaMetadata(schema) {
  const primaryKeyByTable = {};
  const tablesByIdField = {};

  for (const [tableName, tableSchema] of Object.entries(schema || {})) {
    const pkColumn = (tableSchema.columns || []).find((column) => String(column.type || '').includes('PK'));
    if (!pkColumn) continue;

    primaryKeyByTable[tableName] = pkColumn.name;

    if (!tablesByIdField[pkColumn.name]) {
      tablesByIdField[pkColumn.name] = [];
    }
    tablesByIdField[pkColumn.name].push(tableName);
  }

  return { primaryKeyByTable, tablesByIdField };
}

const SCHEMA_METADATA = buildSchemaMetadata(DATA_SCHEMA);
const TABLE_PRIMARY_KEY = SCHEMA_METADATA.primaryKeyByTable;

function parseSnapshot(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function getCachedQuotation(store, cotizacionId) {
  if (!store || !cotizacionId) return null;
  if (typeof store.findById === 'function') {
    const found = store.findById('CACHE_COTIZACION', 'ID_Cotizacion', cotizacionId);
    if (found) return found;
  }
  if (typeof store.findAll === 'function') {
    const matches = store.findAll('CACHE_COTIZACION', { ID_Cotizacion: cotizacionId });
    if (Array.isArray(matches) && matches.length > 0) return matches[0];
  }
  return null;
}

function hydrateLoadedQuotation(record) {
  const snapshot = parseSnapshot(record.Snapshot_JSON || record);
  if (!snapshot || !snapshot.cotizacion) return null;

  return {
    quotation: {
      cotizacion: { ...snapshot.cotizacion },
      paxGlobal: snapshot.cotizacion.Pax_Global ?? snapshot.paxGlobal ?? 0,
      ajustesManuales: Array.isArray(snapshot.ajustesManuales)
        ? [...snapshot.ajustesManuales]
        : [],
      _lineSeq: Array.isArray(snapshot.lineas) ? snapshot.lineas.length : 0,
    },
    lineas: Array.isArray(snapshot.lineas) ? snapshot.lineas.map(l => ({ ...l })) : [],
    totals: snapshot.totals || { subtotal: 0, taxes: [], total: 0 },
  };
}

function inferTableNameFromRecord(record = {}) {
  if (!record || typeof record !== 'object') return null;

  const idFields = Object.keys(record).filter((key) => {
    const value = record[key];
    return key.startsWith('ID_') && value !== undefined && value !== null && value !== '';
  });

  if (idFields.length === 0) return null;

  for (const idField of idFields) {
    const candidates = SCHEMA_METADATA.tablesByIdField[idField] || [];
    if (candidates.length === 1) {
      return candidates[0];
    }
  }

  return null;
}

function resolveTableName(event, context) {
  return (
    event.tableName
    || event.modifiedData?.tableName
    || event.newRowData?.tableName
    || context.selectedRowData?._tableName
    || inferTableNameFromRecord(context.selectedRowData)
    || inferTableNameFromRecord(event.modifiedData)
    || inferTableNameFromRecord(event.newRowData)
  );
}

function resolvePrimaryKey(tableName, row = {}) {
  if (!tableName) return null;
  const mapped = TABLE_PRIMARY_KEY[tableName];
  if (mapped) return mapped;
  const dynamic = Object.keys(row).find(key => key.startsWith('ID_'));
  return dynamic || null;
}

function upsertWithSeed(store, tableName, row, primaryKey) {
  if (!store || typeof store.all !== 'function' || typeof store.seed !== 'function') return;
  const existing = store.all(tableName);
  const next = Array.isArray(existing) ? [...existing] : [];
  const rowId = row[primaryKey];
  const idx = next.findIndex(entry => String(entry[primaryKey]) === String(rowId));

  if (idx >= 0) {
    next[idx] = { ...next[idx], ...row };
  } else {
    next.push({ ...row });
  }

  store.seed(tableName, next);
}

function persistRowUpdate(store, tableName, row) {
  const primaryKey = resolvePrimaryKey(tableName, row);
  if (!store || !tableName || !primaryKey) return;

  if (typeof store.update === 'function') {
    try {
      store.update(tableName, row);
      return;
    } catch {
      try {
        store.update(row);
        return;
      } catch {
      }
    }
  }

  upsertWithSeed(store, tableName, row, primaryKey);
}

function persistRowInsert(store, tableName, row) {
  if (!store || !tableName) return;
  if (typeof store.insert === 'function') {
    try {
      store.insert(tableName, row);
      return;
    } catch {
      try {
        store.insert(row);
        return;
      } catch {
      }
    }
  }

  const primaryKey = resolvePrimaryKey(tableName, row);
  if (primaryKey) {
    upsertWithSeed(store, tableName, row, primaryKey);
  }
}

// --- Browse Actions ---

export const browseActions = {
  listPreviousQuotations: assign(({ context }) => {
    if (!context.store || typeof context.store.findAll !== 'function') {
      return { previousQuotations: [] };
    }

    const rows = context.store.findAll('CACHE_COTIZACION', {});
    const previousQuotations = rows
      .map((row) => {
        const snapshot = parseSnapshot(row.Snapshot_JSON);
        if (!snapshot || !snapshot.cotizacion) return null;
        return {
          cotizacionId: row.ID_Cotizacion,
          estado: snapshot.cotizacion.Estado || 'Borrador',
          clienteId: snapshot.cotizacion.ID_Cliente || null,
          fechaEvento: snapshot.cotizacion.Fecha_Evento || null,
          total: snapshot.totals?.total || 0,
          updatedAt: row.Updated_At || null,
        };
      })
      .filter(Boolean);

    return { previousQuotations };
  }),

  loadPreviousQuotation: assign(({ context, event }) => {
    const { cotizacionId } = event;
    const row = getCachedQuotation(context.store, cotizacionId);
    if (!row) {
      return {
        errors: [
          ...context.errors,
          {
            source: 'load',
            blocking: true,
            message: `Quotation not found: ${cotizacionId}`,
          },
        ],
      };
    }

    const loaded = hydrateLoadedQuotation(row);
    if (!loaded) {
      return {
        errors: [
          ...context.errors,
          {
            source: 'load',
            blocking: true,
            message: `Invalid quotation snapshot: ${cotizacionId}`,
          },
        ],
      };
    }

    return {
      ...loaded,
      messages: context.messages,
      errors: context.errors.filter(error => error.source !== 'load'),
    };
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
    const tableName = resolveTableName(event, context);
    if (context.store && tableName) {
      const base = context.selectedRowData || {};
      const row = {
        ...base,
        ...modifiedData,
      };
      delete row._tableName;
      persistRowUpdate(context.store, tableName, row);
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
    const tableName = resolveTableName(event, context);
    if (context.store && tableName && newRowData) {
      const row = { ...newRowData };
      delete row._tableName;
      persistRowInsert(context.store, tableName, row);
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
