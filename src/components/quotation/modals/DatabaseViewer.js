import { ModalControllerBase } from '../../common/base/ui/ModalControllerBase.js';

export class DatabaseViewer extends ModalControllerBase {
  constructor(tables = {}) {
    super();
    this._tables = { ...tables };
    this._selectedTable = Object.keys(this._tables)[0] ?? null;
    this._filter = '';
  }

  setTables(tables = {}) {
    this._tables = { ...tables };
    if (!this._selectedTable) {
      this._selectedTable = Object.keys(this._tables)[0] ?? null;
    }
    return this;
  }

  selectTable(tableName) {
    if (tableName in this._tables) {
      this._selectedTable = tableName;
    }
    return this;
  }

  setFilter(term = '') {
    this._filter = String(term).toLowerCase().trim();
    return this;
  }

  getRows() {
    const rows = this._tables[this._selectedTable] ?? [];
    return [...rows];
  }

  getFilteredRows() {
    const rows = this.getRows();
    if (!this._filter) {
      return rows;
    }

    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(this._filter));
  }

  validate() {
    return [];
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      tableNames: Object.keys(this._tables),
      selectedTable: this._selectedTable,
      rows: this.getFilteredRows(),
      isLoading: this.isLoading()
    };
  }
}

export function createDatabaseViewer(tables = {}) {
  return new DatabaseViewer(tables);
}
