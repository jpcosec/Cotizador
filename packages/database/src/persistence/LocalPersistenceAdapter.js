import { createDatabase } from '../createDatabase.js';
import {
  PERSISTENCE_ERROR_CODES,
  PersistencePort,
  persistenceError,
  persistenceOk,
} from './PersistencePort.js';

function toId(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

function sortLineas(lineas = []) {
  return [...lineas].sort((left, right) => {
    const leftDay = Number(left?.Dia_Numero || 0);
    const rightDay = Number(right?.Dia_Numero || 0);
    if (leftDay !== rightDay) return leftDay - rightDay;
    return String(left?.ID_Linea || '').localeCompare(String(right?.ID_Linea || ''));
  });
}

function toResultData(quotationId, cotizacion, lineas) {
  const normalizedLineas = sortLineas(lineas);
  return {
    quotationId,
    cotizacion,
    lineas: normalizedLineas,
    lineCount: normalizedLineas.length,
  };
}

function ensureSavePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'payload object is required';
  }

  if (!payload.cotizacion || typeof payload.cotizacion !== 'object') {
    return 'payload.cotizacion is required';
  }

  if (payload.lineas !== undefined && !Array.isArray(payload.lineas)) {
    return 'payload.lineas must be an array';
  }

  const quotationId = toId(payload.cotizacion.ID_Cotizacion);
  if (!quotationId) {
    return 'payload.cotizacion.ID_Cotizacion is required';
  }

  return null;
}

export class LocalPersistenceAdapter extends PersistencePort {
  constructor({ models } = {}) {
    super();
    if (!models?.COTIZACIONES || !models?.LINEA_DETALLE) {
      throw new Error('LocalPersistenceAdapter requires COTIZACIONES and LINEA_DETALLE models');
    }
    this.models = models;
  }

  static createDefault() {
    const db = createDatabase();
    return new LocalPersistenceAdapter({ models: db.models });
  }

  #removeExistingLineas(quotationId) {
    const existingLineas = this.models.LINEA_DETALLE.where(
      (linea) => String(linea.ID_Cotizacion) === quotationId
    );
    const pk = this.models.LINEA_DETALLE.primaryKey || 'ID_Linea';
    for (const linea of existingLineas) {
      this.models.LINEA_DETALLE.deleteById(linea[pk]);
    }
  }

  #upsertCotizacion(cotizacion) {
    const quotationId = String(cotizacion.ID_Cotizacion);
    const existing = this.models.COTIZACIONES.findById(quotationId);
    if (existing) {
      return this.models.COTIZACIONES.update({
        ...existing,
        ...cotizacion,
        ID_Cotizacion: quotationId,
      });
    }
    return this.models.COTIZACIONES.create({
      ...cotizacion,
      ID_Cotizacion: quotationId,
    });
  }

  #createLineas(quotationId, lineas) {
    const created = [];
    for (const linea of lineas) {
      created.push(
        this.models.LINEA_DETALLE.create({
          ...linea,
          ID_Cotizacion: quotationId,
        })
      );
    }
    return created;
  }

  async save(payload) {
    const payloadError = ensureSavePayload(payload);
    if (payloadError) {
      return persistenceError(PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT, payloadError);
    }

    try {
      const quotationId = String(payload.cotizacion.ID_Cotizacion);
      const lineas = Array.isArray(payload.lineas) ? payload.lineas : [];

      const savedHeader = this.#upsertCotizacion({
        ...payload.cotizacion,
        ID_Cotizacion: quotationId,
      });

      this.#removeExistingLineas(quotationId);
      const savedLineas = this.#createLineas(quotationId, lineas);

      return persistenceOk(toResultData(quotationId, savedHeader, savedLineas));
    } catch (error) {
      return persistenceError(
        PERSISTENCE_ERROR_CODES.STORAGE_ERROR,
        error?.message || 'Unable to save quotation'
      );
    }
  }

  async load(id) {
    const quotationId = toId(id);
    if (!quotationId) {
      return persistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT,
        'quotation id is required'
      );
    }

    try {
      const cotizacion = this.models.COTIZACIONES.findById(quotationId);
      if (!cotizacion) {
        return persistenceError(
          PERSISTENCE_ERROR_CODES.NOT_FOUND,
          `Quotation not found: ${quotationId}`
        );
      }

      const lineas = this.models.LINEA_DETALLE.where(
        (row) => String(row.ID_Cotizacion) === quotationId
      );

      return persistenceOk(toResultData(quotationId, cotizacion, lineas));
    } catch (error) {
      return persistenceError(
        PERSISTENCE_ERROR_CODES.STORAGE_ERROR,
        error?.message || 'Unable to load quotation'
      );
    }
  }
}
