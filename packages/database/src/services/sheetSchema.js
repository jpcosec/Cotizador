/**
 * Sheet Schema for GAS Integration
 *
 * READS DIRECTLY from Config_Schema.js (src/Config/Config_Schema.js)
 * This is NOT a duplicate - it imports the source of truth with no table filtering.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load CONFIG_SCHEMA from source of truth
 */
function loadConfigSchema() {
  const schemaPath = path.resolve(__dirname, '../../../src/Config/Config_Schema.js');
  const source = fs.readFileSync(schemaPath, 'utf8');

  // Extract object literal (same logic as in packages/database/src/schema.js)
  const marker = 'export const DATA_SCHEMA =';
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('DATA_SCHEMA export marker not found in Config_Schema.js');
  }

  const startBrace = source.indexOf('{', markerIndex);
  let depth = 0;
  let endBrace = -1;

  for (let i = startBrace; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      endBrace = i;
      break;
    }
  }

  const objectLiteral = source.slice(startBrace, endBrace + 1);
  return Function(`"use strict"; return (${objectLiteral});`)();
}

/**
 * Load full CONFIG_SCHEMA (no filtering)
 */
function getSheetSchema() {
  return loadConfigSchema();
}

/**
 * SHEET_SCHEMA - reads from CONFIG_SCHEMA at runtime
 * Always in sync with source of truth
 */
export const SHEET_SCHEMA = getSheetSchema();

/**
 * Get sheet column names in order
 */
export function getSheetColumns(tableName) {
  const table = SHEET_SCHEMA[tableName];
  if (!table) {
    throw new Error(`Unknown table: ${tableName}`);
  }
  return table.columns.map(col => col.name);
}

/**
 * Convert sheet row to object
 */
export function rowToObject(row, columns) {
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj;
}

/**
 * Convert object to sheet row
 */
export function objectToRow(obj, columns) {
  return columns.map(col => obj[col] ?? '');
}
