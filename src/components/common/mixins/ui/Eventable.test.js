import { describe, expect, it, vi } from 'vitest';
import { Eventable } from './Eventable.js';

describe('Eventable', () => {
  it('registers and emits events', () => {
    const EventableClass = Eventable(class {});
    const target = new EventableClass();
    const listener = vi.fn();

    const result = target.on('EVENT', listener).emit('EVENT', { ok: true });

    expect(result).toBe(target);
    expect(listener).toHaveBeenCalledWith({ ok: true });
  });

  it('removes listeners with off', () => {
    const EventableClass = Eventable(class {});
    const target = new EventableClass();
    const listener = vi.fn();

    target.on('EVENT', listener).off('EVENT', listener).emit('EVENT');

    expect(listener).not.toHaveBeenCalled();
  });
});
