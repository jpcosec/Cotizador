import { DATA_SCHEMA } from './schema.js';
import { ModelFactory } from './ModelFactory.js';
import { InMemoryStore } from './stores/InMemoryStore.js';
import { GasSheetStore } from './stores/GasSheetStore.js';
import { FileStore } from './stores/FileStore.js';

function resolveStoreClass(adapter) {
  if (adapter === 'memory') return InMemoryStore;
  if (adapter === 'gas') return GasSheetStore;
  if (adapter === 'file') return FileStore;

  throw new Error(`Unsupported adapter "${adapter}". Use: memory | gas | file`);
}

export function createDatabase({ adapter = 'memory', adapterOptions = {}, schema = DATA_SCHEMA } = {}) {
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

  return {
    adapter,
    schema,
    models
  };
}
