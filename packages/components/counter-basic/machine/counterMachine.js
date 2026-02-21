import { assign, createActor, createMachine } from 'https://esm.sh/xstate@5.28.0';

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

export function createCounterActor() {
  const actor = createActor(counterMachine);
  actor.start();
  return actor;
}
