import { createItemActor } from '../machine/itemMachine.js';

/**
 * Mount the standalone item component into a DOM element.
 * Fetches the HTML template, creates an XState actor, and registers
 * an Alpine.js component (`itemStandaloneComponent`) on `window`.
 * @param {HTMLElement|null} root - Container element to mount into. No-op if null.
 */
export async function mountItemStandalone(root) {
  if (!root) return;

  const templatePath = '/packages/components/item/ui/ItemStandalone.html';
  const html = await fetch(templatePath).then(res => res.text());
  const actor = createItemActor();

  window.itemStandaloneComponent = function itemStandaloneComponent() {
    return {
      // Reactive state from actor snapshot
      state: actor.getSnapshot().context,
      _subscription: null,

      // UI-only state
      expanded: true,
      lastAction: '',

      init() {
        this._subscription = actor.subscribe(snap => {
          this.state = snap.context;
        });
      },

      // Mode transitions
      addToBasket() {
        actor.send({ type: 'ADD_TO_BASKET' });
        this.lastAction = 'Added to basket';
      },
      removeFromBasket() {
        actor.send({ type: 'REMOVE_FROM_BASKET' });
        this.lastAction = 'Removed from basket';
      },

      // Context (global pax, duration, schedule)
      setContext(key, value) {
        actor.send({ type: 'SET_CONTEXT', patch: { [key]: Number(value) || value } });
      },

      // Profile editing
      setProfileValue(key, value) {
        actor.send({ type: 'SET_PROFILE_VALUE', key, value: Number(value) });
      },

      // Default quantity editing
      setDefaultQuantity(key, value) {
        actor.send({ type: 'SET_DEFAULT_QUANTITY', key, value: Number(value) });
      },
      clearDefaultQuantity(key) {
        actor.send({ type: 'CLEAR_DEFAULT_QUANTITY', key });
      },

      // Overrides (basket mode)
      setOverride(key, value) {
        actor.send({ type: 'SET_OVERRIDE', key, value });
      },
      clearOverride(key) {
        actor.send({ type: 'CLEAR_OVERRIDE', key });
      },
      resetOverrides() {
        actor.send({ type: 'RESET_OVERRIDES' });
      },

      // Debug
      prettyState() {
        return JSON.stringify(this.state, null, 2);
      }
    };
  };

  root.innerHTML = html;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(root);
  }
}
