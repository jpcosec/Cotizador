import test from 'node:test';
import assert from 'node:assert/strict';
import { createCotizadorActor } from '../createCotizadorActor.js';
import { AlpineXStateBridge } from '../../../claps_codelab_frontend/src/bridge/AlpineXStateBridge.js';

test('merged actor runs quotation workflow end-to-end locally', () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 25,
    cotizacionId: 'COT_IT_LOCAL_001',
    bootstrap: true,
  });

  let snap = actor.getSnapshot();
  assert.equal(JSON.stringify(snap.value).includes('basket'), true);
  assert.equal(snap.context.quotation.cotizacion.ID_Cliente, 'CLI_CORP');

  actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_CHINOOK' });
  actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_COFFEE_BASIC' });
  snap = actor.getSnapshot();

  assert.equal(snap.context.lineas.length >= 2, true);
  assert.equal(snap.context.totals.subtotal > 0, true);
  const lineId = snap.context.lineas[0].ID_Linea;

  actor.send({
    type: 'UPDATE_ITEM',
    lineId,
    overrides: { Override_Pax: 50 },
  });
  snap = actor.getSnapshot();
  assert.equal(snap.context.totals.total >= snap.context.totals.subtotal, true);

  actor.send({ type: 'ADVANCE_TO_VALIDATION' });
  actor.send({ type: 'VALIDATE_AND_SAVE' });
  snap = actor.getSnapshot();

  assert.equal(JSON.stringify(snap.value).includes('completed'), true);
  assert.equal((snap.context.errors || []).length, 0);
  assert.equal(snap.context.quotation.cotizacion.Estado, 'Guardada');
  actor.stop();
});

test('bridge syncs real merged actor snapshot to Alpine-style state', () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 10,
    cotizacionId: 'COT_IT_LOCAL_002',
    bootstrap: true,
  });

  const alpineStore = {
    carrito: [],
    paxGlobal: 0,
    totalsSnapshot: { subtotal: 0, taxes: [], total: 0 },
  };

  const bridge = new AlpineXStateBridge(actor, alpineStore).start();
  actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_CHINOOK' });

  assert.equal(alpineStore.paxGlobal, 10);
  assert.equal(alpineStore.carrito.length > 0, true);
  assert.equal(alpineStore.totalsSnapshot.subtotal > 0, true);

  bridge.stop();
  actor.stop();
});
