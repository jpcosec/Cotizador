#!/usr/bin/env node

/**
 * GAS Code Generator
 *
 * Generates gas/Code.gs from packages/database/src/gasAdapter.js
 *
 * Run via: npm run build:gas
 * Includes: All service layer functions + initialization code
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/**
 * Extract CONFIG_SCHEMA and filter to MVP tables only
 */
function generateMvpSheetSchema(configSource) {
  // Extract object literal
  const marker = 'export const DATA_SCHEMA =';
  const markerIndex = configSource.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('DATA_SCHEMA export marker not found in Config_Schema.js');
  }

  const startBrace = configSource.indexOf('{', markerIndex);
  let depth = 0;
  let endBrace = -1;

  for (let i = startBrace; i < configSource.length; i += 1) {
    const char = configSource[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      endBrace = i;
      break;
    }
  }

  const objectLiteral = configSource.slice(startBrace, endBrace + 1);

  // Parse the schema
  const CONFIG_SCHEMA = Function(`"use strict"; return (${objectLiteral});`)();

  // MVP tables only
  const MVP_TABLES = [
    'CLIENTES',
    'CATEGORIAS',
    'PERFILES_PRECIO',
    'ITEM_CATALOGO',
    'COTIZACIONES',
    'LINEA_DETALLE'
  ];

  // Build filtered schema object
  const schema = {};
  MVP_TABLES.forEach(tableName => {
    if (!CONFIG_SCHEMA[tableName]) {
      throw new Error(`Table ${tableName} not found in CONFIG_SCHEMA`);
    }
    schema[tableName] = CONFIG_SCHEMA[tableName];
  });

  // Generate JavaScript object literal
  return `const SHEET_SCHEMA = ${JSON.stringify(schema, null, 2)};`;
}

// Read source files
const catalogServicePath = path.join(root, 'packages/database/src/services/catalogService.js');
const clientServicePath = path.join(root, 'packages/database/src/services/clientService.js');
const quotationServicePath = path.join(root, 'packages/database/src/services/quotationService.js');
const initServicePath = path.join(root, 'packages/database/src/services/initializeService.js');
const configSchemaPath = path.join(root, 'src/Config/Config_Schema.js');

const outPath = path.join(root, 'gas', 'Code.gs');

try {
  // Read all source files
  const catalogService = fs.readFileSync(catalogServicePath, 'utf8');
  const clientService = fs.readFileSync(clientServicePath, 'utf8');
  const quotationService = fs.readFileSync(quotationServicePath, 'utf8');
  const initService = fs.readFileSync(initServicePath, 'utf8');
  const configSchema = fs.readFileSync(configSchemaPath, 'utf8');

  // Remove import/export statements (GAS doesn't support ES modules)
  const cleanCatalogService = removeImportsExports(catalogService);
  const cleanClientService = removeImportsExports(clientService);
  const cleanQuotationService = removeImportsExports(quotationService);
  const cleanInitService = removeImportsExports(initService);

  // Extract and filter CONFIG_SCHEMA to MVP tables only
  const sheetSchema = generateMvpSheetSchema(configSchema);

  // Generate Code.gs
  const code = `/**
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

${sheetSchema}

// ============================================================================
// INITIALIZATION SERVICE
// ============================================================================

${cleanInitService}

// ============================================================================
// CATALOG SERVICE
// ============================================================================

${cleanCatalogService}

// ============================================================================
// CLIENT SERVICE
// ============================================================================

${cleanClientService}

// ============================================================================
// QUOTATION SERVICE
// ============================================================================

${cleanQuotationService}

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
`;

  // Write Code.gs
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, code, 'utf8');

  console.log('✅ Generated gas/Code.gs from service layer');
  console.log('   Lines: ' + code.split('\n').length);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: clasp push');
  console.log('  2. Open Apps Script editor');
  console.log('  3. Run from console: initializeSheetDb()');
  console.log('  4. Verify sheets in Google Sheets UI');
  console.log('  5. Test frontend data loading');

} catch (error) {
  console.error('❌ Error generating Code.gs:', error.message);
  process.exit(1);
}

/**
 * Remove import/export statements for GAS compatibility
 */
function removeImportsExports(source) {
  return source
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Remove import statements entirely
      if (trimmed.startsWith('import ')) return '';
      // Remove export keyword but keep the declaration
      if (trimmed.startsWith('export ')) {
        return line.replace(/\bexport\s+/, '');
      }
      // Remove module.exports
      if (trimmed.startsWith('module.exports')) return '';
      return line;
    })
    .join('\n');
}
