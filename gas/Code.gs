/**
 * Code.gs - Google Apps Script Backend for Cotizador SF Lodge
 *
 * AUTO-GENERATED from packages/database/src/services/ and src/Config/Config_Schema.js
 * DO NOT EDIT MANUALLY - regenerate via: npm run build:gas
 *
 * This file provides server-side functions that the frontend calls via google.script.run
 * All functions are generated from the service layer for consistency and maintainability.
 * Schema is read directly from src/Config/Config_Schema.js (single source of truth).
 */

// ============================================================================
// SHEET SCHEMA DEFINITIONS (MVP Tables only - filtered from Config_Schema)
// ============================================================================

const SHEET_SCHEMA = {
  "CLIENTES": {
    "description": "Base de datos de clientes.",
    "columns": [
      {
        "name": "ID_Cliente",
        "type": "PK",
        "desc": "Identificador"
      },
      {
        "name": "Nombre_Empresa",
        "type": "TEXT",
        "desc": "Razón Social"
      },
      {
        "name": "RUT",
        "type": "TEXT",
        "desc": "Identificador Fiscal"
      },
      {
        "name": "Email",
        "type": "TEXT",
        "desc": "Contacto Principal"
      },
      {
        "name": "Telefono",
        "type": "TEXT",
        "desc": "Contacto"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "CATEGORIAS": {
    "description": "Configurador de dimensiones de pricing y defaults de UI por tipo de ítem.",
    "columns": [
      {
        "name": "ID_Categoria",
        "type": "PK",
        "desc": "Identificador categoría"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre visible"
      },
      {
        "name": "ID_Perfil_Precio_Default",
        "type": "FK",
        "ref": "PERFILES_PRECIO",
        "desc": "Perfil de precio base heredable"
      },
      {
        "name": "Def_Requiere_Pax",
        "type": "BOOLEAN",
        "desc": "Pricing depende de pax (P)"
      },
      {
        "name": "Def_Requiere_Cant",
        "type": "BOOLEAN",
        "desc": "Pricing depende de cantidad (Q)"
      },
      {
        "name": "Def_Requiere_Tiempo",
        "type": "BOOLEAN",
        "desc": "Pricing depende de tiempo (T)"
      },
      {
        "name": "Def_Requiere_Hora",
        "type": "BOOLEAN",
        "desc": "UI: mostrar selectores de hora"
      },
      {
        "name": "Def_Duracion_Min",
        "type": "INTEGER",
        "desc": "Duración default en minutos"
      },
      {
        "name": "Def_Unidades_Por_Pax",
        "type": "DECIMAL",
        "desc": "Calculador default: unidades por pax (ej: 0.33 = 1 cada 3)"
      },
      {
        "name": "Icono_UI",
        "type": "TEXT",
        "desc": "Nombre de icono para UI"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Vigencia"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "PERFILES_PRECIO": {
    "description": "Componentes base de precio. Fórmula: Neto = Base + (P * Cp) + (T * Ct) + (Q * Cq).",
    "columns": [
      {
        "name": "ID_Perfil_Precio",
        "type": "PK",
        "desc": "Identificador del perfil"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre legible (ej: Salon Base 4h)"
      },
      {
        "name": "Costo_Base_Fijo",
        "type": "MONEY",
        "desc": "Base fija"
      },
      {
        "name": "Costo_Unitario_Pax",
        "type": "MONEY",
        "desc": "Costo por pax"
      },
      {
        "name": "Costo_Unitario_Tiempo",
        "type": "MONEY",
        "desc": "Costo por minuto/hora"
      },
      {
        "name": "Costo_Unitario_Item",
        "type": "MONEY",
        "desc": "Costo por unidad/cantidad"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Vigencia"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "ITEM_CATALOGO": {
    "description": "Inventario vendible. Hereda dimensiones de categoría, permite override de precio y calculador.",
    "columns": [
      {
        "name": "ID_Item",
        "type": "PK",
        "desc": "SKU único"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre comercial"
      },
      {
        "name": "ID_Categoria",
        "type": "FK",
        "ref": "CATEGORIAS",
        "desc": "Categoría base"
      },
      {
        "name": "ID_Perfil_Precio_Override",
        "type": "FK",
        "ref": "PERFILES_PRECIO",
        "desc": "Override de perfil de precio (si vacío, hereda de categoría)"
      },
      {
        "name": "Def_Unidades_Por_Pax_Override",
        "type": "DECIMAL",
        "desc": "Override del calculador unidades/pax"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Borrado lógico"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "COTIZACIONES": {
    "description": "Encabezados de venta. Sin campos calculados — los totales se computan en runtime.",
    "columns": [
      {
        "name": "ID_Cotizacion",
        "type": "PK",
        "desc": "Folio"
      },
      {
        "name": "ID_Cliente",
        "type": "FK",
        "ref": "CLIENTES",
        "desc": "Cliente"
      },
      {
        "name": "Estado",
        "type": "ENUM",
        "options": [
          "Borrador",
          "Enviada",
          "Pendiente_Aprobacion",
          "Aprobada",
          "Finalizada"
        ],
        "desc": "Workflow"
      },
      {
        "name": "Fecha_Evento",
        "type": "DATE",
        "desc": "Inicio del evento"
      },
      {
        "name": "Duracion_Dias",
        "type": "INTEGER",
        "desc": "Duración global"
      },
      {
        "name": "Pax_Global",
        "type": "INTEGER",
        "desc": "Pax base"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "LINEA_DETALLE": {
    "description": "Inputs de venta. Solo datos de entrada y overrides del usuario. Sin cálculos.",
    "columns": [
      {
        "name": "ID_Linea",
        "type": "PK",
        "desc": "ID único"
      },
      {
        "name": "ID_Cotizacion",
        "type": "FK",
        "ref": "COTIZACIONES",
        "desc": "Cotización padre"
      },
      {
        "name": "ID_Item",
        "type": "FK",
        "ref": "ITEM_CATALOGO",
        "desc": "Ítem de catálogo"
      },
      {
        "name": "Estado_Linea",
        "type": "ENUM",
        "options": [
          "ACTIVA",
          "REMOVIDA"
        ],
        "desc": "Estado de ciclo de vida; no se elimina historial"
      },
      {
        "name": "Dia_Numero",
        "type": "INTEGER",
        "desc": "Día relativo (1..N)"
      },
      {
        "name": "Hora_Inicio",
        "type": "TIME",
        "desc": "Inicio servicio (si aplica)"
      },
      {
        "name": "Override_Pax",
        "type": "INTEGER",
        "desc": "Pax override por usuario (nullable, si vacío usa global)"
      },
      {
        "name": "Override_Cantidad",
        "type": "DECIMAL",
        "desc": "Cantidad override por usuario (nullable, si vacío usa calculador)"
      },
      {
        "name": "Override_Duracion_Min",
        "type": "INTEGER",
        "desc": "Duración override en minutos (nullable, si vacío usa default)"
      },
      {
        "name": "Comentarios",
        "type": "TEXT",
        "desc": "Observaciones/justificación"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  }
};

// ============================================================================
// INITIALIZATION SERVICE
// ============================================================================

/**
 * Database Initialization Service
 *
 * Creates and initializes all Google Sheets tables with proper schema and seed data.
 * Call initializeSheetDb() from GAS editor console (one-time setup).
 */



class InitializeService {
  /**
   * Initialize the entire SheetDB
   *
   * Creates all sheets with proper columns and seed data.
   * Run this ONCE from the Apps Script editor console:
   * > initializeSheetDb()
   *
   * This is the entry point for GAS deployment.
   */
  static initializeSheetDb() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();

      Logger.log('=== Starting SheetDB Initialization ===');

      // Create sheets and add headers
      for (const [tableName, tableSchema] of Object.entries(SHEET_SCHEMA)) {
        const columns = tableSchema.columns;
        let sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          sheet = ss.insertSheet(tableName);
          Logger.log('✅ Created sheet: ' + tableName);
        } else {
          Logger.log('⚠️  Sheet already exists: ' + tableName);
        }

        // Set headers (row 1)
        const headerNames = columns.map(col => col.name);
        sheet.getRange(1, 1, 1, headerNames.length).setValues([headerNames]);
        sheet.setFrozenRows(1);
        Logger.log('   Headers set for: ' + tableName);
      }

      // Populate with seed data
      this.populateSeedData(ss);

      Logger.log('✅ Database initialization complete!');
      return { success: true, mensaje: 'Database initialized successfully' };
    } catch (error) {
      Logger.log('❌ Error during initialization: ' + error.toString());
      throw error;
    }
  }

  /**
   * Populate seed data into sheets
   * @private
   */
  static populateSeedData(ss) {
    const now = new Date().toISOString();

    // Seed PERFILES_PRECIO
    const priceSheet = ss.getSheetByName('PERFILES_PRECIO');
    if (priceSheet && priceSheet.getLastRow() === 1) {
      priceSheet.appendRow([
        'PROF_COFFEE', 'Coffee Intermedio', 0, 5500, 0, 0, true, now
      ]);
      priceSheet.appendRow([
        'PROF_SALON', 'Salón Standard', 220000, 0, 0, 0, true, now
      ]);
      priceSheet.appendRow([
        'PROF_ALMUERZOS', 'Almuerzos Buffet', 0, 15000, 0, 0, true, now
      ]);
      Logger.log('✅ Seeded PERFILES_PRECIO');
    }

    // Seed CATEGORIAS
    const catSheet = ss.getSheetByName('CATEGORIAS');
    if (catSheet && catSheet.getLastRow() === 1) {
      catSheet.appendRow([
        'CAT_CAFE', 'Cafés', 'PROF_COFFEE', true, false, false, false, 0, 1, '☕', true, now
      ]);
      catSheet.appendRow([
        'CAT_SALONES', 'Salones', 'PROF_SALON', false, false, false, true, 240, 1, '🏛️', true, now
      ]);
      catSheet.appendRow([
        'CAT_COMIDAS', 'Comidas', 'PROF_ALMUERZOS', true, false, false, true, 120, 1, '🍽️', true, now
      ]);
      Logger.log('✅ Seeded CATEGORIAS');
    }

    // Seed ITEM_CATALOGO
    const itemsSheet = ss.getSheetByName('ITEM_CATALOGO');
    if (itemsSheet && itemsSheet.getLastRow() === 1) {
      itemsSheet.appendRow([
        'ITEM_COFFEE_INT', 'Coffee Intermedio', 'CAT_CAFE', null, null, true, now
      ]);
      itemsSheet.appendRow([
        'ITEM_SALON_FARIO', 'Salón Fario', 'CAT_SALONES', 'PROF_SALON', null, true, now
      ]);
      itemsSheet.appendRow([
        'ITEM_ALMUERZO_PARRILLA', 'Almuerzos Buffet Parrilla', 'CAT_COMIDAS', 'PROF_ALMUERZOS', null, true, now
      ]);
      Logger.log('✅ Seeded ITEM_CATALOGO');
    }

    // CLIENTES and COTIZACIONES are empty (users create them)
    Logger.log('✅ CLIENTES sheet ready (empty)');
    Logger.log('✅ COTIZACIONES sheet ready (empty)');
    Logger.log('✅ LINEA_DETALLE sheet ready (empty)');
  }

  /**
   * Validate that all sheets exist and have correct columns
   * Useful for debugging after deployment
   */
  static validateSheetDb() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const results = [];

      for (const [tableName, tableSchema] of Object.entries(SHEET_SCHEMA)) {
        const sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          results.push('❌ ' + tableName + ': MISSING');
          continue;
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const expectedColumns = tableSchema.columns.map(col => col.name);
        const columnsMatch = JSON.stringify(headers) === JSON.stringify(expectedColumns);

        if (columnsMatch) {
          results.push('✅ ' + tableName + ': OK (' + headers.length + ' columns)');
        } else {
          results.push('⚠️  ' + tableName + ': Column mismatch');
          results.push('   Expected: ' + expectedColumns.join(', '));
          results.push('   Actual: ' + headers.join(', '));
        }
      }

      Logger.log('=== SheetDB Validation Results ===');
      results.forEach(r => Logger.log(r));
      return results;
    } catch (error) {
      Logger.log('❌ Error during validation: ' + error.toString());
      return ['Error: ' + error.toString()];
    }
  }

  /**
   * Initialize from CSV data map
   * Alternative to initializeSheetDb() for data migration
   *
   * @param {Object} csvDataMap - { tableName: csvDataString }
   * @param {Object} schema - SHEET_SCHEMA with table definitions
   * @param {Object} columnMappings - Optional: { tableName: { csvCol: schemaCol } }
   * @returns {Object} { success, results, warnings, stats }
   */
  static initializeFromCsv(csvDataMap, schema, columnMappings = {}) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const results = {};
      const warnings = [];
      const stats = { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 };

      Logger.log('=== Starting CSV-based Database Initialization ===');

      // Create sheets with headers from schema
      for (const [tableName, tableSchema] of Object.entries(schema)) {
        let sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          sheet = ss.insertSheet(tableName);
          Logger.log('✅ Created sheet: ' + tableName);
          stats.tablesCreated++;
        } else {
          Logger.log('⚠️  Sheet already exists: ' + tableName);
        }

        // Set headers
        const columnNames = tableSchema.columns.map(col => col.name);
        sheet.getRange(1, 1, 1, columnNames.length).setValues([columnNames]);
        sheet.setFrozenRows(1);

        // Migrate and insert CSV data if available
        if (csvDataMap[tableName]) {
          try {
            const migration = this._migrateFromCsv(
              csvDataMap[tableName],
              tableSchema,
              columnMappings[tableName] || {}
            );

            if (migration.success && migration.rows.length > 0) {
              // Insert data
              const dataRows = migration.rows.map(row =>
                columnNames.map(col => row[col] || '')
              );
              sheet.getRange(2, 1, dataRows.length, columnNames.length)
                .setValues(dataRows);

              stats.rowsMigrated += migration.rows.length;

              results[tableName] = {
                success: true,
                rowsMigrated: migration.rows.length,
                message: 'Imported ' + migration.rows.length + ' rows',
                issues: migration.issues
              };

              Logger.log('   Imported ' + migration.rows.length + ' rows');
            } else {
              results[tableName] = {
                success: migration.success,
                rowsMigrated: 0,
                message: migration.issues.length > 0 ? migration.issues[0] : 'No valid data',
                issues: migration.issues
              };

              stats.rowsSkipped += migration.stats.skipped;
            }

            if (migration.issues.length > 0) {
              warnings.push(tableName + ': ' + migration.issues.length + ' issues');
            }
          } catch (error) {
            results[tableName] = {
              success: false,
              rowsMigrated: 0,
              message: error.toString(),
              issues: [error.toString()]
            };
            Logger.log('   Error: ' + error.toString());
          }
        } else {
          results[tableName] = {
            success: true,
            rowsMigrated: 0,
            message: 'Sheet created (no CSV provided)'
          };
        }
      }

      Logger.log('✅ CSV-based initialization complete!');
      Logger.log('   Tables: ' + stats.tablesCreated + ', Rows: ' + stats.rowsMigrated);

      return { success: stats.tablesCreated > 0, results, warnings, stats };
    } catch (error) {
      Logger.log('❌ Error: ' + error.toString());
      return { success: false, results: {}, warnings: [error.toString()], stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 } };
    }
  }

  /**
   * Helper: Migrate CSV data to schema
   * @private
   */
  static _migrateFromCsv(csvData, schemaTable, columnMapping) {
    const issues = [];
    const stats = { total: 0, migrated: 0, skipped: 0 };

    // Parse CSV
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, rows: [], issues: ['No data rows'], stats };
    }

    // Parse headers
    const csvHeaders = this._parseCSVLine(lines[0]);
    const schemaColumns = schemaTable.columns.map(col => col.name);
    const mapping = this._buildColumnMapping(csvHeaders, schemaColumns, columnMapping);

    // Parse data
    const rows = [];
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      stats.total++;

      try {
        const csvValues = this._parseCSVLine(line);
        const row = {};

        // Map columns
        schemaTable.columns.forEach(schemaCol => {
          let value = '';
          const csvHeader = Object.keys(mapping).find(h => mapping[h].schemaCol === schemaCol.name);

          if (csvHeader && mapping[csvHeader].idx < csvValues.length) {
            value = csvValues[mapping[csvHeader].idx];
          }

          // Apply defaults
          if (!value || value === '') {
            if (schemaCol.name === 'Updated_At') {
              value = now;
            } else if (schemaCol.type === 'PK') {
              value = null; // Will skip
            }
          }

          row[schemaCol.name] = value;
        });

        // Validate PK
        const pkCol = schemaTable.columns.find(c => c.type === 'PK');
        if (!pkCol || !row[pkCol.name]) {
          stats.skipped++;
          continue;
        }

        rows.push(row);
        stats.migrated++;
      } catch (error) {
        issues.push('Row ' + i + ': ' + error.toString());
        stats.skipped++;
      }
    }

    return { success: stats.migrated > 0, rows, issues, stats };
  }

  /**
   * Helper: Parse CSV line
   * @private
   */
  static _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Helper: Build column mapping
   * @private
   */
  static _buildColumnMapping(csvHeaders, schemaColumns, customMapping) {
    const mapping = {};

    csvHeaders.forEach((csvHeader, idx) => {
      if (customMapping[csvHeader]) {
        mapping[csvHeader] = { schemaCol: customMapping[csvHeader], idx };
        return;
      }

      if (schemaColumns.includes(csvHeader)) {
        mapping[csvHeader] = { schemaCol: csvHeader, idx };
      }
    });

    return mapping;
  }
}

function initializeSheetDb() {
  return InitializeService.initializeSheetDb();
}

function validateSheetDb() {
  return InitializeService.validateSheetDb();
}

/**
 * CSV-based initialization wrapper
 * For use in GAS environment
 */
function initializeFromCsvFiles(csvDataMap, schema, columnMappings = {}) {
  // Import locally to avoid circular dependencies
  // This is called from GAS which will have csvMigrationService available
  try {
    return InitializeService.initializeFromCsv(csvDataMap, schema, columnMappings);
  } catch (error) {
    Logger.log('Error during CSV initialization: ' + error.toString());
    return {
      success: false,
      results: {},
      warnings: [error.toString()],
      stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 }
    };
  }
}


// ============================================================================
// CATALOG SERVICE
// ============================================================================

/**
 * Catalog Service
 *
 * High-level business logic for catalog operations.
 * Uses GasSheetStore as the backing store.
 */



class CatalogService {
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

function createCatalogService(spreadsheetId) {
  return new CatalogService(spreadsheetId);
}


// ============================================================================
// CLIENT SERVICE
// ============================================================================

/**
 * Client Service
 *
 * High-level business logic for client operations.
 * Uses Google Sheets as the backing store.
 */

class ClientService {
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

function createClientService(spreadsheetId) {
  return new ClientService(spreadsheetId);
}


// ============================================================================
// QUOTATION SERVICE
// ============================================================================

/**
 * Quotation Service
 *
 * High-level business logic for quotation operations.
 * Manages COTIZACIONES and LINEA_DETALLE sheets.
 */

class QuotationService {
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

function createQuotationService(spreadsheetId) {
  return new QuotationService(spreadsheetId);
}


// ============================================================================
// GAS FUNCTIONS EXPORTED TO FRONTEND
// ============================================================================

// Helper: Get spreadsheet ID
function getSpreadsheetId() {
  if (typeof SpreadsheetApp !== 'undefined') {
    return SpreadsheetApp.getActiveSpreadsheet().getId();
  }
  return null;
}

// --- INITIALIZATION ---
// Run once from Apps Script editor console:
// > initializeSheetDb()

(function() {
  // Expose global init functions
  window.initializeSheetDb = function() {
    return InitializeService.initializeSheetDb();
  };
  window.validateSheetDb = function() {
    return InitializeService.validateSheetDb();
  };
})();

// --- CATALOG API ---

/**
 * Get all catalog items with pricing
 * Called by: frontend cargarCatalogo()
 */
function getCatalogo() {
  const service = new CatalogService(getSpreadsheetId());
  return service.getCatalogo();
}

/**
 * Search catalog items
 */
function searchCatalogo(query) {
  const service = new CatalogService(getSpreadsheetId());
  return service.searchItems(query);
}

// --- CLIENT API ---

/**
 * Search clients by name
 */
function buscarCliente(query) {
  try {
    const service = new ClientService(getSpreadsheetId());
    return service.searchClients(query);
  } catch (error) {
    Logger.log('Error in buscarCliente: ' + error);
    throw error;
  }
}

/**
 * Create or get existing client
 */
function crearOObtenerCliente(data) {
  try {
    const service = new ClientService(getSpreadsheetId());
    return service.createOrGetClient(data);
  } catch (error) {
    Logger.log('Error in crearOObtenerCliente: ' + error);
    throw error;
  }
}

/**
 * Get client by ID
 */
function obtenerCliente(clientId) {
  try {
    const service = new ClientService(getSpreadsheetId());
    return service.getClientById(clientId);
  } catch (error) {
    Logger.log('Error in obtenerCliente: ' + error);
    return null;
  }
}

// --- QUOTATION API ---

/**
 * Save a new quotation
 */
function guardarCotizacion(quotationData, lineItems) {
  try {
    const service = new QuotationService(getSpreadsheetId());
    return service.createQuotation(quotationData, lineItems);
  } catch (error) {
    Logger.log('Error in guardarCotizacion: ' + error);
    return { success: false, mensaje: error.toString() };
  }
}

/**
 * Load a quotation
 */
function cargarCotizacion(cotizacionId) {
  try {
    const service = new QuotationService(getSpreadsheetId());
    return service.loadQuotation(cotizacionId);
  } catch (error) {
    Logger.log('Error in cargarCotizacion: ' + error);
    return { success: false, mensaje: error.toString() };
  }
}

/**
 * Add a line item to quotation
 */
function agregarLineaDetalle(cotizacionId, lineData) {
  try {
    const service = new QuotationService(getSpreadsheetId());
    return service.addLineItem(cotizacionId, lineData);
  } catch (error) {
    Logger.log('Error in agregarLineaDetalle: ' + error);
    return { success: false, mensaje: error.toString() };
  }
}

// --- UTILITIES ---

/**
 * Generate PDF for a quotation (placeholder)
 */
function generarPDF(cotizacionId) {
  try {
    return 'https://example.com/pdf/' + cotizacionId;
  } catch (error) {
    Logger.log('Error in generarPDF: ' + error);
    throw error;
  }
}

// ============================================================================
// UI ENTRY POINT
// ============================================================================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Cotizador SF Lodge v2');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
