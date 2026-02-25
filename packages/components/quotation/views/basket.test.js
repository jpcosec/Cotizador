import { describe, expect, it } from 'vitest';
import { createBasket } from './Basket.js';

describe('Basket', () => {
  it('adds and removes items from selected day', () => {
    const basket = createBasket();
    basket.setSelectedDayIndex(1).addItem({ id: 'i1' }).addItem({ id: 'i2' });

    expect(basket.getItemsForDay(1)).toHaveLength(2);

    basket.removeItem('i1', 1);

    expect(basket.getItemsForDay(1)).toEqual([{ id: 'i2' }]);
  });
});
