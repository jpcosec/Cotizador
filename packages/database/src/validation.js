/**
 * validation.js — schema-driven field and row validation.
 *
 * Derives rules from DATA_SCHEMA columns:
 *   - Required fields (non-nullable)
 *   - ENUM allowed-value checks
 *   - FK existence checks
 *
 * All validators are pure functions (no side effects, no I/O).
 */

import { DATA_SCHEMA } from './Config_Schema.js';

/**
 * Validate a single field value against the schema for its column.
 *
 * @param {string} tableName - One of the DATA_SCHEMA table keys
 * @param {string} fieldName - Column name
 * @param {*} value - Value to validate
 * @param {{ models: object }} context - { models } from createDatabase() for FK checks
 * @returns {string|null} Error message, or null if valid
 */
export function validateField(tableName, fieldName, value, context = {}) {
  const tableSchema = DATA_SCHEMA[tableName];
  if (!tableSchema) return null;

  const column = tableSchema.columns.find(c => c.name === fieldName);
  if (!column) return null;

  const isEmpty = value === null || value === undefined || value === '';

  // Required check — skip for nullable and PK (auto-assigned)
  if (!column.nullable && column.type !== 'PK' && column.type !== 'PK/FK') {
    // JSON, BOOLEAN, INTEGER, MONEY, DECIMAL: empty is invalid
    // TEXT fields that are nullable explicitly: skip
    if (isEmpty && column.type !== 'FK') {
      return 'Campo requerido';
    }
  }

  // ENUM check
  if (column.type === 'ENUM' && Array.isArray(column.options) && !isEmpty) {
    if (!column.options.includes(value)) {
      return `Valor no permitido. Opciones: ${column.options.join(', ')}`;
    }
  }

  // FK check (only when models are provided and value is not empty)
  if (column.type === 'FK' && !isEmpty && context.models) {
    const targetModel = context.models[column.ref];
    if (targetModel && !targetModel.findById(value)) {
      return `No existe referencia en ${column.ref}: "${value}"`;
    }
  }

  return null;
}

/**
 * Validate all fields of a row against the schema.
 *
 * @param {string} tableName - One of the DATA_SCHEMA table keys
 * @param {object} row - Row object to validate
 * @param {{ models: object }} context - { models } for FK checks
 * @returns {Record<string, string>} Map of fieldName → error (empty if all valid)
 */
export function validateRow(tableName, row, context = {}) {
  const tableSchema = DATA_SCHEMA[tableName];
  if (!tableSchema) return {};

  const errors = {};
  for (const column of tableSchema.columns) {
    const error = validateField(tableName, column.name, row[column.name], context);
    if (error) errors[column.name] = error;
  }
  return errors;
}

/**
 * Returns true if a validateRow result has no errors.
 * @param {Record<string, string>} errors
 */
export function isRowValid(errors) {
  return Object.keys(errors).length === 0;
}
