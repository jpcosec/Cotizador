import { InMemoryStore } from '../../src/DataStore/InMemoryStore.js';

/**
 * Creates a store with controlled test-specific pricing values.
 *
 * Used by pricing tests that need predictable, hardcoded values.
 * Values optimized for test assertions, not production use.
 *
 * For integration testing with GAS data, use the store from @claps/xstate
 */
export function createTestStore() {
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
    {
      ID_Perfil_Precio: 'PP_TICKET',
      Nombre: 'Ticket Precio',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 3529,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_BEBIDA',
      Nombre: 'Bebida Precio',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 1500,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_DJ',
      Nombre: 'DJ Precio',
      Costo_Base_Fijo: 200000,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_ACTIVIDAD',
      Nombre: 'Actividad Precio',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 8000,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_QTY',
      Nombre: 'Cantidad Precio',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 1000,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_SALON_CHINOOK',
      Nombre: 'Salón Chinook Profile',
      Costo_Base_Fijo: 385000,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_PER_UNIT_BEBIDA',
      Nombre: 'Bebida Per Unit',
      Costo_Base_Fijo: 0,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 3529,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_ACTIVITY_CAMINATA',
      Nombre: 'Caminata Activity',
      Costo_Base_Fijo: 300000,
      Costo_Unitario_Pax: 10000,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Perfil_Precio: 'PP_DJ_LARGE',
      Nombre: 'DJ Large Profile',
      Costo_Base_Fijo: 1200000,
      Costo_Unitario_Pax: 0,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now,
    },
  ]);

  // CATEGORIAS
  store.seed('CATEGORIAS', [
    {
      ID_Categoria: 'CAT_SALON',
      Nombre: 'Salones',
      ID_Perfil_Precio_Default: 'PP_SALON_BASE',
      Def_Requiere_Pax: false,
      Def_Requiere_Cant: false,
      Def_Requiere_Tiempo: true,
      Def_Requiere_Hora: true,
      Def_Duracion_Min: 480,
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
      Def_Requiere_Cant: true,
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

  // ITEM_CATALOGO
  store.seed('ITEM_CATALOGO', [
    {
      ID_Item: 'ITEM_CHINOOK',
      Nombre: 'Salón Chinook',
      ID_Categoria: 'CAT_SALON',
      ID_Perfil_Precio_Override: 'PP_SALON_CHINOOK',
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
      ID_Item: 'ITEM_COFFEE_INTER',
      Nombre: 'Café Intermedio',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_COFFEE_FULL',
      Nombre: 'Café Premium',
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
    {
      ID_Item: 'ITEM_A',
      Nombre: 'Item A',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_TICKET_CERVEZA',
      Nombre: 'Ticket Cerveza',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: 'PP_PER_UNIT_BEBIDA',
      Def_Unidades_Por_Pax_Override: 0.5,
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_BEBIDA_LATA',
      Nombre: 'Bebida Lata',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: 'PP_PER_UNIT_BEBIDA',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_DJ_LARGE',
      Nombre: 'DJ Large',
      ID_Categoria: 'CAT_SALON',
      ID_Perfil_Precio_Override: 'PP_DJ_LARGE',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_CAMINATA',
      Nombre: 'Caminata',
      ID_Categoria: 'CAT_COMIDA',
      ID_Perfil_Precio_Override: 'PP_ACTIVITY_CAMINATA',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_QTY',
      Nombre: 'Item with Quantity',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: 'PP_QTY',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_EXTRAS_1',
      Nombre: 'Extra Item 1',
      ID_Categoria: 'CAT_CAFE',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_EXTRAS_2',
      Nombre: 'Extra Item 2',
      ID_Categoria: 'CAT_SALON',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
    {
      ID_Item: 'ITEM_EXTRAS_3',
      Nombre: 'Extra Item 3',
      ID_Categoria: 'CAT_COMIDA',
      ID_Perfil_Precio_Override: '',
      Def_Unidades_Por_Pax_Override: '',
      Activo: true,
      Updated_At: now,
    },
  ]);

  // REGLAS_NEGOCIO - Add tax and adjustment rules
  store.seed('REGLAS_NEGOCIO', [
    {
      ID_Regla: 'R_IVA_19',
      Nombre: 'IVA',
      Etapa: 'IMPUESTO',
      Scope: 'COTIZACION',
      Tipo_Accion: 'SET_TAX',
      Hook: null,
      Condicion_JSON: '{}',
      Payload_JSON: { rate: 0.19, name: 'IVA' },
      Prioridad: 1,
      Acumulable: false,
      Activo: true,
      Updated_At: now,
    },
  ]);

  // COMPOSICION_KIT - 3-item pack for testing
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
      ID_Item_Hijo: 'ITEM_COFFEE_INTER',
      Cantidad: 1,
      Tipo_Precio: 'ABSORBIDO',
      Updated_At: now,
    },
    {
      ID_Composicion: 'COMP_003',
      ID_Item_Padre: 'PACK_COFFEE_COMPLETO',
      ID_Item_Hijo: 'ITEM_COFFEE_FULL',
      Cantidad: 0.5,
      Tipo_Precio: 'SUMAR',
      Updated_At: now,
    },
  ]);

  // CLIENTES - Test clients
  store.seed('CLIENTES', [
    {
      ID_Cliente: 'CLI_CORP',
      Nombre_Empresa: 'Corporate Client',
      RUT: '12.345.678-9',
      Email: 'corp@test.com',
      Telefono: '+56 2 1234 5678',
      Updated_At: now,
    },
    {
      ID_Cliente: 'CLI_WEDDING',
      Nombre_Empresa: 'Wedding Planner',
      RUT: '98.765.432-1',
      Email: 'wedding@test.com',
      Telefono: '+56 9 9876 5432',
      Updated_At: now,
    },
  ]);

  store.version = 'TEST_STORE_v1_2025_02_19';

  return store;
}
