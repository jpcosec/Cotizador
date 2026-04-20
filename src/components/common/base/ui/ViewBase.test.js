import { describe, expect, it } from 'vitest';
import { ViewBase } from './ViewBase.js';

class TestView extends ViewBase {
  constructor() {
    super();
    this.visible = true;
  }

  toDisplayObject() {
    return { visible: this.visible };
  }
}

describe('ViewBase', () => {
  it('composes event + alpine methods', () => {
    const view = new TestView();

    expect(typeof view.on).toBe('function');
    expect(typeof view.emit).toBe('function');
    expect(typeof view.toDisplayObject).toBe('function');
  });

  it('returns display object contract', () => {
    const view = new TestView();

    expect(view.toDisplayObject()).toEqual({ visible: true });
  });
});
