import { describe, expect, it } from 'vitest';
import { Serviceable } from './Serviceable.js';

describe('Serviceable', () => {
  it('injects and retrieves services', () => {
    const ServiceableClass = Serviceable(class {});
    const target = new ServiceableClass();
    const service = { ping: () => 'pong' };

    const result = target.injectService('api', service);

    expect(result).toBe(target);
    expect(target.getService('api')).toBe(service);
    expect(target.hasService('api')).toBe(true);
  });
});
