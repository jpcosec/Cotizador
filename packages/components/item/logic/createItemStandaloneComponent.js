import { createItemActor } from '../machine/itemMachine.js';

function numberFromInput(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function mountItemStandalone(root) {
  if (!root) return;

  const templatePath = '/packages/components/item/ui/ItemStandalone.html';
  const html = await fetch(templatePath).then((res) => res.text());
  const actor = createItemActor();

  window.itemStandaloneComponent = function itemStandaloneComponent() {
    return {
      state: actor.getSnapshot().context,
      _subscription: null,

      init() {
        this._subscription = actor.subscribe((snapshot) => {
          this.state = snapshot.context;
        });
      },

      setMode(mode) {
        actor.send({ type: 'SET_MODE', mode });
      },

      setExternalNumber(key, value) {
        const parsed = numberFromInput(value);
        actor.send({ type: 'SET_EXTERNAL_CONTEXT', externalContext: { [key]: parsed } });
      },

      setExternalText(key, value) {
        actor.send({ type: 'SET_EXTERNAL_CONTEXT', externalContext: { [key]: value } });
      },

      setOverrideNumber(key, value) {
        const parsed = numberFromInput(value);
        if (parsed == null) {
          actor.send({ type: 'CLEAR_OVERRIDE', key });
          return;
        }
        actor.send({ type: 'SET_OVERRIDE', key, value: parsed });
      },

      setOverrideText(key, value) {
        if (!value) {
          actor.send({ type: 'CLEAR_OVERRIDE', key });
          return;
        }
        actor.send({ type: 'SET_OVERRIDE', key, value });
      },

      resetOverrides() {
        actor.send({ type: 'RESET_OVERRIDES' });
      },

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
