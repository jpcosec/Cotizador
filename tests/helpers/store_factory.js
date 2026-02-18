import { InMemoryStore } from '../../src/DataStore/InMemoryStore.js';
import { CLIENTS, CATEGORIES, PRICING_PROFILES, ITEMS } from '../fixtures/master_data.js';
import { COMPOSITIONS } from '../fixtures/compositions.js';
import { BUSINESS_RULES } from '../fixtures/rules.js';

export function createSeededStore() {
  const store = new InMemoryStore();
  store.seed('CLIENTES', CLIENTS);
  store.seed('CATEGORIAS', CATEGORIES);
  store.seed('PERFILES_PRECIO', PRICING_PROFILES);
  store.seed('ITEM_CATALOGO', ITEMS);
  store.seed('COMPOSICION_KIT', COMPOSITIONS);
  store.seed('REGLAS_NEGOCIO', BUSINESS_RULES);
  store.seed('AJUSTES_COTIZACION', []);
  return store;
}
