import { describe, expect, it } from 'vitest';
import { createCategoryGroup } from './CategoryGroup.js';

describe('CategoryGroup', () => {
  it('toggles expansion state', () => {
    const group = createCategoryGroup({ id: 'cat-1', name: 'Coffee', items: [] });

    group.toggle();

    expect(group.toDisplayObject().isExpanded).toBe(false);
  });

  it('emits ITEM_SELECTED on clickItem', () => {
    const group = createCategoryGroup({ id: 'cat-1', name: 'Coffee', items: [] });
    let selected = null;
    group.on('ITEM_SELECTED', (item) => {
      selected = item;
    });

    group.clickItem({ id: 'i1' });

    expect(selected).toEqual({ id: 'i1' });
  });
});
