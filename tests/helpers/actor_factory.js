import { createActor } from 'xstate';
import { createQuotationXStateMachine } from '../../src/Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from '../../src/Orchestration/adapters/index.js';
import { createSeededStore } from './store_factory.js';

/**
 * Creates and starts an XState actor for testing.
 * The actor has all adapters (guards, actions, services) provided.
 *
 * @param {object} opts - Configuration options
 * @param {object} opts.store - InMemoryStore instance (defaults to seeded store)
 * @param {object} opts.overrideAdapters - Partial adapter overrides for mocking
 * @returns {object} Started actor ready to send events
 */
export function createTestActor(opts = {}) {
  const store = opts.store || createSeededStore();

  // Create machine from blueprint
  const machine = createQuotationXStateMachine(quotationAdapters);

  // Create actor with custom initial context
  const actor = createActor(machine, {
    input: { store },
  });

  // Override context before starting (for store injection)
  const snap = actor.getSnapshot();
  Object.assign(snap.context, { store });

  // Start actor
  actor.start();

  return actor;
}

/**
 * Helper to navigate actor to basket state for easier testing.
 * Sends the required events to get from browse → basket.
 */
export function navigateToBasket(actor, opts = {}) {
  const paxGlobal = opts.paxGlobal || 25;
  const clienteId = opts.clienteId || 'CLI_CORP';
  const fechaEvento = opts.fechaEvento || '2025-06-15';
  const duracionDias = opts.duracionDias || 1;

  actor.send({ type: 'START_NEW_QUOTATION' });
  actor.send({ type: 'CREATE_NEW' });
  actor.send({
    type: 'QUOTATION_INITIALIZED',
    paxGlobal,
    clienteId,
    fechaEvento,
    duracionDias,
  });
}

/**
 * Helper to add items to basket.
 * Must be called after navigateToBasket.
 */
export function addItemToBasket(actor, itemId, overrides = {}) {
  actor.send({
    type: 'ADD_ITEM',
    itemId,
    overrides,
  });
}

/**
 * Gets the current snapshot and returns the quotation_workflow state value.
 */
export function getCurrentWorkflowState(actor) {
  return actor.getSnapshot().value.quotation_workflow;
}

/**
 * Gets the current database_management state value.
 */
export function getCurrentDatabaseState(actor) {
  return actor.getSnapshot().value.database_management;
}

/**
 * Gets the full context.
 */
export function getContext(actor) {
  return actor.getSnapshot().context;
}
