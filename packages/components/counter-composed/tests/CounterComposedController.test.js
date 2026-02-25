import { describe, expect, it, vi } from 'vitest';
import { CounterComposedController } from '../logic/CounterComposedController.js';

function createFakeActor(initialCount = 0) {
  let count = initialCount;
  let callback = null;

  return {
    send(event) {
      if (event.type === 'INCREMENT') count += 1;
      if (event.type === 'DECREMENT') count -= 1;
      if (event.type === 'RESET') count = 0;
      if (callback) callback();
    },
    getSnapshot() {
      return { context: { count } };
    },
    subscribe(cb) {
      callback = cb;
      return vi.fn();
    }
  };
}

describe('CounterComposedController', () => {
  it('calculates totals from actor snapshots', () => {
    const controller = new CounterComposedController({
      global: createFakeActor(3),
      childA: createFakeActor(1),
      childB: createFakeActor(2)
    });

    expect(controller.toDisplayObject()).toEqual({
      globalCount: 3,
      localA: 1,
      localB: 2,
      totalA: 4,
      totalB: 5
    });
  });

  it('sends increment/decrement/reset events to actors', () => {
    const global = createFakeActor(0);
    const childA = createFakeActor(0);
    const childB = createFakeActor(0);
    const controller = new CounterComposedController({ global, childA, childB });

    controller.incrementGlobal().incrementA().incrementB();
    controller.syncFromActors();

    expect(controller.toDisplayObject()).toEqual({
      globalCount: 1,
      localA: 1,
      localB: 1,
      totalA: 2,
      totalB: 2
    });

    controller.resetGlobal().resetA().resetB();
    controller.syncFromActors();

    expect(controller.toDisplayObject()).toEqual({
      globalCount: 0,
      localA: 0,
      localB: 0,
      totalA: 0,
      totalB: 0
    });
  });
});
