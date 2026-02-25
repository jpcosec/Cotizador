/**
 * HomePage Controller
 *
 * Entry point for the quotation application with three main actions:
 * - New Quotation: Start a fresh quotation
 * - Load Previous: Retrieve a saved quotation
 * - View Database: Access the catalog database
 *
 * Uses a simple event emitter pattern for pub/sub communication.
 *
 * @module HomePage
 */

/**
 * Create a HomePage controller instance.
 * Manages visibility state and action button definitions.
 * Emits events when actions are clicked.
 *
 * @returns {Object} HomePage controller with methods for interaction
 */
export function createHomePageController() {
  // Private state
  const listeners = {};
  let isVisibleState = true;

  // Action definitions
  const actions = [
    {
      id: 'NEW_QUOTATION',
      label: 'New Quotation',
      icon: 'fa-plus',
      color: 'gold'
    },
    {
      id: 'LOAD_PREVIOUS',
      label: 'Load Previous',
      icon: 'fa-history',
      color: 'green'
    },
    {
      id: 'VIEW_DATABASE',
      label: 'View Database',
      icon: 'fa-database',
      color: 'blue'
    }
  ];

  /**
   * Check if the page is visible.
   * @returns {boolean}
   */
  function isVisible() {
    return isVisibleState;
  }

  /**
   * Get the array of action buttons.
   * @returns {Array<Object>} Actions with id, label, icon, color
   */
  function getActions() {
    return [...actions];
  }

  /**
   * Click an action by ID, emitting the corresponding event.
   * @param {string} actionId - The action identifier
   * @returns {void}
   */
  function clickAction(actionId) {
    const action = actions.find((a) => a.id === actionId);
    if (!action) {
      console.warn(`Unknown action: ${actionId}`);
      return;
    }

    // Emit the event
    emit(actionId, {
      actionId,
      timestamp: Date.now()
    });
  }

  /**
   * Register an event listener.
   * @param {string} eventName - The event to listen for
   * @param {Function} callback - Handler function
   * @returns {void}
   */
  function on(eventName, callback) {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(callback);
  }

  /**
   * Unregister an event listener.
   * @param {string} eventName - The event to stop listening for
   * @param {Function} callback - The handler to remove
   * @returns {void}
   */
  function off(eventName, callback) {
    if (!listeners[eventName]) return;
    const index = listeners[eventName].indexOf(callback);
    if (index !== -1) {
      listeners[eventName].splice(index, 1);
    }
  }

  /**
   * Emit an event to all registered listeners.
   * @private
   * @param {string} eventName - The event name
   * @param {Object} data - Event data
   * @returns {void}
   */
  function emit(eventName, data) {
    if (!listeners[eventName]) return;
    listeners[eventName].forEach((callback) => {
      callback(data);
    });
  }

  /**
   * Set visibility state.
   * @param {boolean} visible - True to show, false to hide
   * @returns {void}
   */
  function setVisible(visible) {
    isVisibleState = visible;
  }

  // Public interface
  return {
    isVisible,
    getActions,
    clickAction,
    on,
    off,
    setVisible
  };
}
