/**
 * CSV Migration Service
 *
 * Handles loading CSV data from files and mapping to current schema.
 * Gracefully handles schema mismatches, missing columns, extra columns, type conversions.
 *
 * Used for data migration and historical data import into Google Sheets.
 */

export class CsvMigrationService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Load data from CSV and migrate to current schema
   *
   * @param {string} csvData - Raw CSV data (string)
   * @param {Object} schemaTable - Schema definition for target table { columns: [...] }
   * @param {Object} columnMapping - Optional: { csvColumn: schemaColumn } mapping
   * @returns {Object} { success, rows, issues, stats }
   */
  migrateFromCsv(csvData, schemaTable, columnMapping = {}) {
    try {
      const issues = [];
      const stats = { total: 0, migrated: 0, skipped: 0, warnings: 0 };

      // Parse CSV
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: false,
          rows: [],
          issues: ['CSV has no data rows'],
          stats
        };
      }

      // Parse headers
      const csvHeaders = this._parseCSVLine(lines[0]);
      const schemaColumns = schemaTable.columns.map(col => col.name);

      // Build column mapping (auto-detect or use provided)
      const mapping = this._buildColumnMapping(csvHeaders, schemaColumns, columnMapping);

      // Parse data rows
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        stats.total++;

        try {
          const csvValues = this._parseCSVLine(line);
          const row = this._mapRow(csvValues, csvHeaders, mapping, schemaTable, issues);

          if (row) {
            rows.push(row);
            stats.migrated++;
          } else {
            stats.skipped++;
          }
        } catch (error) {
          issues.push(`Row ${i}: ${error.message}`);
          stats.skipped++;
        }
      }

      return {
        success: stats.migrated > 0,
        rows,
        issues,
        stats,
        mapping // Return mapping for verification
      };
    } catch (error) {
      return {
        success: false,
        rows: [],
        issues: [error.toString()],
        stats: { total: 0, migrated: 0, skipped: 0, warnings: 0 }
      };
    }
  }

  /**
   * Insert migrated rows into a Google Sheet
   * Creates the sheet if it doesn't exist
   *
   * @param {string} tableName - Sheet name
   * @param {Array} rows - Migrated rows
   * @param {Array} schemaColumns - Column definitions
   * @returns {Object} { success, rowsInserted, mensaje }
   */
  insertIntoSheet(tableName, rows, schemaColumns) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(tableName);

      if (!sheet) {
        sheet = ss.insertSheet(tableName);
        Logger.log(`Created sheet: ${tableName}`);
      }

      if (sheet.getLastRow() > 1) {
        // Sheet has existing data
        const response = {
          success: false,
          rowsInserted: 0,
          mensaje: `Sheet ${tableName} already has data. Clear it first to import CSV data.`
        };
        Logger.log(response.mensaje);
        return response;
      }

      // Set headers
      const columnNames = schemaColumns.map(col => col.name);
      sheet.getRange(1, 1, 1, columnNames.length).setValues([columnNames]);
      sheet.setFrozenRows(1);

      // Insert data rows
      if (rows.length > 0) {
        const dataRows = rows.map(row => columnNames.map(col => row[col] ?? ''));
        sheet.getRange(2, 1, rows.length, columnNames.length).setValues(dataRows);
      }

      Logger.log(`Inserted ${rows.length} rows into ${tableName}`);

      return {
        success: true,
        rowsInserted: rows.length,
        mensaje: `Successfully imported ${rows.length} rows into ${tableName}`
      };
    } catch (error) {
      Logger.log(`Error inserting into ${tableName}: ${error}`);
      return {
        success: false,
        rowsInserted: 0,
        mensaje: error.toString()
      };
    }
  }

  /**
   * Helper: Parse CSV line (handles quoted values with commas)
   * @private
   */
  _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
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
   * Helper: Build column mapping from CSV to schema
   * Auto-detects by column name or uses provided mapping
   * @private
   */
  _buildColumnMapping(csvHeaders, schemaColumns, customMapping) {
    const mapping = {};

    // First pass: exact matches
    csvHeaders.forEach((csvHeader, idx) => {
      // Check custom mapping first
      if (customMapping[csvHeader]) {
        mapping[csvHeader] = { schemaCol: customMapping[csvHeader], idx };
        return;
      }

      // Auto-detect: exact match
      if (schemaColumns.includes(csvHeader)) {
        mapping[csvHeader] = { schemaCol: csvHeader, idx };
      }
    });

    // Second pass: partial/fuzzy matches
    csvHeaders.forEach((csvHeader, idx) => {
      if (mapping[csvHeader]) return; // Already mapped

      const csvLower = csvHeader.toLowerCase();
      const fuzzyMatch = schemaColumns.find(schemaCol =>
        schemaCol.toLowerCase().includes(csvLower) ||
        csvLower.includes(schemaCol.toLowerCase())
      );

      if (fuzzyMatch) {
        mapping[csvHeader] = { schemaCol: fuzzyMatch, idx };
      }
    });

    return mapping;
  }

  /**
   * Helper: Map a CSV row to schema row
   * @private
   */
  _mapRow(csvValues, csvHeaders, mapping, schemaTable, issues) {
    const row = {};
    const now = new Date().toISOString();

    // Map each schema column
    schemaTable.columns.forEach(schemaCol => {
      const colName = schemaCol.name;

      // Find matching CSV value
      let value = null;
      const csvHeader = Object.keys(mapping).find(
        h => mapping[h].schemaCol === colName
      );

      if (csvHeader && mapping[csvHeader].idx < csvValues.length) {
        value = csvValues[mapping[csvHeader].idx];
      }

      // Apply defaults/conversions
      if (!value || value === '') {
        // Handle empty values
        if (schemaCol.name === 'Updated_At') {
          value = now; // Default timestamp
        } else if (schemaCol.type === 'BOOLEAN') {
          value = false; // Default boolean
        } else if (schemaCol.type === 'INTEGER' || schemaCol.type === 'DECIMAL') {
          value = 0; // Default number
        } else if (schemaCol.type === 'PK') {
          // Primary keys must not be empty
          value = null;
        } else {
          value = '';
        }
      } else {
        // Type conversion
        switch (schemaCol.type) {
          case 'MONEY':
          case 'DECIMAL':
          case 'INTEGER':
            value = this._parseNumber(value);
            break;
          case 'BOOLEAN':
            value = this._parseBoolean(value);
            break;
          case 'DATE':
            value = this._parseDate(value);
            break;
          // TEXT, TIME, DATETIME, PK, FK, ENUM: use as-is
        }
      }

      row[colName] = value;
    });

    // Validate: check for required PKs
    const pkCol = schemaTable.columns.find(c => c.type === 'PK');
    if (pkCol && !row[pkCol.name]) {
      issues.push(`Missing primary key (${pkCol.name}): ${JSON.stringify(row)}`);
      return null;
    }

    return row;
  }

  /**
   * Helper: Parse number from string (handles currency format)
   * @private
   */
  _parseNumber(value) {
    if (!value) return 0;
    // Remove currency symbols and spaces
    const cleaned = String(value)
      .replace(/[$,\s]/g, '')
      .replace(/\./g, ''); // Remove thousand separators
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Helper: Parse boolean
   * @private
   */
  _parseBoolean(value) {
    if (!value) return false;
    const str = String(value).toLowerCase();
    return ['true', 'yes', '1', 'si', 'sí', 'activo'].includes(str);
  }

  /**
   * Helper: Parse date
   * @private
   */
  _parseDate(value) {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    } catch (e) {
      // Fall through
    }
    return String(value); // Return as-is if can't parse
  }
}

export function createCsvMigrationService(spreadsheetId) {
  return new CsvMigrationService(spreadsheetId);
}
