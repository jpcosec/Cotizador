import { createCounterActor } from '../machine/counterMachine.js';

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
