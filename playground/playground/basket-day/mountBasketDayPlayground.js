import { loadSeedFromCsvUrl } from '../../../src/database/src/csvSeed.browser.js';
import { seedToResolverDb } from '../../../src/database/src/playgroundAdapter.js';
import { createBasketDayActor } from '../../../src/components/basket-day/machine/basketDayMachine.js';
import { basketRuntimeHtml } from '../../../src/components/item/ui/playgroundItemSections.js';

const CSV_BASE_URL = '/data/init';

function toNumberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseContextPatch(key, value) {
  if (key === 'hora') return { [key]: value || '09:00' };
  return { [key]: toNumberValue(value, 0) };
}

function parseOverrideValue(value) {
  if (value === '') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export async function mountBasketDayPlayground(root) {
  if (!root) return;

  const [rawTemplate, seed] = await Promise.all([
    fetch('/src/components/basket-day/ui/BasketDayStandalone.html').then((r) => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const template = rawTemplate.replace('<!-- BASKET_RUNTIME -->', () => basketRuntimeHtml);
  const db = seedToResolverDb(seed);
  const actor = createBasketDayActor({ db, dayIndex: 1 });

  window.basketDayComponent = function basketDayComponent() {
    return {
      itemOptions: [],
      selectedItemId: null,
      globalContext: { paxGlobal: 20, dia: 1, hora: '09:00', duracionMin: 120 },
      dayState: { dayIndex: 1, entryCount: 0, entries: [], ruleWarnings: [], ruleErrors: [] },
      basketEntries: [],

      init() {
        const sync = (snapshot) => {
          this.itemOptions = snapshot.context.itemOptions || [];
          this.selectedItemId = snapshot.context.selectedItemId;
          this.globalContext = { ...snapshot.context.globalContext };
          this.dayState = snapshot.context.state || {
            dayIndex: 1,
            entryCount: 0,
            entries: [],
            ruleWarnings: [],
            ruleErrors: [],
          };
          this.basketEntries = (snapshot.context.state?.entries || []).map((entry) => ({
            ...entry,
            id: entry.entryId,
          }));
        };

        sync(actor.getSnapshot());
        actor.subscribe(sync);
      },

      selectItem(itemId) {
        actor.send({ type: 'SELECT_ITEM', itemId });
      },

      shipSelectedItem() {
        actor.send({ type: 'SHIP_SELECTED_ITEM' });
      },

      setContextField(key, value) {
        actor.send({
          type: 'SET_CONTEXT',
          patch: parseContextPatch(key, value),
        });
      },

      setBasketOverride(entryId, key, value) {
        if (value === '') {
          actor.send({ type: 'CLEAR_ENTRY_OVERRIDE', entryId, key });
          return;
        }

        actor.send({
          type: 'SET_ENTRY_OVERRIDE',
          entryId,
          key,
          value: parseOverrideValue(value),
        });
      },

      clearBasketOverride(entryId, key) {
        actor.send({ type: 'CLEAR_ENTRY_OVERRIDE', entryId, key });
      },

      resetBasketOverrides(entryId) {
        actor.send({ type: 'RESET_ENTRY_OVERRIDES', entryId });
      },

      destroyRuntimeEntry(column, entryId) {
        if (column !== 'basket') return;
        actor.send({ type: 'REMOVE_ENTRY', entryId });
      },

      ruleClass(state) {
        if ((state?.ruleErrors || []).length > 0) return 'error';
        if ((state?.ruleWarnings || []).length > 0) return 'warn';
        return 'ok';
      },

      ruleIcon(state) {
        if ((state?.ruleErrors || []).length > 0) return 'fa-xmark';
        if ((state?.ruleWarnings || []).length > 0) return 'fa-exclamation';
        return 'fa-check';
      },

      formatMoney(value) {
        return Number(value || 0).toLocaleString('es-CL');
      },
    };
  };

  root.innerHTML = template;
  root.setAttribute('x-data', 'basketDayComponent()');
  root.setAttribute('x-init', 'init()');

  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
