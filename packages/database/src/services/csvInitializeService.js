/**
 * CSV Initialize Service
 *
 * Handles CSV-based initialization in Google Sheets.
 * Reads CSV data from a folder structure and migrates to current schema.
 * Used as an alternative to initializeSheetDb() for data migration scenarios.
 */

import { CsvMigrationService } from './csvMigrationService.js';

export class CsvInitializeService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.migrationService = new CsvMigrationService(spreadsheetId);
  }

  /**
   * Initialize database from CSV data
   *
   * @param {Object} csvDataMap - { tableName: csvData } map
   *   Example: { CLIENTES: "ID_Cliente,Nombre...\nCLI-1,...", ITEM_CATALOGO: "..." }
   * @param {Object} schema - SHEET_SCHEMA object with all table definitions
   * @param {Object} columnMappings - Optional: { tableName: { csvCol: schemaCol } }
   * @returns {Object} { success, results, warnings, stats }
   */
  initializeFromCsv(csvDataMap, schema, columnMappings = {}) {
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
          Logger.log(`✅ Created sheet: ${tableName}`);
          stats.tablesCreated++;
        } else {
          Logger.log(`⚠️  Sheet already exists: ${tableName}`);
        }

        // Set headers
        const columnNames = tableSchema.columns.map(col => col.name);
        sheet.getRange(1, 1, 1, columnNames.length).setValues([columnNames]);
        sheet.setFrozenRows(1);

        // Migrate and insert CSV data if available
        if (csvDataMap[tableName]) {
          const mapping = columnMappings[tableName] || {};
          const migration = this.migrationService.migrateFromCsv(
            csvDataMap[tableName],
            tableSchema,
            mapping
          );

          if (migration.success) {
            const insertResult = this.migrationService.insertIntoSheet(
              tableName,
              migration.rows,
              tableSchema.columns
            );

            results[tableName] = {
              success: insertResult.success,
              rowsMigrated: insertResult.rowsInserted,
              message: insertResult.mensaje,
              issues: migration.issues
            };

            stats.rowsMigrated += insertResult.rowsInserted;
            stats.rowsSkipped += migration.stats.skipped;

            if (migration.issues.length > 0) {
              warnings.push(`${tableName}: ${migration.issues.length} issues`);
            }

            Logger.log(`   ${insertResult.mensaje}`);
          } else {
            results[tableName] = {
              success: false,
              rowsMigrated: 0,
              message: 'No data to migrate',
              issues: migration.issues
            };

            Logger.log(`   No valid data in CSV for ${tableName}`);
          }
        } else {
          results[tableName] = {
            success: true,
            rowsMigrated: 0,
            message: 'Sheet created (no CSV data)'
          };

          Logger.log(`   Sheet ready (no CSV provided)`);
        }
      }

      Logger.log('✅ CSV-based database initialization complete!');
      Logger.log(`   Tables created: ${stats.tablesCreated}`);
      Logger.log(`   Rows migrated: ${stats.rowsMigrated}`);
      Logger.log(`   Rows skipped: ${stats.rowsSkipped}`);

      return {
        success: stats.tablesCreated > 0,
        results,
        warnings,
        stats
      };
    } catch (error) {
      Logger.log(`❌ Error during CSV initialization: ${error}`);
      return {
        success: false,
        results: {},
        warnings: [error.toString()],
        stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 }
      };
    }
  }

  /**
   * Import CSV data into an existing sheet
   * Appends to existing data or overwrites (if specified)
   *
   * @param {string} tableName - Target sheet name
   * @param {string} csvData - CSV data
   * @param {Object} schemaTable - Schema definition for table
   * @param {Object} columnMapping - Optional column mapping
   * @param {boolean} overwrite - If true, clear existing data first
   * @returns {Object} { success, rowsInserted, issues }
   */
  importCsvIntoTable(tableName, csvData, schemaTable, columnMapping = {}, overwrite = false) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(tableName);

      if (!sheet) {
        return {
          success: false,
          rowsInserted: 0,
          issues: [`Sheet ${tableName} does not exist`]
        };
      }

      // Optionally clear existing data
      if (overwrite && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
        Logger.log(`Cleared existing data in ${tableName}`);
      }

      // Migrate CSV data
      const migration = this.migrationService.migrateFromCsv(
        csvData,
        schemaTable,
        columnMapping
      );

      if (!migration.success) {
        return {
          success: false,
          rowsInserted: 0,
          issues: migration.issues
        };
      }

      // Insert rows
      const columnNames = schemaTable.columns.map(col => col.name);
      const startRow = sheet.getLastRow() + 1;
      const dataRows = migration.rows.map(row =>
        columnNames.map(col => row[col] ?? '')
      );

      if (dataRows.length > 0) {
        sheet.getRange(startRow, 1, dataRows.length, columnNames.length)
          .setValues(dataRows);
      }

      Logger.log(`Imported ${migration.stats.migrated} rows into ${tableName}`);

      return {
        success: true,
        rowsInserted: migration.stats.migrated,
        issues: migration.issues,
        stats: migration.stats
      };
    } catch (error) {
      Logger.log(`Error importing into ${tableName}: ${error}`);
      return {
        success: false,
        rowsInserted: 0,
        issues: [error.toString()]
      };
    }
  }

  /**
   * Validate CSV structure against schema
   * Returns mapping of CSV columns to schema columns
   *
   * @param {string} csvData - CSV data
   * @param {Object} schemaTable - Schema definition
   * @param {Object} customMapping - Optional custom mapping
   * @returns {Object} { csvColumns, mappedColumns, unmappedColumns, mapping }
   */
  validateCsvStructure(csvData, schemaTable, customMapping = {}) {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 1) {
        return { error: 'CSV is empty' };
      }

      const csvHeaders = this.migrationService._parseCSVLine(lines[0]);
      const schemaColumns = schemaTable.columns.map(col => col.name);
      const mapping = this.migrationService._buildColumnMapping(
        csvHeaders,
        schemaColumns,
        customMapping
      );

      const mappedColumns = Object.keys(mapping).map(csv => ({
        csv,
        schema: mapping[csv].schemaCol,
        idx: mapping[csv].idx
      }));

      const unmappedColumns = csvHeaders.filter(h => !mapping[h]).map((h, idx) => ({
        csv: h,
        idx
      }));

      const unmappedSchemaColumns = schemaColumns.filter(
        s => !mappedColumns.some(m => m.schema === s)
      );

      return {
        csvColumns: csvHeaders,
        mappedColumns,
        unmappedColumns,
        unmappedSchemaColumns,
        mapping,
        isValid: unmappedSchemaColumns.length === 0 // All schema columns must be mapped
      };
    } catch (error) {
      return { error: error.toString() };
    }
  }
}

export function createCsvInitializeService(spreadsheetId) {
  return new CsvInitializeService(spreadsheetId);
}
