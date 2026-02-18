import test from 'node:test';
import assert from 'node:assert/strict';
import { AlpineXStateBridge } from '../../src/Bridge/AlpineXStateBridge.js';

function createMockActor(initialSnapshot) {
  let snapshot = initialSnapshot;
  const subscribers = [];
  const sent = [];
  let started = false;

  return {
    getSnapshot() {
      return snapshot;
    },
    subscribe(cb) {
      subscribers.push(cb);
      return {
        unsubscribe() {
          const idx = subscribers.indexOf(cb);
          if (idx >= 0) subscribers.splice(idx, 1);
        },
      };
    },
    send(event) {
      sent.push(event);
    },
    start() {
      started = true;
    },
    emit(nextSnapshot) {
      snapshot = nextSnapshot;
      subscribers.forEach((cb) => cb(snapshot));
    },
    getSent() {
      return sent;
    },
    isStarted() {
      return started;
    },
  };
}

test('syncs XState context to Alpine-compatible state', () => {
  const actor = createMockActor({
    value: { quotation_workflow: { quotation: 'basket' }, database_management: 'closed' },
    context: {
      quotation: { paxGlobal: 25, cotizacion: { Fecha_Evento: '2026-03-01' } },
      lineas: [
        {
          ID_Linea: 'LIN_1',
          ID_Item: 'ITEM_CHINOOK',
          _item: { Nombre_Item: 'Salón Chinook', Categoria: 'Salones' },
          _netoBase: 385000,
          Override_Pax: 25,
        },
      ],
      totals: { subtotal: 385000, taxes: [{ name: 'IVA', amount: 73150 }], total: 458150 },
      messages: [{ level: 'info', text: 'ok' }],
      errors: [],
      databaseOpen: false,
    },
  });

  const alpine = {};
  const bridge = new AlpineXStateBridge(actor, alpine);

  assert.equal(alpine.paxGlobal, 25);
  assert.equal(alpine.carrito.length, 1);
  assert.equal(alpine.carrito[0].nombre, 'Salón Chinook');
  assert.equal(alpine.carrito[0].total, 385000);
  assert.equal(alpine.totalsSnapshot.total, 458150);
  assert.equal(alpine.machineState.includes('quotation_workflow.quotation.basket'), true);
  bridge.stop();
});

test('starts actor when configured and reacts to updates', () => {
  const actor = createMockActor({
    value: 'idle',
    context: { lineas: [], totals: { subtotal: 0, taxes: [], total: 0 } },
  });
  const alpine = { carrito: [] };
  const bridge = new AlpineXStateBridge(actor, alpine, { autoStart: true }).start();

  assert.equal(actor.isStarted(), true);
  assert.equal(alpine.carrito.length, 0);

  actor.emit({
    value: 'basket',
    context: {
      quotation: { paxGlobal: 10, cotizacion: { Fecha_Evento: '2026-03-02' } },
      lineas: [{ ID_Linea: 'LIN_2', ID_Item: 'ITEM_COFFEE', _netoBase: 63800, Override_Pax: 10 }],
      totals: { subtotal: 63800, taxes: [{ name: 'IVA', amount: 12122 }], total: 75922 },
      messages: [],
      errors: [],
      databaseOpen: true,
    },
  });

  assert.equal(alpine.machineState, 'basket');
  assert.equal(alpine.databaseOpen, true);
  assert.equal(alpine.carrito.length, 1);
  assert.equal(alpine.carrito[0].id, 'LIN_2');

  bridge.stop();
});

test('respects snapshot.can() when dispatching', () => {
  const actor = createMockActor({
    value: 'basket',
    can: ({ type }) => type !== 'REMOVE_ITEM',
    context: { lineas: [], totals: { subtotal: 0, taxes: [], total: 0 } },
  });
  const bridge = new AlpineXStateBridge(actor, {});

  assert.equal(bridge.send('ADD_ITEM', { itemId: 'ITEM_1' }), true);
  assert.equal(bridge.send('REMOVE_ITEM', { lineId: 'LIN_1' }), false);
  assert.deepEqual(actor.getSent(), [{ type: 'ADD_ITEM', itemId: 'ITEM_1' }]);
});
