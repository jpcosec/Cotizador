import { createCounterActor } from '../../counter-basic/machine/counterMachine.js';

/**
 * Create three independent counter actors for the composed counter pattern.
 * @returns {{ global: import('xstate').Actor, childA: import('xstate').Actor, childB: import('xstate').Actor }}
 */
export function createComposedActors() {
  return {
    global: createCounterActor(),
    childA: createCounterActor(),
    childB: createCounterActor()
  };
}
