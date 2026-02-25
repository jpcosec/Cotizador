import { createHomePage } from '../../../packages/components/quotation/modals/HomePage.js';

/**
 * Legacy compatibility wrapper.
 * Keeps the old app-level controller API while delegating behavior
 * to the package implementation in `packages/components/quotation`.
 */
export function createHomePageController() {
  const home = createHomePage();
  let visible = true;

  return {
    isVisible() {
      return visible;
    },

    setVisible(nextVisible) {
      visible = Boolean(nextVisible);
    },

    getActions() {
      return home.getActions();
    },

    clickAction(actionId) {
      if (!visible) {
        return;
      }

      home.clickAction(actionId);
    },

    on(eventName, callback) {
      home.on(eventName, callback);
    },

    off(eventName, callback) {
      home.off(eventName, callback);
    }
  };
}
