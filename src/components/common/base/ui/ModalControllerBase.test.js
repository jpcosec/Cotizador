import { describe, expect, it } from 'vitest';
import { ModalControllerBase } from './ModalControllerBase.js';

class TestModalController extends ModalControllerBase {
  validate() {
    return [];
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      form: this.getFormState()
    };
  }
}

describe('ModalControllerBase', () => {
  it('composes modal, form, event, service, alpine methods', () => {
    const controller = new TestModalController();

    expect(typeof controller.open).toBe('function');
    expect(typeof controller.setField).toBe('function');
    expect(typeof controller.on).toBe('function');
    expect(typeof controller.injectService).toBe('function');
    expect(typeof controller.toDisplayObject).toBe('function');
  });

  it('handles modal lifecycle and form updates', () => {
    const controller = new TestModalController();

    controller.open().setField('pax', 20).close();

    expect(controller.isOpen()).toBe(false);
    expect(controller.getField('pax')).toBe(20);
  });
});
