import { describe, expect, it, vi } from 'vitest';
import { createCategoryActor } from '../machine/categoryMachine.js';

function makeDbFixture() {
  return {
    categorias: [
      {
        ID_Categoria: 'CAT_A',
        Nombre: 'Categoria A',
        ID_Perfil_Precio_Default: 'PP_PAX',
        ID_Perfil_Init_Default: 'PI_BASE',
        Def_Requiere_Pax: true,
        Def_Requiere_Cant: false,
        Def_Requiere_Tiempo: false,
        Def_Requiere_Hora: true,
        Icono_UI: 'alpha',
        Activo: true,
      },
      {
        ID_Categoria: 'CAT_B',
        Nombre: 'Categoria B',
        ID_Perfil_Precio_Default: 'PP_FIXED',
        ID_Perfil_Init_Default: 'PI_BASE',
        Def_Requiere_Pax: false,
        Def_Requiere_Cant: false,
        Def_Requiere_Tiempo: false,
        Def_Requiere_Hora: false,
        Icono_UI: 'beta',
        Activo: true,
      },
    ],
    perfiles: [
      {
        ID_Perfil_Precio: 'PP_PAX',
        Nombre: 'Per pax',
        Costo_Base_Fijo: 0,
        Costo_Unitario_Pax: 100,
        Costo_Unitario_Tiempo: 0,
        Costo_Unitario_Item: 0,
        Activo: true,
      },
      {
        ID_Perfil_Precio: 'PP_FIXED',
        Nombre: 'Fixed',
        Costo_Base_Fijo: 700,
        Costo_Unitario_Pax: 0,
        Costo_Unitario_Tiempo: 0,
        Costo_Unitario_Item: 0,
        Activo: true,
      },
    ],
    perfilesInit: [
      {
        ID_Perfil_Init: 'PI_BASE',
        Nombre: 'Base init',
        Duracion_Min: 0,
        Unidades_Por_Pax: 0,
        Unidades_Por_Hora: 0,
        Minutos_Por_Usuario: 0,
        Cantidad_Fija: 0,
        Pax_Fijo: 0,
        Activo: true,
      },
    ],
    items: [
      {
        ID_Item: 'ITEM_A1',
        Nombre: 'Item A1',
        ID_Categoria: 'CAT_A',
        ID_Perfil_Precio_Override: null,
        ID_Perfil_Init_Override: null,
        Default_Glosa: 'A1',
        Activo: true,
      },
      {
        ID_Item: 'ITEM_A2',
        Nombre: 'Item A2',
        ID_Categoria: 'CAT_A',
        ID_Perfil_Precio_Override: 'PP_FIXED',
        ID_Perfil_Init_Override: null,
        Default_Glosa: 'A2',
        Activo: true,
      },
      {
        ID_Item: 'ITEM_B1',
        Nombre: 'Item B1',
        ID_Categoria: 'CAT_B',
        ID_Perfil_Precio_Override: null,
        ID_Perfil_Init_Override: null,
        Default_Glosa: 'B1',
        Activo: true,
      },
    ],
    reglas: [
      {
        ID_Regla: 'RULE_WARN_A1',
        Nombre: 'Warn high pax for A1',
        Etapa: 'RESTRICCION_UI',
        Scope: 'ITEM',
        ID_Componente: 'ITEM_A1',
        Tipo_Accion: 'WARNING',
        Hook: null,
        Condicion_JSON: { '>': [{ var: 'item.pax' }, 10] },
        Payload_JSON: { message: 'A1 high pax warning' },
        Prioridad: 10,
        Acumulable: false,
        Activo: true,
      },
      {
        ID_Regla: 'RULE_ERR_A1',
        Nombre: 'Error very high pax for A1',
        Etapa: 'RESTRICCION_UI',
        Scope: 'ITEM',
        ID_Componente: 'ITEM_A1',
        Tipo_Accion: 'ERROR',
        Hook: null,
        Condicion_JSON: { '>': [{ var: 'item.pax' }, 40] },
        Payload_JSON: { message: 'A1 max pax exceeded' },
        Prioridad: 20,
        Acumulable: false,
        Activo: true,
      },
    ],
  };
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeStubItemActorFactory() {
  const created = [];

  function createItemActorImpl(seed) {
    const unsubscribe = vi.fn();
    const actor = {
      send: vi.fn(),
      stop: vi.fn(),
      subscribe: vi.fn(() => ({ unsubscribe })),
      getSnapshot: vi.fn(() => ({
        context: {
          total: 0,
          available: true,
          ruleWarnings: [],
          ruleErrors: [],
          appliedRules: [],
          definition: { rules: [] },
          ...seed,
        },
      })),
      _unsubscribe: unsubscribe,
    };

    created.push(actor);
    return actor;
  }

  return { createItemActorImpl, created };
}

describe('categoryMachine', () => {
  it('loads all active items for selected category and aggregates subtotal', () => {
    const actor = createCategoryActor({
      db: makeDbFixture(),
      initialCategoryId: 'CAT_A',
      initialContext: { paxGlobal: 5, dia: 1, hora: '09:00' },
    });

    const snapshot = actor.getSnapshot().context;

    expect(snapshot.selectedCategoryId).toBe('CAT_A');
    expect(snapshot.state.itemCount).toBe(2);
    expect(snapshot.state.subtotal).toBe(1200);
    expect(snapshot.state.hasWarnings).toBe(false);
    expect(snapshot.state.hasErrors).toBe(false);

    actor.stop();
  });

  it('recalculates totals and warning/error aggregates on context updates', async () => {
    const actor = createCategoryActor({
      db: makeDbFixture(),
      initialCategoryId: 'CAT_A',
      initialContext: { paxGlobal: 5, dia: 1, hora: '09:00' },
    });

    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 12 } });
    await nextTick();

    let snapshot = actor.getSnapshot().context;
    expect(snapshot.state.subtotal).toBe(1900);
    expect(snapshot.state.hasWarnings).toBe(true);
    expect(snapshot.state.ruleWarnings).toHaveLength(1);
    expect(snapshot.state.hasErrors).toBe(false);

    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 50 } });
    await nextTick();

    snapshot = actor.getSnapshot().context;
    expect(snapshot.state.subtotal).toBe(5700);
    expect(snapshot.state.hasErrors).toBe(true);
    expect(snapshot.state.ruleErrors).toHaveLength(1);

    actor.stop();
  });

  it('switches categories without duplicating stale runtime entries', async () => {
    const actor = createCategoryActor({
      db: makeDbFixture(),
      initialCategoryId: 'CAT_A',
      initialContext: { paxGlobal: 12, dia: 1, hora: '09:00' },
    });

    actor.send({ type: 'SELECT_CATEGORY', categoryId: 'CAT_B' });
    await nextTick();

    let snapshot = actor.getSnapshot().context;
    expect(snapshot.selectedCategoryId).toBe('CAT_B');
    expect(snapshot.state.itemCount).toBe(1);
    expect(snapshot.state.subtotal).toBe(700);

    actor.send({ type: 'SELECT_CATEGORY', categoryId: 'CAT_A' });
    await nextTick();

    snapshot = actor.getSnapshot().context;
    expect(snapshot.selectedCategoryId).toBe('CAT_A');
    expect(snapshot.state.itemCount).toBe(2);
    expect(snapshot.state.subtotal).toBe(1900);

    actor.stop();
  });

  it('tears down child subscriptions and actors on switch and stop', async () => {
    const { createItemActorImpl, created } = makeStubItemActorFactory();
    const actor = createCategoryActor({
      db: makeDbFixture(),
      initialCategoryId: 'CAT_A',
      initialContext: { paxGlobal: 10, dia: 1, hora: '09:00' },
      createItemActorImpl,
    });

    expect(created).toHaveLength(2);
    const initialActors = [...created];

    actor.send({ type: 'SELECT_CATEGORY', categoryId: 'CAT_B' });
    await nextTick();

    for (const child of initialActors) {
      expect(child._unsubscribe).toHaveBeenCalledTimes(1);
      expect(child.stop).toHaveBeenCalledTimes(1);
    }

    expect(created).toHaveLength(3);
    const currentChild = created[2];
    expect(currentChild.stop).not.toHaveBeenCalled();

    actor.stop();

    expect(currentChild._unsubscribe).toHaveBeenCalledTimes(1);
    expect(currentChild.stop).toHaveBeenCalledTimes(1);
  });
});
