import { describe, expect, it } from 'vitest';
import { createQuotationView } from './QuotationView.js';

describe('QuotationView', () => {
  it('tracks selected day and emits DAY_SELECTED', () => {
    const view = createQuotationView();
    let payload = null;
    view.on('DAY_SELECTED', (event) => {
      payload = event;
    });

    view.selectDay(2);

    expect(payload).toEqual({ dayIndex: 2 });
  });

  it('returns display object with composition flags', () => {
    const view = createQuotationView()
      .setSidebar({})
      .setBasket({})
      .setHeader({})
      .setTotals({});

    expect(view.toDisplayObject()).toEqual({
      selectedDayIndex: 0,
      hasSidebar: true,
      hasBasket: true,
      hasHeader: true,
      hasTotals: true
    });
  });
});
