import { InMemoryStore } from '../../src/DataStore/InMemoryStore.js';
import { createTestStore } from './test_store.js';

/**
 * Creates a seeded InMemoryStore with test-specific pricing values.
 *
 * Delegates to test_store.js which contains controlled values
 * optimized for pricing test assertions.
 *
 * Note: For integration with GAS data, see @claps/xstate createSeededStore()
 */
export function createSeededStore() {
  return createTestStore();
}

/**
 * Clone a store for isolated test scenarios.
 * (Deep clones all tables to ensure tests don't interfere with each other.)
 */
export function cloneStore(store) {
  const cloned = new InMemoryStore();
  const tableNames = ['CLIENTES', 'CATEGORIAS', 'PERFILES_PRECIO', 'ITEM_CATALOGO', 'COMPOSICION_KIT', 'REGLAS_NEGOCIO'];
  for (const name of tableNames) {
    const data = store.all(name);
    if (data.length > 0) {
      cloned.seed(name, JSON.parse(JSON.stringify(data)));
    }
  }
  cloned.version = store.version;
  return cloned;
}
