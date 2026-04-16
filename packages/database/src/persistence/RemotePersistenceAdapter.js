import { PersistencePort } from './PersistencePort.js';

/**
 * RemotePersistenceAdapter
 * 
 * Redirects persistence calls to a remote endpoint (usually tools/serve-local.mjs).
 */
export class RemotePersistenceAdapter extends PersistencePort {
  constructor({ endpoint = '/api/google-script-run' } = {}) {
    super();
    this.endpoint = endpoint;
  }

  async #invoke(method, args = []) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, args }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: result?.error?.code || 'REMOTE_ERROR',
            message: result?.error?.message || `Remote request failed: ${response.status}`,
          }
        };
      }

      return result;
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error?.message || 'Network request failed',
        }
      };
    }
  }

  async save(payload) {
    return this.#invoke('guardarCotizacion', [payload]);
  }

  async load(id) {
    return this.#invoke('cargarCotizacion', [id]);
  }

  async listQuotations(query = {}) {
    return this.#invoke('buscarCotizaciones', [query]);
  }

  async loadReferenceData() {
    return this.#invoke('getReferenceData', []);
  }
}
