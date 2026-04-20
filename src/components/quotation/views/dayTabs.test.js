import { describe, expect, it } from 'vitest';
import { createDayTabs } from './DayTabs.js';

describe('DayTabs', () => {
  it('selects day and emits DAY_SELECTED', () => {
    const tabs = createDayTabs(['Dia 1', 'Dia 2']);
    let event = null;
    tabs.on('DAY_SELECTED', (payload) => {
      event = payload;
    });

    tabs.selectDay(1);

    expect(event).toEqual({ index: 1, label: 'Dia 2' });
  });
});
