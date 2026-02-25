import { describe, it, expect } from 'vitest';
import { createHomePageController } from './HomePage.js';

describe('HomePage', () => {
  it('should initialize with visible: true', () => {
    const controller = createHomePageController();
    expect(controller.isVisible()).toBe(true);
  });

  it('should have three action buttons', () => {
    const controller = createHomePageController();
    const actions = controller.getActions();
    expect(actions.length).toBe(3);
    expect(actions[0].label).toBe('New Quotation');
    expect(actions[1].label).toBe('Load Previous');
    expect(actions[2].label).toBe('View Database');
  });

  it('should emit NEW_QUOTATION event on new quotation click', () => {
    const controller = createHomePageController();
    let emittedEvent = null;
    controller.on('NEW_QUOTATION', (event) => {
      emittedEvent = event;
    });
    controller.clickAction('NEW_QUOTATION');
    expect(emittedEvent).not.toBeNull();
  });

  it('should emit LOAD_PREVIOUS event on load previous click', () => {
    const controller = createHomePageController();
    let emittedEvent = null;
    controller.on('LOAD_PREVIOUS', (event) => {
      emittedEvent = event;
    });
    controller.clickAction('LOAD_PREVIOUS');
    expect(emittedEvent).not.toBeNull();
  });

  it('should emit VIEW_DATABASE event on view database click', () => {
    const controller = createHomePageController();
    let emittedEvent = null;
    controller.on('VIEW_DATABASE', (event) => {
      emittedEvent = event;
    });
    controller.clickAction('VIEW_DATABASE');
    expect(emittedEvent).not.toBeNull();
  });
});
