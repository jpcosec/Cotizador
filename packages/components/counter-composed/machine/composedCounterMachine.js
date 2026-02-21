import { createCounterActor } from '../../counter-basic/machine/counterMachine.js';

export function createComposedActors() {
  return {
    global: createCounterActor(),
    childA: createCounterActor(),
    childB: createCounterActor()
  };
}
