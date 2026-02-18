import { createMachine } from 'xstate';
import { quotationMachineBlueprint } from './quotationMachineBlueprint.js';

function normalizeAdapters(adapters = {}) {
  return {
    guards: adapters.guards || {},
    actions: adapters.actions || {},
    services: adapters.services || {},
    actors: adapters.actors || adapters.services || {},
  };
}

// Builds a concrete XState machine from the blueprint.
// Supports both:
// - XState v4 via createMachine(config, options)
// - XState v5 via machine.provide(...)
export function createQuotationXStateMachine(adapters = {}) {
  const resolved = normalizeAdapters(adapters);

  const base = createMachine(quotationMachineBlueprint);
  if (typeof base.provide === 'function') {
    return base.provide({
      guards: resolved.guards,
      actions: resolved.actions,
      actors: resolved.actors,
    });
  }

  return createMachine(quotationMachineBlueprint, {
    guards: resolved.guards,
    actions: resolved.actions,
    services: resolved.services,
  });
}
