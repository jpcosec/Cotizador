/**
 * Client Service
 *
 * High-level business logic for client operations.
 * Uses Google Sheets as the backing store.
 */

export class ClientService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Search clients by name (case-insensitive substring match)
   * @param {string} query - Search query
   * @returns {Array<Object>} Matching clients
   */
  searchClients(query) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CLIENTES');

      if (!sheet || sheet.getLastRow() <= 1) {
        return [];
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const nombreIdx = headers.indexOf('Nombre_Empresa');

      if (nombreIdx === -1) return [];

      const q = (query || '').toLowerCase();
      const results = [];

      for (let i = 1; i < data.length; i++) {
        const nombre = String(data[i][nombreIdx] || '').toLowerCase();
        if (nombre.includes(q)) {
          const client = this._rowToObject(data[i], headers);
          results.push(client);
        }
      }

      return results;
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
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CLIENTES');

      if (!sheet || sheet.getLastRow() <= 1) {
        return null;
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rutIdx = headers.indexOf('RUT');

      if (rutIdx === -1) return null;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][rutIdx]) === String(rut)) {
          return this._rowToObject(data[i], headers);
        }
      }

      return null;
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
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CLIENTES');

      if (!sheet) {
        throw new Error('CLIENTES sheet not found. Run initializeSheetDb() first.');
      }

      // Check if client exists
      const existing = this.findClientByRut(data.rut);
      if (existing) {
        return existing;
      }

      // Create new client
      const clientId = 'CLI_' + Utilities.getUuid().substring(0, 8).toUpperCase();
      const now = new Date().toISOString();

      sheet.appendRow([
        clientId,
        data.nombre || '',
        data.rut || '',
        data.email || '',
        data.telefono || '',
        now
      ]);

      return {
        ID_Cliente: clientId,
        Nombre_Empresa: data.nombre,
        RUT: data.rut,
        Email: data.email,
        Telefono: data.telefono,
        Updated_At: now
      };
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
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CLIENTES');

      if (!sheet || sheet.getLastRow() <= 1) {
        return null;
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIdx = headers.indexOf('ID_Cliente');

      if (idIdx === -1) return null;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === clientId) {
          return this._rowToObject(data[i], headers);
        }
      }

      return null;
    } catch (error) {
      Logger.log('Error in getClientById: ' + error.toString());
      return null;
    }
  }

  /**
   * Helper: convert sheet row to object
   * @private
   */
  _rowToObject(row, headers) {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx];
    });
    return obj;
  }
}

export function createClientService(spreadsheetId) {
  return new ClientService(spreadsheetId);
}
