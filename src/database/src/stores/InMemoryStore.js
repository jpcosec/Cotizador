import { IStore } from '../IStore.js';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function inferPrimaryKey(columns) {
  const pkColumn = columns.find((column) => String(column.type || '').includes('PK'));
  return pkColumn ? pkColumn.name : '_id';
}

export class InMemoryStore extends IStore {
  constructor({ tableName, columns = [] }) {
    super();
    this.tableName = tableName;
    this.columns = columns;
    this.primaryKey = inferPrimaryKey(columns);
    this.records = new Map();
    this.nextId = 1;
  }

  _generateId() {
    return `${this.tableName}_${this.nextId++}`;
  }

  _touchCounterFromId(id) {
    const match = String(id).match(/_(\d+)$/);
    if (!match) return;

    const seen = Number.parseInt(match[1], 10);
    if (Number.isInteger(seen) && seen >= this.nextId) {
      this.nextId = seen + 1;
    }
  }

  all() {
    return Array.from(this.records.values()).map((record) => deepClone(record));
  }

  where(predicate) {
    return this.all().filter((record) => predicate(record));
  }

  find(predicate) {
    const result = this.where(predicate);
    return result.length > 0 ? result[0] : null;
  }

  insert(data) {
    const record = deepClone(data || {});
    const existingId = record[this.primaryKey];

    if (existingId === undefined || existingId === null || existingId === '') {
      record[this.primaryKey] = this._generateId();
    } else {
      this._touchCounterFromId(existingId);
    }

    const id = record[this.primaryKey];
    this.records.set(String(id), record);
    return deepClone(record);
  }

  update(data) {
    const record = deepClone(data || {});
    const id = record[this.primaryKey];

    if (id === undefined || id === null || id === '') {
      throw new Error(`Missing primary key "${this.primaryKey}" for table "${this.tableName}"`);
    }

    if (!this.records.has(String(id))) {
      throw new Error(`Record not found in "${this.tableName}" for id "${id}"`);
    }

    this.records.set(String(id), record);
    return deepClone(record);
  }

  deleteById(id) {
    return this.records.delete(String(id));
  }

  truncate() {
    this.records.clear();
    this.nextId = 1;
  }

  getColumns() {
    return this.columns.map((column) => column.name);
  }

  getByRowIndex(rowIndex) {
    const all = this.all();
    if (rowIndex < 0 || rowIndex >= all.length) {
      return null;
    }

    return all[rowIndex];
  }
}
