import { createCounterActor } from '../machine/counterMachine.js';

/**
 * Mount the basic counter component into a DOM element.
 * Fetches the HTML template, creates an XState actor, and registers
 * an Alpine.js component (`counterBasicComponent`) on `window`.
 * @param {HTMLElement|null} root - Container element to mount into. No-op if null.
 */
export async function mountCounterBasic(root) {
  if (!root) return;

  const templatePath = '/packages/components/counter-basic/ui/CounterBasic.html';
  const html = await fetch(templatePath).then((res) => res.text());

  const actor = createCounterActor();

  window.counterBasicComponent = function counterBasicComponent() {
    return {
      count: actor.getSnapshot().context.count,
      state: JSON.stringify(actor.getSnapshot().value),
      _subscription: null,

      init() {
        this._subscription = actor.subscribe((snap) => {
          this.count = snap.context.count;
          this.state = JSON.stringify(snap.value);
        });
      },

      increment() {
        actor.send({ type: 'INCREMENT' });
      },

      decrement() {
        actor.send({ type: 'DECREMENT' });
      },

      reset() {
        actor.send({ type: 'RESET' });
      }
    };
  };

  root.innerHTML = html;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(root);
  }
}
