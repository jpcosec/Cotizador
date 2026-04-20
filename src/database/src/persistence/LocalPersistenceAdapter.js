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

function toLower(value) {
  return String(value || '').toLowerCase();
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

function normalizeQuotationQuery(query = {}) {
  return {
    term: String(query?.term || '').trim().toLowerCase(),
    limit: Math.max(1, Math.floor(Number(query?.limit || 25) || 25)),
  };
}

function toQuotationListItem(cotizacion, client) {
  return {
    quotationId: String(cotizacion?.ID_Cotizacion || ''),
    clientId: toId(cotizacion?.ID_Cliente),
    clientName: String(client?.Nombre_Empresa || cotizacion?.ID_Cliente || 'Cliente sin nombre'),
    pax: Number(cotizacion?.Pax_Global || 0),
    quotationDate: String(cotizacion?.Fecha_Evento || ''),
    updatedAt: String(cotizacion?.Updated_At || ''),
  };
}

function matchesQuotationTerm(item, term) {
  if (!term) return true;
  return [item.quotationId, item.clientName, item.quotationDate, item.pax]
    .some((value) => toLower(value).includes(term));
}

function sortQuotationItems(items = []) {
  return [...items].sort((left, right) => {
    const rightUpdated = String(right.updatedAt || right.quotationDate || '');
    const leftUpdated = String(left.updatedAt || left.quotationDate || '');
    const byUpdated = rightUpdated.localeCompare(leftUpdated);
    if (byUpdated !== 0) return byUpdated;
    return String(right.quotationId || '').localeCompare(String(left.quotationId || ''));
  });
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

const REFERENCE_TABLES = [
  'CLIENTES',
  'CATEGORIAS',
  'ITEM_CATALOGO',
  'PERFILES_PRECIO',
  'PERFILES_INICIALIZACION',
  'REGLAS_NEGOCIO',
];

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

  async listQuotations(query = {}) {
    try {
      const normalizedQuery = normalizeQuotationQuery(query);
      const cotizaciones = this.models.COTIZACIONES.all();
      const clientModel = this.models.CLIENTES || null;
      const items = cotizaciones.map((cotizacion) => {
        const client = clientModel?.findById?.(cotizacion.ID_Cliente) || null;
        return toQuotationListItem(cotizacion, client);
      });

      const filtered = sortQuotationItems(items)
        .filter((item) => matchesQuotationTerm(item, normalizedQuery.term))
        .slice(0, normalizedQuery.limit);

      return persistenceOk({
        items: filtered,
        count: filtered.length,
      });
    } catch (error) {
      return persistenceError(
        PERSISTENCE_ERROR_CODES.STORAGE_ERROR,
        error?.message || 'Unable to list quotations'
      );
    }
  }

  async loadReferenceData() {
    try {
      const seedEntries = REFERENCE_TABLES.map((table) => {
        const model = this.models?.[table];
        const records = model && typeof model.all === 'function' ? model.all() : [];
        return { table, records };
      });

      // Include COMPOSICION_KIT if available
      if (this.models?.COMPOSICION_KIT) {
        seedEntries.push({
          table: 'COMPOSICION_KIT',
          records: this.models.COMPOSICION_KIT.all()
        });
      }

      return persistenceOk({
        seedEntries,
        tableCount: seedEntries.length,
      });
    } catch (error) {
      return persistenceError(
        PERSISTENCE_ERROR_CODES.STORAGE_ERROR,
        error?.message || 'Unable to load reference data'
      );
    }
  }

  async saveKit(kitId, composition) {
    if (!this.models?.COMPOSICION_KIT) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, 'COMPOSICION_KIT model not available');
    }

    try {
      // 1. Remove existing components for this kit
      const existing = this.models.COMPOSICION_KIT.where(c => String(c.ID_Item_Padre) === String(kitId));
      const pk = this.models.COMPOSICION_KIT.primaryKey || 'ID_Composicion';
      for (const comp of existing) {
        this.models.COMPOSICION_KIT.deleteById(comp[pk]);
      }

      // 2. Create new components
      for (const comp of composition) {
        this.models.COMPOSICION_KIT.create({
          ...comp,
          ID_Composicion: comp.ID_Composicion || `COMP_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          ID_Item_Padre: kitId,
          Updated_At: new Date().toISOString()
        });
      }

      return persistenceOk({ kitId, count: composition.length });
    } catch (error) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, error?.message || 'Unable to save kit');
    }
  }

  async saveRules(itemId, rules) {
    if (!this.models?.REGLAS_NEGOCIO) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, 'REGLAS_NEGOCIO model not available');
    }

    try {
      // 1. Remove existing rules for this item
      const existing = this.models.REGLAS_NEGOCIO.where(r => String(r.ID_Item) === String(itemId));
      const pk = this.models.REGLAS_NEGOCIO.primaryKey || 'ID_Regla';
      for (const rule of existing) {
        this.models.REGLAS_NEGOCIO.deleteById(rule[pk]);
      }

      // 2. Create new rules
      for (const rule of rules) {
        this.models.REGLAS_NEGOCIO.create({
          ...rule,
          ID_Regla: rule.ID_Regla || `RULE_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          ID_Item: itemId,
          Updated_At: new Date().toISOString()
        });
      }

      return persistenceOk({ itemId, count: rules.length });
    } catch (error) {
      return persistenceError(PERSISTENCE_ERROR_CODES.STORAGE_ERROR, error?.message || 'Unable to save rules');
    }
  }
}
