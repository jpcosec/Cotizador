import { describe, expect, it } from 'vitest';
import { createBasketActor } from '../machine/basketMachine.js';

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
    reglas: [],
  };
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('basketMachine', () => {
  it('initializes with day projections and selected day', () => {
    const actor = createBasketActor({
      db: makeDbFixture(),
      dayCount: 3,
      initialSelectedDayIndex: 2,
    });

    const snapshot = actor.getSnapshot().context;
    expect(snapshot.dayOptions).toHaveLength(3);
    expect(snapshot.selectedDayIndex).toBe(2);
    expect(snapshot.state.summary.dayCount).toBe(3);
    expect(snapshot.state.summary.totalEntries).toBe(0);

    actor.stop();
  });

  it('ships items to selected day and keeps other days isolated', async () => {
    const actor = createBasketActor({
      db: makeDbFixture(),
      dayCount: 2,
      initialSelectedDayIndex: 1,
      initialContext: { paxGlobal: 5, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_SELECTED_ITEM' });
    await nextTick();

    let snapshot = actor.getSnapshot().context;
    expect(snapshot.state.days[0].entryCount).toBe(1);
    expect(snapshot.state.days[1].entryCount).toBe(0);

    actor.send({ type: 'SELECT_DAY', dayIndex: 2 });
    actor.send({ type: 'SHIP_ITEM_TO_DAY', dayIndex: 2, itemId: 'ITEM_A2' });
    await nextTick();

    snapshot = actor.getSnapshot().context;
    expect(snapshot.state.days[0].entryCount).toBe(1);
    expect(snapshot.state.days[1].entryCount).toBe(1);

    actor.stop();
  });

  it('moves entries between days and preserves entry overrides', async () => {
    const actor = createBasketActor({
      db: makeDbFixture(),
      dayCount: 2,
      initialSelectedDayIndex: 1,
      initialContext: { paxGlobal: 5, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_ITEM_TO_DAY', dayIndex: 1, itemId: 'ITEM_A1' });
    await nextTick();

    let snapshot = actor.getSnapshot().context;
    const sourceEntry = snapshot.state.days[0].entries[0];

    actor.send({
      type: 'SET_ENTRY_OVERRIDE',
      dayIndex: 1,
      entryId: sourceEntry.entryId,
      key: 'pax',
      value: 3,
    });
    actor.send({
      type: 'MOVE_ENTRY_TO_DAY',
      fromDayIndex: 1,
      targetDayIndex: 2,
      entryId: sourceEntry.entryId,
    });
    await nextTick();

    snapshot = actor.getSnapshot().context;
    expect(snapshot.state.days[0].entryCount).toBe(0);
    expect(snapshot.state.days[1].entryCount).toBe(1);

    const movedEntry = snapshot.state.days[1].entries[0];
    expect(movedEntry.state.overrides.pax).toBe(3);

    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 40 } });
    await nextTick();

    const movedAfterContext = actor
      .getSnapshot()
      .context.state.days[1].entries.find((entry) => entry.entryId === movedEntry.entryId);
    expect(movedAfterContext.total).toBe(300);

    actor.stop();
  });

  it('broadcasts context updates to all day runtimes', async () => {
    const actor = createBasketActor({
      db: makeDbFixture(),
      dayCount: 2,
      initialSelectedDayIndex: 1,
      initialContext: { paxGlobal: 5, hora: '09:00' },
    });

    actor.send({ type: 'SHIP_ITEM_TO_DAY', dayIndex: 1, itemId: 'ITEM_A1' });
    actor.send({ type: 'SHIP_ITEM_TO_DAY', dayIndex: 2, itemId: 'ITEM_A1' });
    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 12 } });
    await nextTick();

    const snapshot = actor.getSnapshot().context;
    expect(snapshot.state.days[0].entries[0].total).toBe(1200);
    expect(snapshot.state.days[1].entries[0].total).toBe(1200);
    expect(snapshot.state.summary.totalEntries).toBe(2);

    actor.stop();
  });
});
