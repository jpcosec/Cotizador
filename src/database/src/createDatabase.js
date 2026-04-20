import { DATA_SCHEMA } from './Config_Schema.js';
import { ModelFactory } from './ModelFactory.js';
import { InMemoryStore } from './stores/InMemoryStore.js';

/**
 * Create a database instance backed by the given adapter.
 *
 * Supported adapters:
 * - 'memory' (default) — in-memory, suitable for tests and browser use
 *
 * @param {Object} [options]
 * @param {'memory'} [options.adapter='memory']
 * @param {Object} [options.adapterOptions={}]
 * @param {Object} [options.schema=DATA_SCHEMA]
 * @param {Array}  [options.seed=[]] - Array of { table, records[] } to pre-populate
 * @returns {{ adapter, schema, models }}
 */
export function createDatabase({ adapter = 'memory', adapterOptions = {}, schema = DATA_SCHEMA, seed = [] } = {}) {
  if (adapter !== 'memory') {
    throw new Error(`Unsupported adapter "${adapter}". Use: memory`);
  }

  const models = ModelFactory.createModels({
    schema,
    storeFactory: ({ tableName, columns }) => new InMemoryStore({ ...adapterOptions, tableName, columns })
  });

  for (const { table, records } of seed) {
    const model = models[table];
    if (!model) continue;
    for (const record of records) {
      model.create(record);
    }
  }

  return { adapter, schema, models };
}
