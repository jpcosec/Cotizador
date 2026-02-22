import { assign, createActor, createMachine } from 'https://esm.sh/xstate@5.28.0';

/**
 * XState machine definition for a basic counter.
 * Handles INCREMENT, DECREMENT, and RESET events in a single `active` state.
 * @type {import('xstate').StateMachine}
 */
export const counterMachine = createMachine({
  id: 'counterBasic',
  initial: 'active',
  context: {
    count: 0
  },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: assign(({ context }) => ({ count: context.count + 1 }))
        },
        DECREMENT: {
          actions: assign(({ context }) => ({ count: context.count - 1 }))
        },
        RESET: {
          actions: assign(() => ({ count: 0 }))
        }
      }
    }
  }
});

/**
 * Create and start a counter actor from the counter machine.
 * @returns {import('xstate').Actor} A running XState actor with `{ count: number }` context.
 */
export function createCounterActor() {
  const actor = createActor(counterMachine);
  actor.start();
  return actor;
}
