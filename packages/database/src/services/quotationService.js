/**
 * Quotation Service
 *
 * High-level business logic for quotation operations.
 * Manages COTIZACIONES and LINEA_DETALLE sheets.
 */

import { getGasModels } from './databaseRuntime.js';

export class QuotationService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  _getModels() {
    return getGasModels(this.spreadsheetId);
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
      const models = this._getModels();
      const cotModel = models.COTIZACIONES;
      const lineaModel = models.LINEA_DETALLE;

      const cotizacionId = 'COT_' + Math.floor(Date.now() / 1000);
      const now = new Date().toISOString();

      // Add quotation header
      cotModel.create({
        ID_Cotizacion: cotizacionId,
        ID_Cliente: quotationData.ID_Cliente || '',
        Estado: quotationData.Estado || 'Borrador',
        Fecha_Evento: quotationData.Fecha_Evento || new Date().toISOString().split('T')[0],
        Duracion_Dias: quotationData.Duracion_Dias || 1,
        Pax_Global: quotationData.Pax_Global || 1,
        Updated_At: now
      });

      // Add line items with CORRECT column order
      // Order: ID_Linea, ID_Cotizacion, ID_Item, Estado_Linea, Dia_Numero, Hora_Inicio,
      //        Override_Pax, Override_Cantidad, Override_Duracion_Min, Comentarios, Updated_At
      for (let i = 0; i < lineItems.length; i++) {
        const linea = lineItems[i];
        const lineaId = cotizacionId + '_L' + (i + 1);

        lineaModel.create({
          ID_Linea: lineaId,
          ID_Cotizacion: cotizacionId,
          ID_Item: linea.ID_Item || '',
          Estado_Linea: linea.Estado_Linea || 'ACTIVA',
          Dia_Numero: linea.Dia_Numero || 1,
          Hora_Inicio: linea.Hora_Inicio || '09:00',
          Override_Pax: linea.Override_Pax || '',
          Override_Cantidad: linea.Override_Cantidad || '',
          Override_Duracion_Min: linea.Override_Duracion_Min || '',
          Comentarios: linea.Comentarios || '',
          Updated_At: now
        });
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
      const models = this._getModels();

      // Find quotation
      const cotizacion = models.COTIZACIONES.findById(cotizacionId);

      if (!cotizacion) {
        return { success: false, mensaje: 'Cotización no encontrada' };
      }

      // Find client
      const cliente = models.CLIENTES.findById(cotizacion.ID_Cliente);

      // Find line items
      const lineas = models.LINEA_DETALLE.where((linea) => linea.ID_Cotizacion === cotizacionId);

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
      const models = this._getModels();

      const lineaId = cotizacionId + '_L' + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();

      models.LINEA_DETALLE.create({
        ID_Linea: lineaId,
        ID_Cotizacion: cotizacionId,
        ID_Item: lineData.ID_Item || '',
        Estado_Linea: lineData.Estado_Linea || 'ACTIVA',
        Dia_Numero: lineData.Dia_Numero || 1,
        Hora_Inicio: lineData.Hora_Inicio || '09:00',
        Override_Pax: lineData.Override_Pax || '',
        Override_Cantidad: lineData.Override_Cantidad || '',
        Override_Duracion_Min: lineData.Override_Duracion_Min || '',
        Comentarios: lineData.Comentarios || '',
        Updated_At: now
      });

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

}

export function createQuotationService(spreadsheetId) {
  return new QuotationService(spreadsheetId);
}
