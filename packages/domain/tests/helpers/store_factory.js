/**
 * Test store factory for domain package tests.
 *
 * Re-exports the canonical xstate store factory so domain integration tests
 * share identical seed data with the xstate test suite.
 *
 * Use createPricingTestStore() for integration tests that assert specific
 * calculated prices (predictable round numbers).
 *
 * Use createSeededStore() for smoke tests and GAS-parity checks.
 */

import { TableInMemoryStore as InMemoryStore } from '../../../database/src/stores/TableInMemoryStore.js';

// ── Pricing test store ──────────────────────────────────────────────────────
// Items have no Costo_* on the row — pricing comes entirely from PERFILES_PRECIO.
// Profile field on item rows: ID_Perfil_Precio_Override (or falls back to category default).

export function createPricingTestStore() {
  const store = new InMemoryStore();
  const now   = new Date().toISOString();

  store.seed('PERFILES_PRECIO', [
    {
      ID_Perfil_Precio:       'PP_SALON_BASE',
      Nombre:                 'Salón Standard',
      Costo_Base_Fijo:        385000,
      Costo_Unitario_Pax:     0,
      Costo_Unitario_Tiempo:  0,
      Costo_Unitario_Item:    0,
      Activo: true, Updated_At: now,
    },
    {
      ID_Perfil_Precio:       'PP_CAFE_BASE',
      Nombre:                 'Café Básico',
      Costo_Base_Fijo:        0,
      Costo_Unitario_Pax:     6380,
      Costo_Unitario_Tiempo:  0,
      Costo_Unitario_Item:    0,
      Activo: true, Updated_At: now,
    },
    {
      ID_Perfil_Precio:       'PP_ALMUERZO_BASE',
      Nombre:                 'Almuerzo',
      Costo_Base_Fijo:        0,
      Costo_Unitario_Pax:     27311,
      Costo_Unitario_Tiempo:  0,
      Costo_Unitario_Item:    0,
      Activo: true, Updated_At: now,
    },
  ]);

  store.seed('CATEGORIAS', [
    {
      ID_Categoria:              'CAT_SALON',
      Nombre:                    'Salones',
      ID_Perfil_Precio_Default:  'PP_SALON_BASE',
      Activo: true, Updated_At: now,
    },
    {
      ID_Categoria:              'CAT_CAFE',
      Nombre:                    'Cafés',
      ID_Perfil_Precio_Default:  'PP_CAFE_BASE',
      Activo: true, Updated_At: now,
    },
    {
      ID_Categoria:              'CAT_COMIDA',
      Nombre:                    'Comidas',
      ID_Perfil_Precio_Default:  'PP_ALMUERZO_BASE',
      Activo: true, Updated_At: now,
    },
  ]);

  // Items intentionally have NO Costo_* fields — pricing must come from profile
  store.seed('ITEM_CATALOGO', [
    {
      ID_Item:                    'ITEM_CHINOOK',
      Nombre:                     'Salón Chinook',
      ID_Categoria:               'CAT_SALON',
      ID_Perfil_Precio_Override:  'PP_SALON_BASE',
      Activo: true, Updated_At: now,
    },
    {
      ID_Item:                    'ITEM_COFFEE_BASIC',
      Nombre:                     'Café Básico',
      ID_Categoria:               'CAT_CAFE',
      ID_Perfil_Precio_Override:  '',  // falls back to category default
      Activo: true, Updated_At: now,
    },
    {
      ID_Item:                    'ITEM_ALMUERZO',
      Nombre:                     'Almuerzo Básico',
      ID_Categoria:               'CAT_COMIDA',
      ID_Perfil_Precio_Override:  'PP_ALMUERZO_BASE',
      Activo: true, Updated_At: now,
    },
    {
      ID_Item:                    'PACK_COFFEE_COMPLETO',
      Nombre:                     'Pack Café Completo',
      ID_Categoria:               'CAT_CAFE',
      ID_Perfil_Precio_Override:  '',
      Activo: true, Updated_At: now,
    },
  ]);

  store.seed('COMPOSICION_KIT', [
    { ID_Composicion: 'COMP_001', ID_Item_Padre: 'PACK_COFFEE_COMPLETO', ID_Item_Hijo: 'ITEM_COFFEE_BASIC',  Cantidad: 1,   Tipo_Precio: 'ABSORBIDO', Updated_At: now },
    { ID_Composicion: 'COMP_002', ID_Item_Padre: 'PACK_COFFEE_COMPLETO', ID_Item_Hijo: 'ITEM_ALMUERZO',      Cantidad: 0.5, Tipo_Precio: 'SUMAR',     Updated_At: now },
  ]);

  store.seed('CLIENTES', [
    { ID_Cliente: 'CLI_TEST', Nombre_Empresa: 'Test Lodge Events', RUT: '76.300.003-3', Updated_At: now },
  ]);

  store.seed('REGLAS_NEGOCIO', []);

  return store;
}

// ── Store with basket-level rules ───────────────────────────────────────────

export function createStoreWithRules() {
  const store = createPricingTestStore();
  const now   = new Date().toISOString();

  store.seed('REGLAS_NEGOCIO', [
    {
      ID_Regla:       'R_IVA_19',
      Nombre:         'IVA 19%',
      Etapa:          'IMPUESTO',
      Scope:          'COTIZACION',
      Tipo_Accion:    'SET_TAX',
      Condicion_JSON: 'true',
      Payload_JSON:   JSON.stringify({ name: 'IVA', rate: 0.19 }),
      Prioridad:      100,
      Acumulable:     true,
      Activo:         true,
      Updated_At:     now,
    },
    {
      ID_Regla:       'R_OVERTIME',
      Nombre:         'Sobreturno (>480min)',
      Etapa:          'AJUSTE_LINEA',
      Scope:          'CATEGORIA',
      Tipo_Accion:    'MULTIPLY',
      Condicion_JSON: JSON.stringify({ '>': [{ var: '_duracionMin' }, 480] }),
      Payload_JSON:   JSON.stringify({ factor: 1.25 }),
      Prioridad:      10,
      Acumulable:     false,
      Activo:         true,
      Updated_At:     now,
    },
  ]);

  return store;
}
