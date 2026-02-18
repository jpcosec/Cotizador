import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from '../../src/DataStore/InMemoryStore.js';

describe('InMemoryStore', () => {
  let store;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('seed 3 rows → all() returns 3', () => {
    store.seed('ITEMS', [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ]);
    expect(store.all('ITEMS')).toHaveLength(3);
  });

  it('findById with valid ID → returns row', () => {
    store.seed('ITEMS', [{ id: 'X1', name: 'Salon' }]);
    expect(store.findById('ITEMS', 'id', 'X1')).toEqual({ id: 'X1', name: 'Salon' });
  });

  it('findById with invalid ID → returns null', () => {
    store.seed('ITEMS', [{ id: 'X1', name: 'Salon' }]);
    expect(store.findById('ITEMS', 'id', 'NOPE')).toBeNull();
  });

  it('findAll with filter → returns matching subset', () => {
    store.seed('ITEMS', [
      { id: 1, cat: 'A', active: true },
      { id: 2, cat: 'B', active: true },
      { id: 3, cat: 'A', active: false },
    ]);
    const result = store.findAll('ITEMS', { cat: 'A' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual([1, 3]);
  });

  it('findByFK → returns all rows with matching FK', () => {
    store.seed('LINES', [
      { id: 1, quoteId: 'Q1' },
      { id: 2, quoteId: 'Q2' },
      { id: 3, quoteId: 'Q1' },
    ]);
    const result = store.findByFK('LINES', 'quoteId', 'Q1');
    expect(result).toHaveLength(2);
  });

  it('insert → row retrievable immediately', () => {
    store.insert('ITEMS', { id: 'NEW', name: 'Fresh' });
    expect(store.findById('ITEMS', 'id', 'NEW')).toEqual({ id: 'NEW', name: 'Fresh' });
  });

  it('all on empty table → returns empty array', () => {
    expect(store.all('NONEXISTENT')).toEqual([]);
  });
});
