import { DATA_SCHEMA } from './schema.js';
import { ModelFactory } from './ModelFactory.js';
import { InMemoryStore } from './stores/InMemoryStore.js';
import { GasSheetStore } from './stores/GasSheetStore.js';
import { FileStore } from './stores/FileStore.js';
import { seedFromCsvConfig, seedFromV1Csv } from './csvSeed.js';

function resolveStoreClass(adapter) {
  if (adapter === 'memory') return InMemoryStore;
  if (adapter === 'gas') return GasSheetStore;
  if (adapter === 'file') return FileStore;

  throw new Error(`Unsupported adapter "${adapter}". Use: memory | gas | file`);
}

function runInitializationSeed({ models, seed }) {
  if (!seed) {
    return null;
  }

  if (seed.type === 'csv') {
    return {
      type: 'csv',
      result: seedFromCsvConfig({
        models,
        imports: seed.imports || []
      })
    };
  }

  if (seed.type === 'v1') {
    if (!seed.dataDir) {
      throw new Error('seed.type "v1" requires seed.dataDir');
    }

    return {
      type: 'v1',
      result: seedFromV1Csv({
        models,
        dataDir: seed.dataDir,
        truncate: seed.truncate !== false
      })
    };
  }

  throw new Error(`Unsupported seed.type "${seed.type}". Use: csv | v1`);
}

export function createDatabase({ adapter = 'memory', adapterOptions = {}, schema = DATA_SCHEMA, seed = null } = {}) {
  const StoreClass = resolveStoreClass(adapter);

  const models = ModelFactory.createModels({
    schema,
    storeFactory: ({ tableName, columns }) => {
      return new StoreClass({
        ...adapterOptions,
        tableName,
        columns
      });
    }
  });

  const seedSummary = runInitializationSeed({ models, seed });

  return {
    adapter,
    schema,
    models,
    seedSummary
  };
}
