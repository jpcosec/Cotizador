/**
 * Catalog Service
 *
 * High-level business logic for catalog operations.
 * Uses GasSheetStore as the backing store.
 */

import { getGasModels } from './databaseRuntime.js';

export class CatalogService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  _getModels() {
    return getGasModels(this.spreadsheetId);
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
      const models = this._getModels();
      const items = models.ITEM_CATALOGO.all();
      const categories = models.CATEGORIAS.all();
      const profiles = models.PERFILES_PRECIO.all();

      const catMap = this._buildMapFromRecords(categories, 'ID_Categoria');
      const priceMap = this._buildMapFromRecords(profiles, 'ID_Perfil_Precio');

      // Build items with enriched data
      const out = [];
      for (const item of items) {
        const current = { ...item };

        // Only include active items
        if (current.Activo === false) continue;

        // Enrich with category info
        const categoria = catMap[current.ID_Categoria];
        if (categoria) {
          current._categoria = {
            ID_Categoria: categoria.ID_Categoria,
            Nombre: categoria.Nombre,
            Icono_UI: categoria.Icono_UI
          };
        }

        // Enrich with price profile
        // Use override if present, otherwise use category default
        const priceProfileId = current.ID_Perfil_Precio_Override || (categoria && categoria.ID_Perfil_Precio_Default);
        const priceProfile = priceMap[priceProfileId];
        if (priceProfile) {
          current._precioProfile = {
            ID_Perfil_Precio: priceProfile.ID_Perfil_Precio,
            Nombre: priceProfile.Nombre,
            Costo_Base_Fijo: priceProfile.Costo_Base_Fijo,
            Costo_Unitario_Pax: priceProfile.Costo_Unitario_Pax,
            Costo_Unitario_Tiempo: priceProfile.Costo_Unitario_Tiempo,
            Costo_Unitario_Item: priceProfile.Costo_Unitario_Item
          };

          // Calculate base price for display (simplified: just base cost)
          current.Precio_Base = priceProfile.Costo_Base_Fijo || 0;
        }

        out.push(current);
      }

      return out;
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
   * Returns raw reference tables required by pricing/XState runtime.
   *
   * This is used by frontend runtime hydration so catalog UI and pricing
   * resolve items/categories/profiles from the same source.
   *
   * @returns {{ITEM_CATALOGO:Array, CATEGORIAS:Array, PERFILES_PRECIO:Array, COMPOSICION_KIT:Array, REGLAS_NEGOCIO:Array}}
   */
  getPricingReferenceData() {
    try {
      const models = this._getModels();
      return {
        ITEM_CATALOGO: models.ITEM_CATALOGO.all(),
        CATEGORIAS: models.CATEGORIAS.all(),
        PERFILES_PRECIO: models.PERFILES_PRECIO.all(),
        COMPOSICION_KIT: models.COMPOSICION_KIT ? models.COMPOSICION_KIT.all() : [],
        REGLAS_NEGOCIO: models.REGLAS_NEGOCIO ? models.REGLAS_NEGOCIO.all() : []
      };
    } catch (error) {
      Logger.log('Error in getPricingReferenceData: ' + error.toString());
      return {
        ITEM_CATALOGO: [],
        CATEGORIAS: [],
        PERFILES_PRECIO: [],
        COMPOSICION_KIT: [],
        REGLAS_NEGOCIO: []
      };
    }
  }

  /**
   * Helper: build map from array by primary key
   * @private
   */
  _buildMapFromRecords(records, pkColumn) {
    const map = {};

    for (const record of records) {
      const pk = record[pkColumn];
      if (!pk) continue;

      map[String(pk)] = record;
    }

    return map;
  }
}

export function createCatalogService(spreadsheetId) {
  return new CatalogService(spreadsheetId);
}
