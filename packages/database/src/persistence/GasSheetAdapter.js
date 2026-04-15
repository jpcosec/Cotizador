import {
  PERSISTENCE_ERROR_CODES,
  PersistencePort,
  persistenceError,
  persistenceOk,
} from './PersistencePort.js';

function toErrorMessage(error) {
  if (!error) return 'Unknown GAS error';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message) return error.message;
  return 'Unknown GAS error';
}

function normalizeErrorObject(raw, fallbackCode = PERSISTENCE_ERROR_CODES.STORAGE_ERROR) {
  if (raw && typeof raw === 'object' && raw.error && typeof raw.error === 'object') {
    const code = raw.error.code || fallbackCode;
    const message = raw.error.message || 'Unknown persistence error';
    return persistenceError(code, message, raw.error.details);
  }

  if (raw && raw.ok === false && typeof raw.error === 'string') {
    return persistenceError(fallbackCode, raw.error);
  }

  if (raw && raw.success === false) {
    return persistenceError(fallbackCode, raw.message || raw.error || 'Persistence request failed');
  }

  return null;
}

function normalizeSaveResponse(raw, fallbackQuotationId = null) {
  const normalizedError = normalizeErrorObject(raw);
  if (normalizedError) return normalizedError;

  if (raw && raw.ok === true) {
    const data = raw.data || {};
    return persistenceOk({
      quotationId: data.quotationId || data.id || raw.id || fallbackQuotationId,
      cotizacion: data.cotizacion || null,
      lineas: Array.isArray(data.lineas) ? data.lineas : [],
      lineCount: Number(data.lineCount || (Array.isArray(data.lineas) ? data.lineas.length : 0)),
    });
  }

  if (raw && raw.success === true) {
    return persistenceOk({
      quotationId: raw.id || fallbackQuotationId,
      cotizacion: raw.cotizacion || null,
      lineas: Array.isArray(raw.lineas) ? raw.lineas : [],
      lineCount: Number(raw.lineCount || (Array.isArray(raw.lineas) ? raw.lineas.length : 0)),
      message: raw.mensaje || raw.message || '',
    });
  }

  return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, 'Unexpected save response from GAS');
}

function normalizeLoadResponse(raw, requestedId) {
  const normalizedError = normalizeErrorObject(raw, PERSISTENCE_ERROR_CODES.NOT_FOUND);
  if (normalizedError) return normalizedError;

  if (raw && raw.ok === true && raw.data) {
    const data = raw.data;
    return persistenceOk({
      quotationId: data.quotationId || data.id || requestedId,
      cotizacion: data.cotizacion || null,
      lineas: Array.isArray(data.lineas) ? data.lineas : [],
      lineCount: Number(data.lineCount || (Array.isArray(data.lineas) ? data.lineas.length : 0)),
    });
  }

  if (raw && raw.success === true && raw.data) {
    const data = raw.data;
    return persistenceOk({
      quotationId: data.quotationId || data.id || requestedId,
      cotizacion: data.cotizacion || null,
      lineas: Array.isArray(data.lineas) ? data.lineas : [],
      lineCount: Number(data.lineCount || (Array.isArray(data.lineas) ? data.lineas.length : 0)),
    });
  }

  return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, 'Unexpected load response from GAS');
}

function normalizeReferenceResponse(raw) {
  const normalizedError = normalizeErrorObject(raw, PERSISTENCE_ERROR_CODES.STORAGE_ERROR);
  if (normalizedError) return normalizedError;

  if (raw && raw.ok === true) {
    const data = raw.data || {};
    const seedEntries = Array.isArray(data.seedEntries) ? data.seedEntries : [];
    return persistenceOk({
      seedEntries,
      tableCount: Number(data.tableCount || seedEntries.length),
    });
  }

  return persistenceError(
    PERSISTENCE_ERROR_CODES.STORAGE_ERROR,
    'Unexpected reference-data response from GAS'
  );
}

