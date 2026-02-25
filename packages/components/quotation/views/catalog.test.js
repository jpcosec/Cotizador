import { describe, expect, it } from 'vitest';
import { createCatalog } from './Catalog.js';

describe('Catalog', () => {
  const categories = [
    { id: 'cat-1', name: 'Coffee', items: [{ id: 'i1', name: 'Coffee Break' }] },
    { id: 'cat-2', name: 'Bar', items: [{ id: 'i2', name: 'Open Bar' }] }
  ];

  it('filters category items by search term', () => {
    const catalog = createCatalog(categories);

    const filtered = catalog.filterBySearch('coffee');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].items).toHaveLength(1);
  });

  it('emits ITEM_SELECTED and ITEM_CLICKED', () => {
    const catalog = createCatalog(categories);
    let selected = 0;
    catalog.on('ITEM_SELECTED', () => {
      selected += 1;
    });
    catalog.on('ITEM_CLICKED', () => {
      selected += 1;
    });

    catalog.selectItem({ id: 'i1' });

    expect(selected).toBe(2);
  });
});
