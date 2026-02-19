/**
 * Quotation Service
 *
 * High-level business logic for quotation operations.
 * Manages COTIZACIONES and LINEA_DETALLE sheets.
 */

export class QuotationService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Create a new quotation with line items
   *
   * @param {Object} quotationData
   *   - ID_Cliente: string (FK to CLIENTES)
   *   - Fecha_Evento: string (YYYY-MM-DD)
   *   - Duracion_Dias: number
   *   - Pax_Global: number
   * @param {Array<Object>} lineItems
   *   - ID_Item: string (FK to ITEM_CATALOGO)
   *   - Dia_Numero: number (1..N)
   *   - Hora_Inicio: string (HH:MM)
   *   - Override_Pax: number (optional)
   *   - Override_Cantidad: number (optional)
   *   - Override_Duracion_Min: number (optional)
   *   - Comentarios: string (optional)
   * @returns {Object} { success: true, cotizacionId, mensaje }
   */
  createQuotation(quotationData, lineItems = []) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const cotSheet = ss.getSheetByName('COTIZACIONES');
      const lineaSheet = ss.getSheetByName('LINEA_DETALLE');

      if (!cotSheet || !lineaSheet) {
        throw new Error('COTIZACIONES or LINEA_DETALLE sheets not found.');
      }

      const cotizacionId = 'COT_' + Math.floor(Date.now() / 1000);
      const now = new Date().toISOString();

      // Add quotation header
      cotSheet.appendRow([
        cotizacionId,
        quotationData.ID_Cliente || '',
        quotationData.Estado || 'Borrador',
        quotationData.Fecha_Evento || new Date().toISOString().split('T')[0],
        quotationData.Duracion_Dias || 1,
        quotationData.Pax_Global || 1,
        now
      ]);

      // Add line items with CORRECT column order
      // Order: ID_Linea, ID_Cotizacion, ID_Item, Estado_Linea, Dia_Numero, Hora_Inicio,
      //        Override_Pax, Override_Cantidad, Override_Duracion_Min, Comentarios, Updated_At
      for (let i = 0; i < lineItems.length; i++) {
        const linea = lineItems[i];
        const lineaId = cotizacionId + '_L' + (i + 1);

        lineaSheet.appendRow([
          lineaId,
          cotizacionId,
          linea.ID_Item || '',
          linea.Estado_Linea || 'ACTIVA',
          linea.Dia_Numero || 1,
          linea.Hora_Inicio || '09:00',
          linea.Override_Pax || '',
          linea.Override_Cantidad || '',
          linea.Override_Duracion_Min || '',
          linea.Comentarios || '',
          now
        ]);
      }

      return {
        success: true,
        cotizacionId: cotizacionId,
        mensaje: 'Cotización guardada correctamente'
      };
    } catch (error) {
      Logger.log('Error in createQuotation: ' + error.toString());
      return {
        success: false,
        mensaje: error.toString()
      };
    }
  }

  /**
   * Load a quotation with all its line items and client info
   * @param {string} cotizacionId
   * @returns {Object} { success, cliente, quotation, lineas, ... }
   */
  loadQuotation(cotizacionId) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const cotSheet = ss.getSheetByName('COTIZACIONES');
      const lineaSheet = ss.getSheetByName('LINEA_DETALLE');
      const clientesSheet = ss.getSheetByName('CLIENTES');

      if (!cotSheet || !lineaSheet) {
        throw new Error('Data sheets not found.');
      }

      // Find quotation
      const cotData = cotSheet.getDataRange().getValues();
      const cotHeaders = cotData[0];
      const cotizacion = this._findRow(cotData, cotHeaders, 'ID_Cotizacion', cotizacionId);

      if (!cotizacion) {
        return { success: false, mensaje: 'Cotización no encontrada' };
      }

      // Find client
      let cliente = null;
      if (clientesSheet && clientesSheet.getLastRow() > 1) {
        const clientData = clientesSheet.getDataRange().getValues();
        const clientHeaders = clientData[0];
        cliente = this._findRow(clientData, clientHeaders, 'ID_Cliente', cotizacion.ID_Cliente);
      }

      // Find line items
      const lineaData = lineaSheet.getDataRange().getValues();
      const lineaHeaders = lineaData[0];
      const lineas = [];

      for (let i = 1; i < lineaData.length; i++) {
        const row = lineaData[i];
        const linea = this._rowToObject(row, lineaHeaders);
        if (linea.ID_Cotizacion === cotizacionId) {
          lineas.push(linea);
        }
      }

      return {
        success: true,
        cotizacion: cotizacion,
        cliente: cliente,
        lineas: lineas
      };
    } catch (error) {
      Logger.log('Error in loadQuotation: ' + error.toString());
      return { success: false, mensaje: error.toString() };
    }
  }

  /**
   * Add a line item to an existing quotation
   * @param {string} cotizacionId
   * @param {Object} lineData
   * @returns {Object} { success, lineaId, mensaje }
   */
  addLineItem(cotizacionId, lineData) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const lineaSheet = ss.getSheetByName('LINEA_DETALLE');

      if (!lineaSheet) {
        throw new Error('LINEA_DETALLE sheet not found.');
      }

      const lineaId = cotizacionId + '_L' + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();

      lineaSheet.appendRow([
        lineaId,
        cotizacionId,
        lineData.ID_Item || '',
        lineData.Estado_Linea || 'ACTIVA',
        lineData.Dia_Numero || 1,
        lineData.Hora_Inicio || '09:00',
        lineData.Override_Pax || '',
        lineData.Override_Cantidad || '',
        lineData.Override_Duracion_Min || '',
        lineData.Comentarios || '',
        now
      ]);

      return {
        success: true,
        lineaId: lineaId,
        mensaje: 'Línea agregada correctamente'
      };
    } catch (error) {
      Logger.log('Error in addLineItem: ' + error.toString());
      return { success: false, mensaje: error.toString() };
    }
  }

  /**
   * Helper: find row by column value
   * @private
   */
  _findRow(data, headers, columnName, value) {
    const colIdx = headers.indexOf(columnName);
    if (colIdx === -1) return null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colIdx]) === String(value)) {
        return this._rowToObject(data[i], headers);
      }
    }
    return null;
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

export function createQuotationService(spreadsheetId) {
  return new QuotationService(spreadsheetId);
}
