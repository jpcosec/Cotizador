import { createComposedActors } from '../machine/composedCounterMachine.js';

/**
 * Mount the composed counter component into a DOM element.
 * Demonstrates the global + local actor pattern: one shared counter
 * and two child counters whose totals combine with the global value.
 * Registers `counterComposedComponent` on `window` for Alpine.js.
 * @param {HTMLElement|null} root - Container element to mount into. No-op if null.
 */
export async function mountCounterComposed(root) {
  if (!root) return;

  const templatePath = '/packages/components/counter-composed/ui/CounterComposed.html';
  const html = await fetch(templatePath).then((res) => res.text());
  const actors = createComposedActors();

  function send(actor, type) {
    actor.send({ type });
  }

  window.counterComposedComponent = function counterComposedComponent() {
    return {
      globalCount: actors.global.getSnapshot().context.count,
      localA: actors.childA.getSnapshot().context.count,
      localB: actors.childB.getSnapshot().context.count,
      totalA: 0,
      totalB: 0,
      _subscriptions: [],

      init() {
        const sync = () => {
          this.globalCount = actors.global.getSnapshot().context.count;
          this.localA = actors.childA.getSnapshot().context.count;
          this.localB = actors.childB.getSnapshot().context.count;
          this.totalA = this.globalCount + this.localA;
          this.totalB = this.globalCount + this.localB;
        };

        this._subscriptions = [
          actors.global.subscribe(sync),
          actors.childA.subscribe(sync),
          actors.childB.subscribe(sync)
        ];
        sync();
      },

      incrementGlobal() { send(actors.global, 'INCREMENT'); },
      decrementGlobal() { send(actors.global, 'DECREMENT'); },
      resetGlobal() { send(actors.global, 'RESET'); },

      incrementA() { send(actors.childA, 'INCREMENT'); },
      decrementA() { send(actors.childA, 'DECREMENT'); },
      resetA() { send(actors.childA, 'RESET'); },

      incrementB() { send(actors.childB, 'INCREMENT'); },
      decrementB() { send(actors.childB, 'DECREMENT'); },
      resetB() { send(actors.childB, 'RESET'); }
    };
  };

  root.innerHTML = html;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(root);
  }
}
