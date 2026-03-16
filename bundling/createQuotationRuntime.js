import { createQuotationInternalRuntime } from '../apps/quotation/state/createQuotationInternalRuntime.js';
import { createPersistedQuotationRuntime } from '../apps/quotation/state/createPersistedQuotationRuntime.js';
import { createDatabase } from '../packages/database/src/createDatabase.js';
import { seedToResolverDb } from '../packages/database/src/playgroundAdapter.js';
import { GasSheetAdapter } from '../packages/database/src/persistence/GasSheetAdapter.js';
import { LocalPersistenceAdapter } from '../packages/database/src/persistence/LocalPersistenceAdapter.js';
import { LOCAL_INIT_TABLES } from './generated/localInitTables.js';

function normalizeSeedEntries(seedEntries = []) {
  return (seedEntries || []).filter((entry) => entry && entry.table);
}

function seedEntriesFromTables(seedTables = {}) {
  return Object.entries(seedTables || {})
    .map(([table, records]) => ({
      table,
      records: Array.isArray(records) ? records : [],
    }))
    .sort((a, b) => a.table.localeCompare(b.table));
}

function extractClients(seedEntries = []) {
  const rows = seedEntries.find((entry) => entry.table === 'CLIENTES')?.records || [];
  return rows.map((row) => ({
    id: row.ID_Cliente,
    nombre: row.Nombre_Empresa,
    rut: row.RUT,
    email: row.Email,
    telefono: row.Telefono,
  }));
}

function hasGoogleScriptRun() {
  return !!globalThis?.google?.script?.run;
}

function createPersistencePort({
  persistencePort,
  persistenceMode,
  seedEntries,
}) {
  if (persistencePort) return persistencePort;

  const mode = String(persistenceMode || '').trim().toLowerCase();
  if (mode === 'gas' || (mode !== 'local' && hasGoogleScriptRun())) {
    return new GasSheetAdapter();
  }

  const db = createDatabase({ seed: seedEntries });
  return new LocalPersistenceAdapter({ models: db.models });
}

export function createQuotationRuntime(options = {}) {
  const sourceSeedEntries = options.seedEntries
    ? normalizeSeedEntries(options.seedEntries)
    : seedEntriesFromTables(options.seedTables || LOCAL_INIT_TABLES);

  const db = options.db || seedToResolverDb(sourceSeedEntries);
  const clients = options.clients || extractClients(sourceSeedEntries);
  const persistencePort = createPersistencePort({
    persistencePort: options.persistencePort,
    persistenceMode: options.persistenceMode,
    seedEntries: sourceSeedEntries,
  });

  return createPersistedQuotationRuntime({
    createRuntime(initialSettings = options.initialSettings || {}) {
      return createQuotationInternalRuntime({
        db,
        clients,
        initialSettings,
      });
    },
    persistencePort,
    idPolicy: options.idPolicy || null,
  });
}
