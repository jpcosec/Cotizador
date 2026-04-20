import { describe, expect, it, vi } from 'vitest';
import { UIContainerBase } from './UIContainerBase.js';

class TestUIContainer extends UIContainerBase {
  toDisplayObject() {
    return { hasActorRef: this.hasActorRef };
  }
}

describe('UIContainerBase', () => {
  it('composes event, actor, alpine methods', () => {
    const container = new TestUIContainer();

    expect(typeof container.on).toBe('function');
    expect(typeof container.setActorRef).toBe('function');
    expect(typeof container.toDisplayObject).toBe('function');
  });

  it('sends events through actor ref', () => {
    const actor = { send: vi.fn() };
    const container = new TestUIContainer().setActorRef(actor);

    container.sendEvent('PING', { id: 1 });

    expect(actor.send).toHaveBeenCalledWith({ type: 'PING', id: 1 });
  });
});
