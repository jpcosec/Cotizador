import { describe, expect, it } from 'vitest';
import { createSidebar } from './Sidebar.js';

describe('Sidebar', () => {
  const items = [
    { id: 'i1', name: 'Coffee Break', category: 'Coffee' },
    { id: 'i2', name: 'Open Bar', category: 'Bar' }
  ];

  it('filters items by search term', () => {
    const sidebar = createSidebar(items);
    sidebar.search('coffee');

    expect(sidebar.getFilteredItems()).toEqual([items[0]]);
  });

  it('emits ITEM_SELECTED on selectItem', () => {
    const sidebar = createSidebar(items);
    let selected = null;
    sidebar.on('ITEM_SELECTED', (item) => {
      selected = item;
    });

    sidebar.selectItem('i2');

    expect(selected).toEqual(items[1]);
  });
});
