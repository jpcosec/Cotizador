import { assign, createActor, createMachine } from 'https://esm.sh/xstate@5.28.0';
import { ItemXStateInteraction } from '../../../xstate/src/interactions/ItemXStateInteraction.js';
import {
  createDefaultItemSeed,
  defaultItemDefinition
} from '../../../pricing/src/ItemLogic.js';

/** @type {ItemXStateInteraction} Shared interaction adapter for reducing events. */
const interaction = new ItemXStateInteraction();

/** @type {Object} Projected initial context derived from the default definition. */
const initialContext = interaction.project(createDefaultItemSeed());

/** Re-export default definition from pricing module for consumers/tests. */
export { defaultItemDefinition };

/** @type {import('xstate').ActionFunction} XState assign action that delegates to the interaction reducer. */
const reduceEvent = assign(({ context, event }) => interaction.reduce(context, event));

/**
 * XState machine for a standalone item.
 * All events are handled by a single `reduceEvent` action that delegates
 * to {@link ItemXStateInteraction#reduce} for immutable context updates.
 *
 * Events: SET_MODE, SET_EXTERNAL_CONTEXT, SET_PROFILE_VALUE,
 * SET_DEFAULT_QUANTITY_VALUE, CLEAR_DEFAULT_QUANTITY_VALUE,
 * SET_OVERRIDE, CLEAR_OVERRIDE, RESET_OVERRIDES.
 * @type {import('xstate').StateMachine}
 */
export const itemMachine = createMachine({
  id: 'itemStandalone',
  initial: 'ready',
  context: initialContext,
  states: {
    ready: {
      on: {
        SET_MODE: { actions: reduceEvent },
        SET_EXTERNAL_CONTEXT: { actions: reduceEvent },
        SET_PROFILE_VALUE: { actions: reduceEvent },
        SET_DEFAULT_QUANTITY_VALUE: { actions: reduceEvent },
        CLEAR_DEFAULT_QUANTITY_VALUE: { actions: reduceEvent },
        SET_OVERRIDE: { actions: reduceEvent },
        CLEAR_OVERRIDE: { actions: reduceEvent },
        RESET_OVERRIDES: { actions: reduceEvent }
      }
    }
  }
});

/**
 * Create and start an item actor from the item machine.
 * @returns {import('xstate').Actor} A running actor with item context.
 */
export function createItemActor() {
  const actor = createActor(itemMachine);
  actor.start();
  return actor;
}
