import { InMemoryStore } from '../../../pricing/src/DataStore/InMemoryStore.js';

/**
 * Creates a seeded InMemoryStore with the same seed data as GAS initialization.
 *
 * This ensures LOCAL and GAS have identical reference data for consistent testing.
 * Source: packages/database/src/services/initializeService.js (populateSeedData)
 *
 * For tests requiring specific pricing values, see createPricingTestStore()
 *
 * Used across all test suites to ensure consistent store state.
 */
export function createSeededStore() {
  const store = new InMemoryStore();
  const now = new Date().toISOString();

  // ============================================================================
  // SEED DATA: Identical to GAS initialization (initializeService.js line 62)
  // ============================================================================

  // PERFILES_PRECIO - Pricing profiles (same as GAS)
  // Source: initializeService.js lines 67-72
  store.seed('PERFILES_PRECIO', [
    {
      ID_Perfil_Precio: 'PROF_COFFEE',
      Nombre: 'Coffee Intermedio',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 5500,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PROF_SALON',
      Nombre: 'Salón Standard',
      Costo_Base_Fijo: 220000,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PROF_ALMUERZOS',
      Nombre: 'Almuerzos Buffet',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 15000,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
  ]);

  // CATEGORIAS - Item categories (same as GAS)
  // Source: initializeService.js lines 76-81
  store.seed('CATEGORIAS', [
    {
      ID_Categoria: 'CAT_CAFE',
      Nombre: 'Cafés',
      ID_Perfil_Precio_Default: 'PROF_COFFEE',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: false,
      Def_Duracion_Min: 0,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: '☕',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Categoria: 'CAT_SALONES',
      Nombre: 'Salones',
      ID_Perfil_Precio_Default: 'PROF_SALON',
      Def_Requiere_Pax: false,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: true,
      Def_Duracion_Min: 240,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: '🏛️',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Categoria: 'CAT_COMIDAS',
      Nombre: 'Comidas',
      ID_Perfil_Precio_Default: 'PROF_ALMUERZOS',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: true,
      Def_Duracion_Min: 120,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: '🍽️',
      Activo: true,
      Updated_At: now,
    },
  ]);

  // ITEM_CATALOGO - Catalog items (GAS + test composition pack)
  // Source: initializeService.js lines 85-90, plus pack for composition testing
  store.seed('ITEM_CATALOGO', [
    {
      ID_Item: 'ITEM_COFFEE_INT',
      Nombre: 'Coffee Intermedio',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_SALON_FARIO',
      Nombre: 'Salón Fario',
      ID_Categoria: 'CAT_SALONES',
      ID_Perfil_Precio_Override: 'PROF_SALON',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_ALMUERZO_PARRILLA',
      Nombre: 'Almuerzos Buffet Parrilla',
      ID_Categoria: 'CAT_COMIDAS',
      ID_Perfil_Precio_Override: 'PROF_ALMUERZOS',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'PACK_COFFEE_COMPLETO',
      Nombre: 'Pack Café Completo',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
  ]);

  // CLIENTES - Empty (users create them)
  // Source: initializeService.js line 93
  store.seed('CLIENTES', []);

  // COMPOSICION_KIT - Kit compositions (for testing composition expansion)
  store.seed('COMPOSICION_KIT', [
    {
      ID_Composicion: 'COMP_001',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_COFFEE_INT',
      Cantidad: 1,
      Tipo_Precio: 'ABSORBIDO',
      Updated_At: now,
    },
    {
      ID_Composicion: 'COMP_002',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_ALMUERZO_PARRILLA',
      Cantidad: 0.5,
      Tipo_Precio: 'SUMAR',
      Updated_At: now,
    },
  ]);

  // REGLAS_NEGOCIO - Empty (GAS doesn't seed rules by default)
  // Source: initializeService.js doesn't seed this
  store.seed('REGLAS_NEGOCIO', []);

  // Add version property for determinism checking
  store.version = 'STORE_v1_GAS_SEED_2025_02_19';

  return store;
}

/**
 * Creates a store with controlled test-specific pricing values.
 *
 * For tests that need predictable, hardcoded values:
 * - SALON_BASE: 385000 fixed (test-friendly round number)
 * - CAFE_BASE: 6380 per pax
 * - ALMUERZO_BASE: 27311 per pax
 *
 * Same structure as GAS, but with test-optimized values.
 */
export function createPricingTestStore() {
  const store = new InMemoryStore();
  const now = new Date().toISOString();

  // PERFILES_PRECIO - Test-optimized values
  store.seed('PERFILES_PRECIO', [
    {
      ID_Perfil_Precio: 'PP_SALON_BASE',
      Nombre: 'Salón Chinook 4h',
      Costo_Base_Fijo: 385000,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 8333.33,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_CAFE_BASE',
      Nombre: 'Café Básico',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 6380,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_ALMUERZO_BASE',
      Nombre: 'Almuerzo',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 27311,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
  ]);

  // CATEGORIAS - Same as GAS but with test profile IDs
  store.seed('CATEGORIAS', [
    {
      ID_Categoria: 'CAT_SALON',
      Nombre: 'Salones',
      ID_Perfil_Precio_Default: 'PP_SALON_BASE',
      Def_Requiere_Pax: false,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: true,
      Def_Duracion_Min: 240,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: '🏛️',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Categoria: 'CAT_CAFE',
      Nombre: 'Cafés',
      ID_Perfil_Precio_Default: 'PP_CAFE_BASE',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: false,
      Def_Duracion_Min: 0,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: '☕',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Categoria: 'CAT_COMIDA',
      Nombre: 'Comidas',
      ID_Perfil_Precio_Default: 'PP_ALMUERZO_BASE',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: true,
      Def_Duracion_Min: 120,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: '🍽️',
      Activo: true,
      Updated_At: now,
    },
  ]);

  // ITEM_CATALOGO - Test items
  store.seed('ITEM_CATALOGO', [
    {
      ID_Item: 'ITEM_CHINOOK',
      Nombre: 'Salón Chinook',
      ID_Categoria: 'CAT_SALON',
      ID_Perfil_Precio_Override: 'PP_SALON_BASE',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_COFFEE_BASIC',
      Nombre: 'Café Básico',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_ALMUERZO',
      Nombre: 'Almuerzo Básico',
      ID_Categoria: 'CAT_COMIDA',
      ID_Perfil_Precio_Override: 'PP_ALMUERZO_BASE',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'PACK_COFFEE_COMPLETO',
      Nombre: 'Pack Café Completo',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
  ]);

  // COMPOSICION_KIT - Kit compositions for testing
  store.seed('COMPOSICION_KIT', [
    {
      ID_Composicion: 'COMP_001',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_COFFEE_BASIC',
      Cantidad: 1,
      Tipo_Precio: 'ABSORBIDO',
      Updated_At: now,
    },
    {
      ID_Composicion: 'COMP_002',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_ALMUERZO',
      Cantidad: 0.5,
      Tipo_Precio: 'SUMAR',
      Updated_At: now,
    },
  ]);

  // CLIENTES - Empty
  store.seed('CLIENTES', []);

  // REGLAS_NEGOCIO - Empty
  store.seed('REGLAS_NEGOCIO', []);

  store.version = 'STORE_v1_PRICING_TEST_2025_02_19';

  return store;
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
