import { describe, expect, it } from 'vitest';
import { createCatalogItemCard } from './CatalogItemCard.js';

describe('CatalogItemCard', () => {
  it('emits ITEM_CLICKED with item payload', () => {
    const card = createCatalogItemCard({ id: 'i1', name: 'Coffee' });
    let payload = null;
    card.on('ITEM_CLICKED', (item) => {
      payload = item;
    });

    card.click();

    expect(payload).toEqual({ id: 'i1', name: 'Coffee' });
  });
});
