/**
 * Database Initialization Service
 *
 * Creates and initializes all Google Sheets tables with proper schema and seed data.
 * Call initializeSheetDb() from GAS editor console (one-time setup).
 */

import { SHEET_SCHEMA } from './sheetSchema.js';
import { clearGasModelsCache, getGasModels } from './databaseRuntime.js';

export class InitializeService {
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
      clearGasModelsCache();
      this.populateSeedData(ss.getId());

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
  static populateSeedData(spreadsheetId) {
    const now = new Date().toISOString();
    const models = getGasModels(spreadsheetId);

    // Seed PERFILES_PRECIO
    const perfiles = models.PERFILES_PRECIO;
    if (perfiles.all().length === 0) {
      perfiles.create({ ID_Perfil_Precio: 'PROF_COFFEE', Nombre: 'Coffee Intermedio', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 5500, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true, Updated_At: now });
      perfiles.create({ ID_Perfil_Precio: 'PROF_SALON', Nombre: 'Salón Standard', Costo_Base_Fijo: 220000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true, Updated_At: now });
      perfiles.create({ ID_Perfil_Precio: 'PROF_ALMUERZOS', Nombre: 'Almuerzos Buffet', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 15000, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true, Updated_At: now });
      Logger.log('✅ Seeded PERFILES_PRECIO');
    }

    // Seed CATEGORIAS
    const categorias = models.CATEGORIAS;
    if (categorias.all().length === 0) {
      categorias.create({ ID_Categoria: 'CAT_CAFE', Nombre: 'Cafés', ID_Perfil_Precio_Default: 'PROF_COFFEE', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false, Def_Duracion_Min: 0, Def_Unidades_Por_Pax: 1, Icono_UI: '☕', Activo: true, Updated_At: now });
      categorias.create({ ID_Categoria: 'CAT_SALONES', Nombre: 'Salones', ID_Perfil_Precio_Default: 'PROF_SALON', Def_Requiere_Pax: false, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true, Def_Duracion_Min: 240, Def_Unidades_Por_Pax: 1, Icono_UI: '🏛️', Activo: true, Updated_At: now });
      categorias.create({ ID_Categoria: 'CAT_COMIDAS', Nombre: 'Comidas', ID_Perfil_Precio_Default: 'PROF_ALMUERZOS', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true, Def_Duracion_Min: 120, Def_Unidades_Por_Pax: 1, Icono_UI: '🍽️', Activo: true, Updated_At: now });
      Logger.log('✅ Seeded CATEGORIAS');
    }

    // Seed ITEM_CATALOGO
    const items = models.ITEM_CATALOGO;
    if (items.all().length === 0) {
      items.create({ ID_Item: 'ITEM_COFFEE_INT', Nombre: 'Coffee Intermedio', ID_Categoria: 'CAT_CAFE', ID_Perfil_Precio_Override: '', Def_Unidades_Por_Pax_Override: '', Activo: true, Updated_At: now });
      items.create({ ID_Item: 'ITEM_SALON_FARIO', Nombre: 'Salón Fario', ID_Categoria: 'CAT_SALONES', ID_Perfil_Precio_Override: 'PROF_SALON', Def_Unidades_Por_Pax_Override: '', Activo: true, Updated_At: now });
      items.create({ ID_Item: 'ITEM_ALMUERZO_PARRILLA', Nombre: 'Almuerzos Buffet Parrilla', ID_Categoria: 'CAT_COMIDAS', ID_Perfil_Precio_Override: 'PROF_ALMUERZOS', Def_Unidades_Por_Pax_Override: '', Activo: true, Updated_At: now });
      Logger.log('✅ Seeded ITEM_CATALOGO');
    }

    // CLIENTES and COTIZACIONES are empty (users create them)
    Logger.log('✅ CLIENTES sheet ready (empty)');
    Logger.log('✅ COTIZACIONES sheet ready (empty)');
    Logger.log('✅ LINEA_DETALLE sheet ready (empty)');
  }

  /**
   * Delete only schema-managed sheets and recreate with headers.
   * Preserves non-database tabs in the spreadsheet.
   */
  static cleanAllTables(schema) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      Logger.log('=== Cleaning Database Tables ===');

       const schemaTableNames = Object.keys(schema || {});
       const schemaTableSet = new Set(schemaTableNames);

      // Delete only sheets that belong to schema tables.
      // Preserve non-schema tabs (dashboards, notes, manual tabs, etc).
      const allSheets = ss.getSheets();
      for (let i = allSheets.length - 1; i >= 0; i--) {
        const sheet = allSheets[i];
        const sheetName = sheet.getName();
        const isSchemaSheet = schemaTableSet.has(sheetName);
        if (!isSchemaSheet) {
          continue;
        }

        const remainingSheets = ss.getSheets().length;
        if (remainingSheets === 1) {
          // Google Sheets requires at least one tab at all times.
          // Clear if this is the only tab and it belongs to schema.
          sheet.clear();
          Logger.log('Cleared first sheet (keeping minimum 1 sheet)');
        } else {
          ss.deleteSheet(sheet);
          Logger.log('Deleted sheet: ' + sheetName);
        }
      }

      // Now recreate all sheets with headers
      Logger.log('Recreating all sheets...');
      for (const [tableName, tableSchema] of Object.entries(schema || {})) {
        const columns = tableSchema.columns;
        let sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          sheet = ss.insertSheet(tableName);
          Logger.log('Created sheet: ' + tableName);
        }

        // Clear any existing data
        sheet.clear();

        // Set headers (row 1)
        const headerNames = columns.map(col => col.name);
        sheet.getRange(1, 1, 1, headerNames.length).setValues([headerNames]);
        sheet.setFrozenRows(1);
        Logger.log('Headers set for: ' + tableName);
      }

      Logger.log('✅ All tables cleaned and recreated!');
      return { success: true, mensaje: 'All tables cleaned and recreated successfully' };
    } catch (error) {
      Logger.log('❌ Error during cleanup: ' + error.toString());
      throw error;
    }
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

export function initializeSheetDb() {
  if (typeof INIT_CSV_DATA_MAP !== 'undefined' && INIT_CSV_DATA_MAP) {
    return InitializeService.initializeFromCsv(INIT_CSV_DATA_MAP, SHEET_SCHEMA, {});
  }

  return InitializeService.initializeSheetDb();
}

export function validateSheetDb() {
  return InitializeService.validateSheetDb();
}

/**
 * Clean and recreate all tables wrapper
 * For use in GAS environment
 */
export function cleanAllTables(schema) {
  return InitializeService.cleanAllTables(schema);
}

/**
 * CSV-based initialization wrapper
 * For use in GAS environment
 */
export function initializeFromCsvFiles(csvDataMap, schema, columnMappings = {}) {
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

/**
 * Initialize from bundled init CSV map when available (GAS build artifact).
 */
export function initializeSheetDbFromInitCsv() {
  if (typeof INIT_CSV_DATA_MAP === 'undefined' || !INIT_CSV_DATA_MAP) {
    return {
      success: false,
      results: {},
      warnings: ['INIT_CSV_DATA_MAP is not available in this runtime'],
      stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 }
    };
  }

  return InitializeService.initializeFromCsv(INIT_CSV_DATA_MAP, SHEET_SCHEMA, {});
}
