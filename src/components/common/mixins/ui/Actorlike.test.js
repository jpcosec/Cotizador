import { describe, expect, it, vi } from 'vitest';
import { Actorlike } from './Actorlike.js';

describe('Actorlike', () => {
  it('sets actor ref and sends events', () => {
    const actorRef = {
      send: vi.fn(),
      getSnapshot: vi.fn(() => ({ context: { count: 2 } })),
      subscribe: vi.fn(() => () => {})
    };
    const ActorlikeClass = Actorlike(class {});
    const target = new ActorlikeClass();

    const result = target.setActorRef(actorRef).sendEvent('INCREMENT', { step: 1 });

    expect(result).toBe(target);
    expect(target.hasActorRef).toBe(true);
    expect(actorRef.send).toHaveBeenCalledWith({ type: 'INCREMENT', step: 1 });
    expect(target.getSnapshot()).toEqual({ context: { count: 2 } });
  });

  it('subscribes through actor ref when present', () => {
    const unsubscribe = vi.fn();
    const actorRef = {
      send: vi.fn(),
      getSnapshot: vi.fn(),
      subscribe: vi.fn(() => unsubscribe)
    };
    const callback = vi.fn();
    const ActorlikeClass = Actorlike(class {});
    const target = new ActorlikeClass().setActorRef(actorRef);

    const result = target.subscribe(callback);

    expect(actorRef.subscribe).toHaveBeenCalledWith(callback);
    expect(result).toBe(unsubscribe);
  });
});
