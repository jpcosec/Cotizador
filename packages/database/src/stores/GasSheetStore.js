import { IStore } from '../IStore.js';

function ensureSpreadsheetApp() {
  if (typeof SpreadsheetApp === 'undefined') {
    throw new Error('GasSheetStore requires Google Apps Script runtime (SpreadsheetApp global missing).');
  }
}

export class GasSheetStore extends IStore {
  constructor({ spreadsheetId, tableName, columns = [] }) {
    super();
    ensureSpreadsheetApp();
    this.tableName = tableName;
    this.columns = columns;
    this.primaryKey = (columns.find((c) => String(c.type || '').includes('PK')) || {}).name || '_id';

    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    this.sheet = this.spreadsheet.getSheetByName(tableName);

    if (!this.sheet) {
      throw new Error(`Sheet not found: ${tableName}`);
    }

    this.headerCache = null;
  }

  _getHeaders() {
    if (this.headerCache) return this.headerCache;
    const lastColumn = this.sheet.getLastColumn();
    this.headerCache = this.sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    return this.headerCache;
  }

  _rowToObject(row, headers) {
    const out = {};
    headers.forEach((header, index) => {
      out[header] = row[index];
    });
    return out;
  }

  _objectToRow(record, headers) {
    return headers.map((header) => record[header] ?? '');
  }

  all() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return [];

    const lastColumn = this.sheet.getLastColumn();
    const rows = this.sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    const headers = this._getHeaders();

    return rows.map((row) => this._rowToObject(row, headers));
  }

  where(predicate) {
    return this.all().filter((record) => predicate(record));
  }

  find(predicate) {
    const records = this.where(predicate);
    return records.length > 0 ? records[0] : null;
  }

  insert(data) {
    const headers = this._getHeaders();
    const row = this._objectToRow(data, headers);
    this.sheet.appendRow(row);
    return { ...data };
  }

  update(data) {
    const id = data[this.primaryKey];
    if (id === undefined || id === null || id === '') {
      throw new Error(`Missing primary key "${this.primaryKey}" for table "${this.tableName}"`);
    }

    const allRows = this.all();
    const headers = this._getHeaders();
    const index = allRows.findIndex((row) => String(row[this.primaryKey]) === String(id));

    if (index === -1) {
      throw new Error(`Record not found in "${this.tableName}" for id "${id}"`);
    }

    const sheetRow = index + 2;
    const rowValues = this._objectToRow(data, headers);
    this.sheet.getRange(sheetRow, 1, 1, headers.length).setValues([rowValues]);
    return { ...data };
  }

  deleteById(id) {
    const allRows = this.all();
    const index = allRows.findIndex((row) => String(row[this.primaryKey]) === String(id));
    if (index === -1) return false;

    const sheetRow = index + 2;
    this.sheet.deleteRow(sheetRow);
    return true;
  }

  truncate() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow > 1) {
      this.sheet.deleteRows(2, lastRow - 1);
    }
  }

  getColumns() {
    return this._getHeaders();
  }

  getByRowIndex(rowIndex) {
    const allRows = this.all();
    if (rowIndex < 0 || rowIndex >= allRows.length) return null;
    return allRows[rowIndex];
  }
}
