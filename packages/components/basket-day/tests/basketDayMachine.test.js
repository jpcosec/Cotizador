import { describe, expect, it } from 'vitest';
import { createBasketDayActor } from '../machine/basketDayMachine.js';

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

describe('basketDayMachine', () => {
  it('ships one entry and supports duplicate same-item entries', async () => {
    const actor = createBasketDayActor({
      db: makeDbFixture(),
      dayIndex: 1,
      initialContext: { paxGlobal: 5, dia: 1, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_ITEM', itemId: 'ITEM_A1' });
    actor.send({ type: 'SHIP_ITEM', itemId: 'ITEM_A1' });
    await nextTick();

    const snapshot = actor.getSnapshot().context;
    expect(snapshot.state.entryCount).toBe(2);
    expect(snapshot.state.entries[0].entryId).not.toBe(snapshot.state.entries[1].entryId);
    expect(snapshot.state.subtotal).toBe(1000);

    actor.stop();
  });

  it('removes only the selected duplicate entry', async () => {
    const actor = createBasketDayActor({
      db: makeDbFixture(),
      dayIndex: 1,
      initialContext: { paxGlobal: 5, dia: 1, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_ITEM', itemId: 'ITEM_A1' });
    actor.send({ type: 'SHIP_ITEM', itemId: 'ITEM_A1' });
    await nextTick();

    const first = actor.getSnapshot().context.state.entries[0];
    actor.send({ type: 'REMOVE_ENTRY', entryId: first.entryId });
    await nextTick();

    const snapshot = actor.getSnapshot().context;
    expect(snapshot.state.entryCount).toBe(1);
    expect(snapshot.state.entries.some((entry) => entry.entryId === first.entryId)).toBe(false);

    actor.stop();
  });

  it('keeps override locked when context changes, then unlocks after reset', async () => {
    const actor = createBasketDayActor({
      db: makeDbFixture(),
      dayIndex: 1,
      initialContext: { paxGlobal: 5, dia: 1, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_ITEM', itemId: 'ITEM_A1' });
    await nextTick();

    const entryId = actor.getSnapshot().context.state.entries[0].entryId;
    actor.send({ type: 'SET_ENTRY_OVERRIDE', entryId, key: 'pax', value: 3 });
    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 30 } });
    await nextTick();

    let snapshot = actor.getSnapshot().context;
    let entry = snapshot.state.entries.find((candidate) => candidate.entryId === entryId);
    expect(entry.total).toBe(300);

    actor.send({ type: 'RESET_ENTRY_OVERRIDES', entryId });
    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 35 } });
    await nextTick();

    snapshot = actor.getSnapshot().context;
    entry = snapshot.state.entries.find((candidate) => candidate.entryId === entryId);
    expect(entry.total).toBe(3500);

    actor.stop();
  });

  it('aggregates warning/error state from day entries', async () => {
    const actor = createBasketDayActor({
      db: makeDbFixture(),
      dayIndex: 1,
      initialContext: { paxGlobal: 5, dia: 1, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_ITEM', itemId: 'ITEM_A1' });
    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 12 } });
    await nextTick();

    let snapshot = actor.getSnapshot().context;
    expect(snapshot.state.hasWarnings).toBe(true);
    expect(snapshot.state.hasErrors).toBe(false);

    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 50 } });
    await nextTick();

    snapshot = actor.getSnapshot().context;
    expect(snapshot.state.hasErrors).toBe(true);
    expect(snapshot.state.ruleErrors).toHaveLength(1);

    actor.stop();
  });
});
