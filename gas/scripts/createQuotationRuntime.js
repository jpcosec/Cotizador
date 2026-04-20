import { createQuotationInternalRuntime } from '../../src/state/createQuotationInternalRuntime.js';
import { createPersistedQuotationRuntime } from '../../src/state/createPersistedQuotationRuntime.js';
import { createDatabase } from '../../src/database/src/createDatabase.js';
import { seedToResolverDb } from '../../src/database/src/playgroundAdapter.js';
import { GasSheetAdapter } from '../../src/database/src/persistence/GasSheetAdapter.js';
import { LocalPersistenceAdapter } from '../../src/database/src/persistence/LocalPersistenceAdapter.js';
import { LOCAL_INIT_TABLES } from '../output/localInitTables.js';

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
  const seen = new Set();

  return rows
    .map((row) => ({
      id: row.ID_Cliente,
      nombre: row.Nombre_Empresa,
      rut: row.RUT,
      email: row.Email,
      telefono: row.Telefono,
    }))
    .filter((client) => {
      const id = String(client.id || '').trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function hasGoogleScriptRun() {
  return !!globalThis?.google?.script?.run;
}

function hasReferenceSeed(seedEntries = []) {
  return (seedEntries || []).some((entry) => {
    if (!entry || !entry.table) return false;
    if (!Array.isArray(entry.records)) return false;
    return entry.records.length > 0;
  });
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

  let runtimeSeedEntries = sourceSeedEntries;
  let runtimeDb = options.db || seedToResolverDb(runtimeSeedEntries);
  let runtimeClients = options.clients || extractClients(runtimeSeedEntries);

  const persistencePort = createPersistencePort({
    persistencePort: options.persistencePort,
    persistenceMode: options.persistenceMode,
    seedEntries: sourceSeedEntries,
  });

  const runtime = createPersistedQuotationRuntime({
    createRuntime(initialSettings = options.initialSettings || {}) {
      return createQuotationInternalRuntime({
        db: runtimeDb,
        clients: runtimeClients,
        initialSettings,
      });
    },
    persistencePort,
    idPolicy: options.idPolicy || null,
  });

  runtime.bootstrapReferenceData = async function bootstrapReferenceData() {
    if (options.disableRemoteReferenceData) {
      return { ok: false, skipped: true, reason: 'disabled' };
    }
    if (typeof persistencePort?.loadReferenceData !== 'function') {
      return { ok: false, skipped: true, reason: 'adapter-missing-method' };
    }

    const result = await persistencePort.loadReferenceData();
    if (!result?.ok) {
      return result || { ok: false, skipped: true, reason: 'adapter-error' };
    }

    const nextSeedEntries = normalizeSeedEntries(result?.data?.seedEntries || []);
    if (!hasReferenceSeed(nextSeedEntries)) {
      return { ok: false, skipped: true, reason: 'empty-reference-seed' };
    }

    runtimeSeedEntries = nextSeedEntries;
    runtimeDb = options.db || seedToResolverDb(runtimeSeedEntries);
    runtimeClients = options.clients || extractClients(runtimeSeedEntries);
    runtime.reinitialize(runtime.getSnapshot()?.settings || options.initialSettings || {});

    return {
      ok: true,
      data: {
        tables: runtimeSeedEntries.map((entry) => entry.table),
      },
    };
  };

  return runtime;
}
