/**
 * Item state machine.
 *
 * Manages lifecycle of a single item in two modes: catalog and basket.
 * The item instance is captured in a closure and mutated by action handlers,
 * allowing XState to orchestrate transitions while the Item class handles calculations.
 *
 * @module itemMachine
 */

import { assign, createActor, createMachine } from 'https://esm.sh/xstate@5.28.0';
import { Item } from '../Item.js';
import { createDefaultItemSeed, defaultItemDefinition } from '../seeds.js';

/**
 * Create an XState machine for a single item.
 *
 * The item instance is created once and reused across all events (closure pattern).
 * Each action mutates the item and updates context via toDisplayObject().
 *
 * States: catalog, basket
 * Initial: determined by seed.mode (defaults to 'catalog')
 * Context: item.toDisplayObject()
 *
 * @param {Object} [seed] - Item seed (mode, definition, externalContext, overrides)
 * @returns {import('xstate').StateMachine}
 */
export function createItemMachine(seed) {
  // Create and capture the item instance in closure
  const item = Item.fromSeed(seed);

  return createMachine({
    id: 'itemStandalone',
    initial: seed?.mode || 'catalog',
    context: item.toDisplayObject(),
    states: {
      catalog: {
        on: {
          ADD_TO_BASKET: {
            target: 'basket',
            actions: assign(({ event }) => {
              item.setMode('basket');
              return item.toDisplayObject();
            })
          },
          SET_CONTEXT: {
            actions: assign(({ event }) => {
              item.receiveContext(event.patch);
              return item.toDisplayObject();
            })
          },
          SET_PROFILE_VALUE: {
            actions: assign(({ event }) => {
              item.setProfileValue(event.key, event.value);
              return item.toDisplayObject();
            })
          },
          SET_DEFAULT_QUANTITY: {
            actions: assign(({ event }) => {
              item.setDefaultQuantity(event.key, event.value);
              return item.toDisplayObject();
            })
          },
          CLEAR_DEFAULT_QUANTITY: {
            actions: assign(({ event }) => {
              item.clearDefaultQuantity(event.key);
              return item.toDisplayObject();
            })
          }
        }
      },
      basket: {
        on: {
          REMOVE_FROM_BASKET: {
            target: 'catalog',
            actions: assign(({ event }) => {
              item.setMode('catalog');
              return item.toDisplayObject();
            })
          },
          SET_OVERRIDE: {
            actions: assign(({ event }) => {
              item.setOverride(event.key, event.value);
              return item.toDisplayObject();
            })
          },
          CLEAR_OVERRIDE: {
            actions: assign(({ event }) => {
              item.clearOverride(event.key);
              return item.toDisplayObject();
            })
          },
          RESET_OVERRIDES: {
            actions: assign(({ event }) => {
              item.resetOverrides();
              return item.toDisplayObject();
            })
          },
          SET_CONTEXT: {
            actions: assign(({ event }) => {
              item.receiveContext(event.patch);
              return item.toDisplayObject();
            })
          }
        }
      }
    }
  });
}

/**
 * Create and start an item actor from a seed.
 *
 * @param {Object} [seed=createDefaultItemSeed()] - Item seed
 * @returns {import('xstate').Actor} A running actor with item context
 */
export function createItemActor(seed = createDefaultItemSeed()) {
  const actor = createActor(createItemMachine(seed));
  actor.start();
  return actor;
}

/**
 * Re-export default item definition and seed factory for consumers.
 */
export { defaultItemDefinition } from '../seeds.js';
