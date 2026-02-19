/**
 * Catalog Service
 *
 * High-level business logic for catalog operations.
 * Uses GasSheetStore as the backing store.
 */

import { SHEET_SCHEMA } from './sheetSchema.js';

export class CatalogService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Get all catalog items with full pricing information
   *
   * Returns array of items with:
   * - ID_Item, Nombre
   * - Category info (ID_Categoria, Nombre)
   * - Price profile info (ID_Perfil_Precio, Nombre, Costo_Base_Fijo, etc.)
   * - Active status
   *
   * @returns {Array<Object>} Items with pricing details
   */
  getCatalogo() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();

      // Get all items
      const itemsSheet = ss.getSheetByName('ITEM_CATALOGO');
      if (!itemsSheet || itemsSheet.getLastRow() <= 1) {
        return [];
      }

      const itemsData = itemsSheet.getDataRange().getValues();
      const itemHeaders = itemsData[0];

      // Get categories
      const catSheet = ss.getSheetByName('CATEGORIAS');
      const catData = catSheet ? catSheet.getDataRange().getValues() : [];
      const catHeaders = catData[0] || [];
      const catMap = this._buildMap(catData, catHeaders, 'ID_Categoria');

      // Get price profiles
      const priceSheet = ss.getSheetByName('PERFILES_PRECIO');
      const priceData = priceSheet ? priceSheet.getDataRange().getValues() : [];
      const priceHeaders = priceData[0] || [];
      const priceMap = this._buildMap(priceData, priceHeaders, 'ID_Perfil_Precio');

      // Build items with enriched data
      const items = [];
      for (let i = 1; i < itemsData.length; i++) {
        const row = itemsData[i];
        const item = this._rowToObject(row, itemHeaders);

        // Only include active items
        if (item.Activo === false) continue;

        // Enrich with category info
        const categoria = catMap[item.ID_Categoria];
        if (categoria) {
          item._categoria = {
            ID_Categoria: categoria.ID_Categoria,
            Nombre: categoria.Nombre,
            Icono_UI: categoria.Icono_UI
          };
        }

        // Enrich with price profile
        // Use override if present, otherwise use category default
        const priceProfileId = item.ID_Perfil_Precio_Override || (categoria && categoria.ID_Perfil_Precio_Default);
        const priceProfile = priceMap[priceProfileId];
        if (priceProfile) {
          item._precioProfile = {
            ID_Perfil_Precio: priceProfile.ID_Perfil_Precio,
            Nombre: priceProfile.Nombre,
            Costo_Base_Fijo: priceProfile.Costo_Base_Fijo,
            Costo_Unitario_Pax: priceProfile.Costo_Unitario_Pax,
            Costo_Unitario_Tiempo: priceProfile.Costo_Unitario_Tiempo,
            Costo_Unitario_Item: priceProfile.Costo_Unitario_Item
          };

          // Calculate base price for display (simplified: just base cost)
          item.Precio_Base = priceProfile.Costo_Base_Fijo || 0;
        }

        items.push(item);
      }

      return items;
    } catch (error) {
      Logger.log('Error in getCatalogo: ' + error.toString());
      return [];
    }
  }

  /**
   * Get single item by ID with full enrichment
   * @param {string} itemId
   * @returns {Object|null}
   */
  getItemById(itemId) {
    const items = this.getCatalogo();
    return items.find(item => item.ID_Item === itemId) || null;
  }

  /**
   * Search items by name (case-insensitive)
   * @param {string} query
   * @returns {Array<Object>}
   */
  searchItems(query) {
    const q = (query || '').toLowerCase();
    const items = this.getCatalogo();
    return items.filter(item =>
      item.Nombre.toLowerCase().includes(q) ||
      (item._categoria && item._categoria.Nombre.toLowerCase().includes(q))
    );
  }

  /**
   * Helper: build map from array by primary key
   * @private
   */
  _buildMap(data, headers, pkColumn) {
    const map = {};
    const pkIdx = headers.indexOf(pkColumn);
    if (pkIdx === -1) return map;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const pk = row[pkIdx];
      if (!pk) continue;

      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx];
      });
      map[String(pk)] = obj;
    }
    return map;
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

export function createCatalogService(spreadsheetId) {
  return new CatalogService(spreadsheetId);
}