function normalizeQuotationListResponse(raw) {
  const normalizedError = normalizeErrorObject(raw, PERSISTENCE_ERROR_CODES.STORAGE_ERROR);
  if (normalizedError) return normalizedError;

  const data = raw?.data || raw || {};
  const items = Array.isArray(data.items)
    ? data.items.map((item) => ({
        quotationId: item.quotationId || item.id || '',
        clientId: item.clientId || item.ID_Cliente || null,
        clientName: item.clientName || item.cliente || '',
        pax: Number(item.pax || item.Pax_Global || 0),
        quotationDate: item.quotationDate || item.fecha || item.Fecha_Evento || '',
        updatedAt: item.updatedAt || item.Updated_At || '',
      }))
    : [];

  if (raw?.ok === true || raw?.success === true || Array.isArray(data.items)) {
    return persistenceOk({
      items,
      count: Number(data.count || items.length),
    });
  }

  return persistenceError(
    PERSISTENCE_ERROR_CODES.STORAGE_ERROR,
    'Unexpected quotation-list response from GAS'
  );
}

function createGoogleScriptInvoker() {
  return function invoke(method, ...args) {
    return new Promise((resolve, reject) => {
      const runner = globalThis?.google?.script?.run;
      if (!runner || typeof runner.withSuccessHandler !== 'function') {
        reject(new Error('google.script.run is not available'));
        return;
      }

      let chain = runner.withSuccessHandler((result) => resolve(result));
      chain = chain.withFailureHandler((error) => reject(new Error(toErrorMessage(error))));

      if (typeof chain[method] !== 'function') {
        reject(new Error(`google.script.run method not found: ${method}`));
        return;
      }

      chain[method](...args);
    });
  };
}

function isNotFoundMethodError(error) {
  const message = toErrorMessage(error).toLowerCase();
  return message.includes('not found') || message.includes('no existe') || message.includes('undefined');
}

export class GasSheetAdapter extends PersistencePort {
  constructor({
    invoke = null,
    saveMethods = ['guardarCotizacionV2', 'guardarCotizacion'],
    loadMethods = ['cargarCotizacionV2', 'cargarCotizacion'],
    listMethods = ['buscarCotizacionesV2', 'buscarCotizaciones'],
    referenceMethods = ['getReferenceDataV2', 'getReferenceData'],
  } = {}) {
    super();
    this.invoke = invoke || createGoogleScriptInvoker();
    this.saveMethods = Array.isArray(saveMethods) ? saveMethods : ['guardarCotizacion'];
    this.loadMethods = Array.isArray(loadMethods) ? loadMethods : ['cargarCotizacion'];
    this.listMethods = Array.isArray(listMethods) ? listMethods : ['buscarCotizacionesV2', 'buscarCotizaciones'];
    this.referenceMethods = Array.isArray(referenceMethods)
      ? referenceMethods
      : ['getReferenceDataV2', 'getReferenceData'];
  }

  async #invokeWithFallback(methods, ...args) {
    let lastError = null;

    for (const method of methods) {
      try {
        return await this.invoke(method, ...args);
      } catch (error) {
        lastError = error;
        if (!isNotFoundMethodError(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error('No GAS method available');
  }

  async save(payload) {
    if (!payload || typeof payload !== 'object' || !payload.cotizacion) {
      return persistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT,
        'payload.cotizacion is required'
      );
    }

    try {
      const raw = await this.#invokeWithFallback(this.saveMethods, payload);
      return normalizeSaveResponse(raw, payload?.cotizacion?.ID_Cotizacion || null);
    } catch (error) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, toErrorMessage(error));
    }
  }

  async load(id) {
    const quotationId = String(id || '').trim();
    if (!quotationId) {
      return persistenceError(PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT, 'quotation id is required');
    }

    try {
      const raw = await this.#invokeWithFallback(this.loadMethods, quotationId);
      return normalizeLoadResponse(raw, quotationId);
    } catch (error) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, toErrorMessage(error));
    }
  }

  async listQuotations(query = {}) {
    try {
      const raw = await this.#invokeWithFallback(this.listMethods, query || {});
      return normalizeQuotationListResponse(raw);
    } catch (error) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, toErrorMessage(error));
    }
  }

  async loadReferenceData() {
    try {
      const raw = await this.#invokeWithFallback(this.referenceMethods);
      return normalizeReferenceResponse(raw);
    } catch (error) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, toErrorMessage(error));
    }
  }
}

export { createGoogleScriptInvoker };
