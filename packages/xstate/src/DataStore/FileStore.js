import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data/quotations');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * File-based store adapter for quotations.
 * Saves quotations to JSON files in data/quotations/ directory.
 * Implements the InMemoryStore interface for master data (items, pricing, rules).
 */
export class FileStore {
  constructor() {
    this._memory = new Map(); // In-memory cache for master data
    this._loadAllQuotations();
  }

  _loadAllQuotations() {
    if (!fs.existsSync(DATA_DIR)) return;
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(DATA_DIR, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          this._memory.set(data.ID_Cotizacion, data);
        } catch (err) {
          console.error(`Failed to load quotation ${file}:`, err.message);
        }
      }
    });
  }

  // === InMemoryStore Interface ===

  /**
   * Seed a table with initial data (for master data: items, prices, rules).
   */
  seed(tableName, rows) {
    // Store directly without TABLE: prefix, to match InMemoryStore behavior
    this._memory.set(tableName, [...rows]);
  }

  /**
   * Insert a row into a table.
   * Special handling for CACHE_COTIZACION - saves to file.
   */
  insert(tableName, row) {
    // Special handling for quotations - save to file
    if (tableName === 'CACHE_COTIZACION') {
      const cotizacionId = row.ID_Cotizacion;
      const filePath = path.join(DATA_DIR, `${cotizacionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(row, null, 2));
      this._memory.set(cotizacionId, row);
      console.log(`✓ Quotation saved: ${filePath}`);
      return;
    }

    // For other tables, store in memory
    if (!this._memory.has(tableName)) {
      this._memory.set(tableName, []);
    }
    this._memory.get(tableName).push(row);
  }

  /**
   * Get all rows from a table.
   */
  all(tableName) {
    return this._memory.get(tableName) || [];
  }

  /**
   * Find a row by primary key.
   */
  findById(tableName, pkField, id) {
    return this.all(tableName).find(r => r[pkField] === id) || null;
  }

  /**
   * Find rows matching filters.
   */
  findAll(tableName, filters = {}) {
    const entries = Object.entries(filters);
    if (!entries.length) return this.all(tableName);
    return this.all(tableName).filter(r =>
      entries.every(([k, v]) => r[k] === v)
    );
  }

  /**
   * Find rows by foreign key.
   */
  findByFK(tableName, fkField, value) {
    return this.all(tableName).filter(r => r[fkField] === value);
  }

  // === FileStore-Specific Methods ===

  /**
   * Get a saved quotation file by ID.
   */
  getQuotationFile(cotizacionId) {
    const filePath = path.join(DATA_DIR, `${cotizacionId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`Failed to read quotation ${cotizacionId}:`, err.message);
      return null;
    }
  }

  /**
   * List all saved quotation IDs.
   */
  listQuotations() {
    if (!fs.existsSync(DATA_DIR)) return [];
    try {
      return fs.readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (err) {
      console.error('Failed to list quotations:', err.message);
      return [];
    }
  }

  /**
   * Delete a saved quotation.
   */
  deleteQuotation(cotizacionId) {
    const filePath = path.join(DATA_DIR, `${cotizacionId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        this._memory.delete(cotizacionId);
        console.log(`✓ Deleted quotation: ${cotizacionId}`);
      } catch (err) {
        console.error(`Failed to delete quotation ${cotizacionId}:`, err.message);
      }
    }
  }

  /**
   * Get quotation data directory path.
   */
  getDataDirectory() {
    return DATA_DIR;
  }
}
