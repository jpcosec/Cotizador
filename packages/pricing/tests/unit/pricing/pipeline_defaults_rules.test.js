import { describe, it, expect } from 'vitest';
import { resolveItemDefaults } from '../../../src/Pricing/pipeline.js';
import { TableInMemoryStore as InMemoryStore } from '../../../../database/src/stores/TableInMemoryStore.js';

function createStore() {
  const store = new InMemoryStore();
  store.seed('CATEGORIAS', [
    {
      ID_Categoria: 'CAT_BEBIDAS',
      Def_Requiere_Pax: true,
      Def_Requiere_Cant: true,
      Def_Requiere_Tiempo: false,
      Def_Duracion_Min: 0,
      Def_Unidades_Por_Pax: 0.5,
    },
  ]);
  store.seed('ITEM_CATALOGO', [
    {
      ID_Item: 'ITEM_QTY',
      ID_Categoria: 'CAT_BEBIDAS',
      Def_Unidades_Por_Pax_Override: null,
    },
  ]);
  store.seed('REGLAS_NEGOCIO', []);
  return store;
}

function addCantidadDefaultRule(store, value = 60) {
  const current = store.findAll('REGLAS_NEGOCIO', {});
  current.push({
    ID_Regla: 'R_TEST_CANTIDAD_DEFAULT',
    Nombre: 'Default cantidad for cerveza',
    Etapa: 'CANTIDAD_DEFAULT',
    Scope: 'ITEM',
    Tipo_Accion: 'SET_DEFAULT',
    Hook: null,
    Condicion_JSON: {
      and: [
        { '===': [{ var: 'linea.ID_Item' }, 'ITEM_QTY'] },
        { '===': [{ var: 'linea.Override_Cantidad' }, null] },
      ],
    },
    Payload_JSON: { field: 'cantidad', value },
    Prioridad: 1,
    Acumulable: false,
    Activo: true,
  });
  store.seed('REGLAS_NEGOCIO', current);
}

describe('Pricing/pipeline resolveItemDefaults + CANTIDAD_DEFAULT', () => {
  it('applies CANTIDAD_DEFAULT rules after base defaults', () => {
    const store = createStore();
    addCantidadDefaultRule(store, 60);

    const linea = { ID_Item: 'ITEM_QTY' };
    resolveItemDefaults(linea, 80, store);

    expect(linea._pax).toBe(80);
    expect(linea._cantidad).toBe(60);
  });

  it('keeps explicit Override_Cantidad when rule condition excludes it', () => {
    const store = createStore();
    addCantidadDefaultRule(store, 60);

    const linea = { ID_Item: 'ITEM_QTY', Override_Cantidad: 12 };
    resolveItemDefaults(linea, 80, store);

    expect(linea._cantidad).toBe(12);
  });
});
