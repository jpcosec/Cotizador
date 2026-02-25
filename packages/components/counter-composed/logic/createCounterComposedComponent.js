import { CounterComposedController } from './CounterComposedController.js';
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
  const controller = new CounterComposedController(createComposedActors());

  window.counterComposedComponent = function counterComposedComponent() {
    return {
      ...controller.toDisplayObject(),

      init() {
        controller.initSubscriptions((display) => {
          Object.assign(this, display);
        });
      },

      incrementGlobal() {
        controller.incrementGlobal();
      },
      decrementGlobal() {
        controller.decrementGlobal();
      },
      resetGlobal() {
        controller.resetGlobal();
      },

      incrementA() {
        controller.incrementA();
      },
      decrementA() {
        controller.decrementA();
      },
      resetA() {
        controller.resetA();
      },

      incrementB() {
        controller.incrementB();
      },
      decrementB() {
        controller.decrementB();
      },
      resetB() {
        controller.resetB();
      }
    };
  };

  root.innerHTML = html;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(root);
  }

  return () => {
    controller.destroy();
    root.innerHTML = '';
  };
}
