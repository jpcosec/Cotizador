import test from 'node:test';
import assert from 'node:assert/strict';
import { createCotizadorActor } from '../../src/Local/createCotizadorActor.local.js';

function currentStatePath(actor) {
  const value = actor.getSnapshot().value;
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return JSON.stringify(value);
}

test('createCotizadorActor starts in browse by default', () => {
  const actor = createCotizadorActor();

  const state = currentStatePath(actor);
  assert.equal(state.includes('browse'), true);
  actor.stop();
});

test('createCotizadorActor boots into basket when bootstrap=true', () => {
  const actor = createCotizadorActor({
    bootstrap: true,
    clienteId: 'CLI_CORP',
    paxGlobal: 25,
    fechaEvento: '2026-04-01',
    duracionDias: 2,
    cotizacionId: 'COT_LOCAL_TEST',
  });

  const snap = actor.getSnapshot();
  const state = currentStatePath(actor);

  assert.equal(state.includes('basket'), true);
  assert.equal(snap.context.quotation.cotizacion.ID_Cliente, 'CLI_CORP');
  assert.equal(snap.context.quotation.paxGlobal, 25);
  actor.stop();
});

test('local actor supports add/update/remove with pricing totals', () => {
  const actor = createCotizadorActor({ bootstrap: true, paxGlobal: 25 });

  actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_CHINOOK', overrides: {} });
  let snap = actor.getSnapshot();
  assert.equal(snap.context.lineas.length > 0, true);
  assert.equal(snap.context.totals.subtotal > 0, true);
  const lineId = snap.context.lineas[0].ID_Linea;

  actor.send({ type: 'UPDATE_ITEM', lineId, overrides: { Override_Pax: 50 } });
  snap = actor.getSnapshot();
  const updated = snap.context.lineas.find((l) => l.ID_Linea === lineId);
  assert.equal(Boolean(updated), true);

  actor.send({ type: 'REMOVE_ITEM', lineId });
  snap = actor.getSnapshot();
  const removed = snap.context.lineas.find((l) => l.ID_Linea === lineId);
  assert.equal(removed._removed, true);
  actor.stop();
});
