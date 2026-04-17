import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase } from '../packages/database/src/createDatabase.js';
import { loadSeedFromCsvDir } from '../packages/database/src/csvSeed.js';
import { LocalPersistenceAdapter } from '../packages/database/src/persistence/LocalPersistenceAdapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_LOCAL_DB_PATH = path.resolve(__dirname, '../data/db.json');
export const DEFAULT_LOCAL_SEED_DIR = path.resolve(__dirname, '../data/init');

const SAVE_METHODS = new Set(['guardarCotizacion', 'guardarCotizacionV2', 'saveKit', 'saveRules']);
const LOAD_METHODS = new Set(['cargarCotizacion', 'cargarCotizacionV2']);
const LIST_METHODS = new Set(['buscarCotizaciones', 'buscarCotizacionesV2']);
const REFERENCE_METHODS = new Set(['getReferenceData', 'getReferenceDataV2']);

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function seedEntriesFromState(state = {}) {
  return Object.entries(state || {}).map(([table, records]) => ({
    table,
    records: Array.isArray(records) ? records : [],
  }));
}

function stateFromModels(models = {}) {
  const state = {};

  for (const [table, model] of Object.entries(models || {})) {
    state[table] = typeof model?.all === 'function' ? model.all() : [];
  }

  return state;
}

function normalizeState(rawState = {}) {
  const db = createDatabase({ seed: seedEntriesFromState(rawState) });
  return stateFromModels(db.models);
}

function createInitialState(seedDir) {
  const seed = loadSeedFromCsvDir(seedDir);
  const db = createDatabase({ seed });
  return stateFromModels(db.models);
}

export function readLocalDbState({
  dbFilePath = DEFAULT_LOCAL_DB_PATH,
  seedDir = DEFAULT_LOCAL_SEED_DIR,
} = {}) {
  ensureParentDirectory(dbFilePath);

  if (!fs.existsSync(dbFilePath)) {
    const initialState = createInitialState(seedDir);
    fs.writeFileSync(dbFilePath, JSON.stringify(initialState, null, 2), 'utf8');
    return initialState;
  }

  const raw = fs.readFileSync(dbFilePath, 'utf8').trim();
  const parsed = raw ? JSON.parse(raw) : {};
  const normalized = normalizeState(parsed);
  fs.writeFileSync(dbFilePath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

export function writeLocalDbState(state, { dbFilePath = DEFAULT_LOCAL_DB_PATH } = {}) {
  ensureParentDirectory(dbFilePath);
  fs.writeFileSync(dbFilePath, JSON.stringify(state, null, 2), 'utf8');
}

function createAdapterFromState(state) {
  const db = createDatabase({ seed: seedEntriesFromState(state) });
  return {
    db,
    adapter: new LocalPersistenceAdapter({ models: db.models }),
  };
}

function serializeDatabase(db) {
  return stateFromModels(db.models);
}

function healthcheck(dbFilePath) {
  return {
    ok: true,
    runtime: 'local-disk',
    dbFilePath,
  };
}

export async function executeLocalGasMethod(method, args = [], options = {}) {
  const dbFilePath = options.dbFilePath || DEFAULT_LOCAL_DB_PATH;
  const seedDir = options.seedDir || DEFAULT_LOCAL_SEED_DIR;
  const state = readLocalDbState({ dbFilePath, seedDir });
  const { db, adapter } = createAdapterFromState(state);

  if (method === 'healthcheck') {
    return healthcheck(dbFilePath);
  }

  let result;

  if (method === 'saveKit') {
    result = await adapter.saveKit(args[0], args[1]);
    if (result?.ok) {
      writeLocalDbState(serializeDatabase(db), { dbFilePath });
    }
    return result;
  }

  if (method === 'saveRules') {
    result = await adapter.saveRules(args[0], args[1]);
    if (result?.ok) {
      writeLocalDbState(serializeDatabase(db), { dbFilePath });
    }
    return result;
  }

  if (SAVE_METHODS.has(method)) {
    result = await adapter.save(args[0]);
    if (result?.ok) {
      writeLocalDbState(serializeDatabase(db), { dbFilePath });
    }
    return result;
  }

  if (LOAD_METHODS.has(method)) {
    return adapter.load(args[0]);
  }

  if (LIST_METHODS.has(method)) {
    return adapter.listQuotations(args[0] || {});
  }

  if (REFERENCE_METHODS.has(method)) {
    return adapter.loadReferenceData();
  }

  throw new Error(`Method not implemented in local server: ${String(method)}`);
}
