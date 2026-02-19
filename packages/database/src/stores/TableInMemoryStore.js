export class TableInMemoryStore {
  constructor() {
    this._tables = new Map();
  }

  seed(tableName, rows) {
    this._tables.set(tableName, [...rows]);
  }

  insert(tableName, row) {
    if (!this._tables.has(tableName)) this._tables.set(tableName, []);
    this._tables.get(tableName).push(row);
  }

  all(tableName) {
    return this._tables.get(tableName) || [];
  }

  findById(tableName, pkField, id) {
    return this.all(tableName).find((row) => row[pkField] === id) || null;
  }

  findAll(tableName, filters = {}) {
    const entries = Object.entries(filters);
    if (!entries.length) return this.all(tableName);

    return this.all(tableName).filter((row) => entries.every(([key, value]) => row[key] === value));
  }

  findByFK(tableName, fkField, value) {
    return this.all(tableName).filter((row) => row[fkField] === value);
  }
}
