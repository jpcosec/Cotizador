import fs from 'node:fs';
import path from 'node:path';
import { InMemoryStore } from './InMemoryStore.js';

export class FileStore extends InMemoryStore {
  constructor({ tableName, columns = [], baseDir = '.data' }) {
    super({ tableName, columns });
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, `${tableName}.json`);
    this._loadFromDisk();
  }

  _loadFromDisk() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      this._persistToDisk();
      return;
    }

    const raw = fs.readFileSync(this.filePath, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];

    for (const record of parsed) {
      const id = record[this.primaryKey];
      if (id !== undefined && id !== null && id !== '') {
        this.records.set(String(id), record);
        this._touchCounterFromId(id);
      }
    }
  }

  _persistToDisk() {
    const rows = Array.from(this.records.values());
    fs.writeFileSync(this.filePath, JSON.stringify(rows, null, 2), 'utf8');
  }

  insert(data) {
    const record = super.insert(data);
    this._persistToDisk();
    return record;
  }

  update(data) {
    const record = super.update(data);
    this._persistToDisk();
    return record;
  }

  deleteById(id) {
    const deleted = super.deleteById(id);
    this._persistToDisk();
    return deleted;
  }

  truncate() {
    super.truncate();
    this._persistToDisk();
  }
}
