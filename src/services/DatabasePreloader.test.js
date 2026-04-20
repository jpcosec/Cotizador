import { describe, it, expect, vi } from 'vitest';
import { createDatabasePreloader } from './DatabasePreloader.js';

describe('DatabasePreloader', () => {
  it('should return preloader instance with load() method', () => {
    const preloader = createDatabasePreloader();
    expect(typeof preloader.load).toBe('function');
  });

  it('should start loading when load() is called', async () => {
    const preloader = createDatabasePreloader();
    const loadPromise = preloader.load();
    expect(preloader.isLoading()).toBe(true);
  });

  it('should cache catalog items after loading', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    const catalog = preloader.getCatalog();
    expect(Array.isArray(catalog)).toBe(true);
  });

  it('should cache rules after loading', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    const rules = preloader.getRules();
    expect(Array.isArray(rules)).toBe(true);
  });

  it('should cache pricing profiles after loading', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    const profiles = preloader.getPricingProfiles();
    expect(Array.isArray(profiles)).toBe(true);
  });

  it('should report isLoading() as false after load completes', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    expect(preloader.isLoading()).toBe(false);
  });

  it('should return isReady() true after loading completes', async () => {
    const preloader = createDatabasePreloader();
    await preloader.load();
    expect(preloader.isReady()).toBe(true);
  });

  it.skip('should throw error if load fails', async () => {
    // This test will be implemented to simulate failure
    // For now, skipped pending error handling test
  });
});
