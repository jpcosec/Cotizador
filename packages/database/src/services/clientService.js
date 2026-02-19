/**
 * Client Service
 *
 * High-level business logic for client operations.
 * Uses Google Sheets as the backing store.
 */

import { getGasModels } from './databaseRuntime.js';

export class ClientService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  _getModel() {
    const models = getGasModels(this.spreadsheetId);
    return models.CLIENTES;
  }

  /**
   * Search clients by name (case-insensitive substring match)
   * @param {string} query - Search query
   * @returns {Array<Object>} Matching clients
   */
  searchClients(query) {
    try {
      const q = (query || '').toLowerCase();
      const model = this._getModel();

      return model.where((client) => {
        const nombre = String(client.Nombre_Empresa || '').toLowerCase();
        return nombre.includes(q);
      });
    } catch (error) {
      Logger.log('Error in searchClients: ' + error.toString());
      return [];
    }
  }

  /**
   * Find client by RUT
   * @param {string} rut
   * @returns {Object|null}
   */
  findClientByRut(rut) {
    try {
      const model = this._getModel();
      return model.find((client) => String(client.RUT) === String(rut));
    } catch (error) {
      Logger.log('Error in findClientByRut: ' + error.toString());
      return null;
    }
  }

  /**
   * Create a new client or return existing if RUT already exists
   * @param {Object} data - { nombre, rut, email, telefono }
   * @returns {Object} Created or existing client
   */
  createOrGetClient(data) {
    try {
      const model = this._getModel();

      // Check if client exists
      const existing = this.findClientByRut(data.rut);
      if (existing) {
        return existing;
      }

      // Create new client
      const clientId = 'CLI_' + Utilities.getUuid().substring(0, 8).toUpperCase();
      const now = new Date().toISOString();

      return model.create({
        ID_Cliente: clientId,
        Nombre_Empresa: data.nombre || '',
        RUT: data.rut || '',
        Email: data.email || '',
        Telefono: data.telefono || '',
        Updated_At: now
      });
    } catch (error) {
      Logger.log('Error in createOrGetClient: ' + error.toString());
      throw error;
    }
  }

  /**
   * Get client by ID
   * @param {string} clientId
   * @returns {Object|null}
   */
  getClientById(clientId) {
    try {
      const model = this._getModel();
      return model.findById(clientId);
    } catch (error) {
      Logger.log('Error in getClientById: ' + error.toString());
      return null;
    }
  }
}

export function createClientService(spreadsheetId) {
  return new ClientService(spreadsheetId);
}
