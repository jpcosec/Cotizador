import { describe, expect, it } from 'vitest';
import { createItemAccordion } from './ItemAccordion.js';

describe('ItemAccordion', () => {
  it('emits ITEM_UPDATED on quantity change', () => {
    const item = createItemAccordion({ id: 'i1', cantidad: 1 });
    let payload = null;
    item.on('ITEM_UPDATED', (event) => {
      payload = event;
    });

    item.setQuantity('cantidad', 5);

    expect(payload).toMatchObject({ field: 'cantidad', value: 5 });
  });

  it('emits ITEM_DELETED on delete', () => {
    const item = createItemAccordion({ id: 'i1' });
    let payload = null;
    item.on('ITEM_DELETED', (event) => {
      payload = event;
    });

    item.delete();

    expect(payload).toEqual({ itemId: 'i1' });
  });
});
