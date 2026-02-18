import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_SCHEMA } from '../src/schema.js';
import { createDatabase } from '../src/createDatabase.js';

function getPrimaryKey(schemaTable) {
  const pk = (schemaTable.columns || []).find((column) => String(column.type || '').includes('PK'));
  return pk ? pk.name : '_id';
}

test('creates one model per table in DATA_SCHEMA', () => {
  const db = createDatabase({ adapter: 'memory' });

  const schemaTables = Object.keys(DATA_SCHEMA).sort();
  const modelTables = Object.keys(db.models).sort();

  assert.deepEqual(modelTables, schemaTables);
});

test('supports CRUD through generated models', () => {
  const db = createDatabase({ adapter: 'memory' });
  const clientes = db.models.CLIENTES;

  const created = clientes.create({
    Nombre_Empresa: 'Acme Events',
    Email: 'ops@acme.test'
  });

  assert.equal(typeof created.ID_Cliente, 'string');
  assert.equal(clientes.all().length, 1);

  const found = clientes.findById(created.ID_Cliente);
  assert.equal(found.Email, 'ops@acme.test');

  const updated = clientes.update({
    ...found,
    Email: 'finance@acme.test'
  });

  assert.equal(updated.Email, 'finance@acme.test');
  assert.equal(clientes.findById(created.ID_Cliente).Email, 'finance@acme.test');

  const deleted = clientes.deleteById(created.ID_Cliente);
  assert.equal(deleted, true);
  assert.equal(clientes.all().length, 0);
});

test('assigns IDs using each table primary key', () => {
  const db = createDatabase({ adapter: 'memory' });

  for (const [tableName, tableSchema] of Object.entries(DATA_SCHEMA)) {
    const model = db.models[tableName];
    const primaryKey = getPrimaryKey(tableSchema);

    const created = model.create({});
    assert.ok(created[primaryKey], `missing generated primary key for ${tableName}`);
  }
});

test('initializes from generic csv seed config', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-seed-'));
  const clientesCsvPath = path.join(tmpDir, 'clientes.csv');
  fs.writeFileSync(
    clientesCsvPath,
    'ID_Cliente,Nombre_Empresa,Email\nCLI-0001,Empresa Uno,uno@test.cl\nCLI-0002,Empresa Dos,dos@test.cl\n',
    'utf8'
  );

  const db = createDatabase({
    adapter: 'memory',
    seed: {
      type: 'csv',
      imports: [
        {
          tableName: 'CLIENTES',
          filePath: clientesCsvPath,
          truncate: true
        }
      ]
    }
  });

  assert.equal(db.models.CLIENTES.all().length, 2);
  assert.equal(db.models.CLIENTES.findById('CLI-0001').Nombre_Empresa, 'Empresa Uno');
  assert.equal(db.seedSummary.type, 'csv');
});

test('initializes from v1 CSV preset in data directory', () => {
  const dataDir = path.resolve(process.cwd(), '../../data');
  assert.equal(fs.existsSync(path.join(dataDir, 'Cotizador - CLIENTES.csv')), true);
  assert.equal(fs.existsSync(path.join(dataDir, 'Cotizador - Items.csv')), true);

  const db = createDatabase({
    adapter: 'memory',
    seed: {
      type: 'v1',
      dataDir,
      truncate: true
    }
  });

  assert.ok(db.models.CLIENTES.all().length > 0);
  assert.ok(db.models.CATEGORIAS.all().length > 0);
  assert.ok(db.models.ITEM_CATALOGO.all().length > 0);
  assert.equal(db.seedSummary.type, 'v1');
});
