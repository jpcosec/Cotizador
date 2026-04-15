export const PERSISTENCE_ERROR_CODES = {
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  NOT_FOUND: 'NOT_FOUND',
  STORAGE_ERROR: 'STORAGE_ERROR',
};

export function persistenceOk(data) {
  return { ok: true, data };
}

export function persistenceError(code, message, details = null) {
  const error = { code, message };
  if (details !== null && details !== undefined) {
    error.details = details;
  }
  return { ok: false, error };
}

export class PersistencePort {
  async save(_payload) {
    throw new Error('PersistencePort.save not implemented');
  }

  async load(_id) {
    throw new Error('PersistencePort.load not implemented');
  }

  async listQuotations(_query) {
    return persistenceError(
      PERSISTENCE_ERROR_CODES.NOT_FOUND,
      'PersistencePort.listQuotations not implemented'
    );
  }

  async loadReferenceData() {
    return persistenceError(
      PERSISTENCE_ERROR_CODES.NOT_FOUND,
      'PersistencePort.loadReferenceData not implemented'
    );
  }
}
