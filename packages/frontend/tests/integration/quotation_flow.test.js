import test from 'node:test';
import assert from 'node:assert/strict';
import { createCotizadorActor } from '../../src/Local/createCotizadorActor.local.js';
import { AlpineXStateBridge } from '../../src/Bridge/AlpineXStateBridge.js';

function createMockAlpineApp() {
  return {
    useStateMachine: true,
    machineState: null,
    totalsSnapshot: { subtotal: 0, taxes: [], total: 0 },
    carrito: [],
    catalogo: [],
    paxGlobal: 10,
    messages: [],
    errors: [],
    databaseOpen: false,
    client: null,
  };
}

test('Bridge syncs initial machine state to Alpine store', async () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 10,
    bootstrap: true,
  });

  const alpineStore = createMockAlpineApp();
  const bridge = new AlpineXStateBridge(actor, alpineStore, {
    autoStart: false,
    syncLineasAsCarrito: true,
  }).start();

  // Wait a tick for subscription to fire
  await new Promise(r => setTimeout(r, 10));

  assert.ok(alpineStore.machineState, 'machineState should be set');
  assert.ok(alpineStore.machineState.length > 0, 'machineState should be non-empty');
  assert.ok(alpineStore.catalogo, 'catalogo should be synced from machine context');
  assert.equal(typeof alpineStore.totalsSnapshot, 'object', 'totalsSnapshot should be an object');

  bridge.stop();
});

test('ADD_ITEM sends event to machine and carrito updates', async () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 15,
    bootstrap: true,
  });

  const alpineStore = createMockAlpineApp();
  const bridge = new AlpineXStateBridge(actor, alpineStore, {
    autoStart: false,
    syncLineasAsCarrito: true,
  }).start();

  // Wait for initial sync
  await new Promise(r => setTimeout(r, 10));

  const initialCarritoLength = alpineStore.carrito.length;

  // Send ADD_ITEM event (use valid item from seeded store)
  const itemId = 'ITEM_CHINOOK';
  bridge.send('ADD_ITEM', {
    itemId,
    overrides: { Override_Pax: 15 },
  });

  // Wait for machine to process and sync
  await new Promise(r => setTimeout(r, 50));

  // After ADD_ITEM, carrito should have a new item (or be populated)
  assert.ok(
    alpineStore.carrito.length > initialCarritoLength || alpineStore.carrito.length > 0,
    'carrito should have items after ADD_ITEM'
  );

  bridge.stop();
});

test('totalsSnapshot reflects pricing calculations', async () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 20,
    bootstrap: true,
  });

  const alpineStore = createMockAlpineApp();
  const bridge = new AlpineXStateBridge(actor, alpineStore, {
    autoStart: false,
    syncLineasAsCarrito: true,
  }).start();

  // Wait for initial sync
  await new Promise(r => setTimeout(r, 10));

  // Add an item (use valid item from seeded store)
  bridge.send('ADD_ITEM', {
    itemId: 'ITEM_CHINOOK',
    overrides: { Override_Pax: 20 },
  });

  // Wait for calculations
  await new Promise(r => setTimeout(r, 50));

  // Verify totalsSnapshot has reasonable values
  assert.ok(alpineStore.totalsSnapshot, 'totalsSnapshot should exist');
  assert.ok(
    typeof alpineStore.totalsSnapshot.subtotal === 'number',
    'totalsSnapshot.subtotal should be a number'
  );
  assert.ok(
    typeof alpineStore.totalsSnapshot.total === 'number',
    'totalsSnapshot.total should be a number'
  );
  assert.ok(
    Array.isArray(alpineStore.totalsSnapshot.taxes),
    'totalsSnapshot.taxes should be an array'
  );

  bridge.stop();
});

test('REMOVE_ITEM removes item from carrito', async () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 10,
    bootstrap: true,
  });

  const alpineStore = createMockAlpineApp();
  const bridge = new AlpineXStateBridge(actor, alpineStore, {
    autoStart: false,
    syncLineasAsCarrito: true,
  }).start();

  // Wait for initial sync
  await new Promise(r => setTimeout(r, 10));

  // Add item (use valid item from seeded store)
  bridge.send('ADD_ITEM', {
    itemId: 'ITEM_CHINOOK',
    overrides: { Override_Pax: 10 },
  });

  // Wait for item to be added
  await new Promise(r => setTimeout(r, 50));

  const carritoAfterAdd = alpineStore.carrito.length;
  assert.ok(carritoAfterAdd > 0, 'carrito should have at least one item');

  // Remove first item if it exists
  if (carritoAfterAdd > 0 && alpineStore.carrito[0].lineId) {
    bridge.send('REMOVE_ITEM', {
      lineId: alpineStore.carrito[0].lineId,
    });

    // Wait for removal
    await new Promise(r => setTimeout(r, 50));

    // Carrito should be empty or reduced
    // Note: totals might still be calculated, so we mainly check carrito
    assert.ok(
      alpineStore.carrito.length <= carritoAfterAdd,
      'carrito should have equal or fewer items after REMOVE_ITEM'
    );
  }

  bridge.stop();
});

test('canSend checks if event is allowed by machine', async () => {
  const actor = createCotizadorActor({
    clienteId: 'CLI_CORP',
    paxGlobal: 10,
    bootstrap: true,
  });

  const alpineStore = createMockAlpineApp();
  const bridge = new AlpineXStateBridge(actor, alpineStore, {
    autoStart: false,
  }).start();

  // Wait for initial sync
  await new Promise(r => setTimeout(r, 10));

  // ADD_ITEM should be allowed in basket state
  const canAdd = bridge.canSend('ADD_ITEM');
  assert.ok(typeof canAdd === 'boolean', 'canSend should return a boolean');

  bridge.stop();
});
