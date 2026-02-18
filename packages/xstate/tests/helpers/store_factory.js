import { InMemoryStore } from '../../../claps_codelab_pricing/src/DataStore/InMemoryStore.js';

/**
 * Creates a seeded InMemoryStore with minimal test data.
 * Used across all test suites to ensure consistent store state.
 */
export function createSeededStore() {
  const store = new InMemoryStore();

  // CLIENTES
  store.seed('CLIENTES', [
    {
      ID_Cliente: 'CLI_CORP',
      Nombre_Empresa: 'Corporate Client Inc',
      RUT: '12.345.678-9',
      Email: 'corp@example.com',
      Telefono: '+56 2 1234 5678',
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Cliente: 'CLI_WEDDING',
      Nombre_Empresa: 'Wedding Planner Co',
      RUT: '98.765.432-1',
      Email: 'wedding@example.com',
      Telefono: '+56 9 9876 5432',
      Updated_At: '2025-01-01T00:00:00Z',
    },
  ]);

  // CATEGORIAS
  store.seed('CATEGORIAS', [
    {
      ID_Categoria: 'CAT_SALON',
      Nombre: 'Salones',
      ID_Perfil_Precio_Default: 'PP_SALON_BASE',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: true,
      Def_Requiere_Hora: true,
      Def_Duracion_Min: 240,
      Def_Unidades_Por_Pax: null,
      Icono_UI: 'building',
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Categoria: 'CAT_CAFE',
      Nombre: 'Cafés y Bebidas',
      ID_Perfil_Precio_Default: 'PP_CAFE_BASE',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: false,
      Def_Duracion_Min: null,
      Def_Unidades_Por_Pax: 0.5,
      Icono_UI: 'coffee',
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Categoria: 'CAT_COMIDA',
      Nombre: 'Almuerzos',
      ID_Perfil_Precio_Default: 'PP_ALMUERZO_BASE',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: false,
      Def_Requiere_Hora: false,
      Def_Duracion_Min: null,
      Def_Unidades_Por_Pax: 1,
      Icono_UI: 'utensils',
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
  ]);

  // PERFILES_PRECIO
  store.seed('PERFILES_PRECIO', [
    {
      ID_Perfil_Precio: 'PP_SALON_BASE',
      Nombre: 'Salón Chinook 4h',
      Costo_Base_Fijo: 385000,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 8333.33,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Perfil_Precio: 'PP_CAFE_BASE',
      Nombre: 'Café Básico',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 6380,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Perfil_Precio: 'PP_ALMUERZO_BASE',
      Nombre: 'Almuerzo',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 27311,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
  ]);

  // ITEM_CATALOGO
  store.seed('ITEM_CATALOGO', [
    {
      ID_Item: 'ITEM_CHINOOK',
      Nombre: 'Salón Chinook',
      ID_Categoria: 'CAT_SALON',
      ID_Perfil_Precio_Override: null,
      Def_Unidades_Por_Pax_Override: null,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Item: 'ITEM_COFFEE_BASIC',
      Nombre: 'Café Básico',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: null,
      Def_Unidades_Por_Pax_Override: null,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Item: 'ITEM_ALMUERZO',
      Nombre: 'Almuerzo Básico',
      ID_Categoria: 'CAT_COMIDA',
      ID_Perfil_Precio_Override: null,
      Def_Unidades_Por_Pax_Override: null,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Item: 'PACK_COFFEE_COMPLETO',
      Nombre: 'Pack Café Completo',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: null,
      Def_Unidades_Por_Pax_Override: null,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
  ]);

  // COMPOSICION_KIT - Pack expands into children
  store.seed('COMPOSICION_KIT', [
    {
      ID_Composicion: 'COMP_001',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_COFFEE_BASIC',
      Cantidad: 1,
      Tipo_Precio: 'ABSORBIDO',
      Updated_At: '2025-01-01T00:00:00Z',
    },
    {
      ID_Composicion: 'COMP_002',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_ALMUERZO',
      Cantidad: 0.5,
      Tipo_Precio: 'SUMAR',
      Updated_At: '2025-01-01T00:00:00Z',
    },
  ]);

  // REGLAS_NEGOCIO - Basic rules (IVA)
  store.seed('REGLAS_NEGOCIO', [
    {
      ID_Regla: 'R_IVA_19',
      Nombre: 'IVA 19%',
      Etapa: 'IMPUESTO',
      Scope: 'COTIZACION',
      Tipo_Accion: 'SET_TAX',
      Hook: null,
      Condicion_JSON: '{}',
      Payload_JSON: { rate: 0.19, name: 'IVA 19%' },
      Prioridad: 1,
      Acumulable: false,
      Activo: true,
      Updated_At: '2025-01-01T00:00:00Z',
    },
  ]);

  // Add version property for determinism checking
  store.version = 'TEST_STORE_v1_2025_02_18';

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
