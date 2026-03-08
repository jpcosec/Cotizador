import { createQuotationInternalRuntime } from '../apps/quotation/state/createQuotationInternalRuntime.js';
import { seedToResolverDb } from '../packages/database/src/playgroundAdapter.js';
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

export function createQuotationRuntime(options = {}) {
  const sourceSeedEntries = options.seedEntries
    ? normalizeSeedEntries(options.seedEntries)
    : seedEntriesFromTables(options.seedTables || LOCAL_INIT_TABLES);

  const db = options.db || seedToResolverDb(sourceSeedEntries);
  const clients = options.clients || extractClients(sourceSeedEntries);

  return createQuotationInternalRuntime({
    db,
    clients,
    initialSettings: options.initialSettings || {},
  });
}
