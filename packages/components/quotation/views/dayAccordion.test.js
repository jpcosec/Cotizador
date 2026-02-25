import { describe, expect, it } from 'vitest';
import { createDayAccordion } from './DayAccordion.js';

describe('DayAccordion', () => {
  it('computes item count and total', () => {
    const accordion = createDayAccordion(0, [
      { id: 'i1', total: 1000 },
      { id: 'i2', total: 2500 }
    ]);

    expect(accordion.getItemCount()).toBe(2);
    expect(accordion.getTotal()).toBe(3500);
  });
});
