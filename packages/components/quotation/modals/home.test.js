import { describe, expect, it } from 'vitest';
import { createHomePage } from './HomePage.js';

describe('HomePage', () => {
  it('initializes visible with three actions', () => {
    const home = createHomePage();

    expect(home.isVisible()).toBe(true);
    expect(home.getActions()).toHaveLength(3);
  });

  it('emits action event on clickAction', () => {
    const home = createHomePage();
    let emitted = null;
    home.on('NEW_QUOTATION', (payload) => {
      emitted = payload;
    });

    home.clickAction('NEW_QUOTATION');

    expect(emitted).toEqual({ action: 'NEW_QUOTATION' });
  });

  it('returns Alpine display object', () => {
    const home = createHomePage();

    expect(home.toDisplayObject()).toMatchObject({
      isVisible: true
    });
  });
});
