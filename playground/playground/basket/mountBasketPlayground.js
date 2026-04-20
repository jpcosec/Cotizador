import { loadSeedFromCsvUrl } from '../../../src/database/src/csvSeed.browser.js';
import { seedToResolverDb } from '../../../src/database/src/playgroundAdapter.js';
import { createBasketActor } from '../../../src/components/basket/machine/basketMachine.js';
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

export async function mountBasketPlayground(root) {
  if (!root) return;

  const [rawTemplate, seed] = await Promise.all([
    fetch('/src/components/basket/ui/BasketStandalone.html').then((r) => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const template = rawTemplate.replace('<!-- BASKET_RUNTIME -->', () => basketRuntimeHtml);
  const db = seedToResolverDb(seed);
  const actor = createBasketActor({ db, dayCount: 3 });

  window.basketComponent = function basketComponent() {
    return {
      dayOptions: [],
      itemOptions: [],
      selectedItemId: null,
      selectedDayIndex: 1,
      globalContext: { paxGlobal: 20, dia: 1, hora: '09:00', duracionMin: 120 },
      basketState: {
        days: [],
        summary: {
          dayCount: 0,
          totalEntries: 0,
          daysWithWarnings: 0,
          daysWithErrors: 0,
        },
        selectedDayState: null,
      },
      selectedDayState: null,
      basketEntries: [],
      moveTargetByEntry: {},

      init() {
        const sync = (snapshot) => {
          this.dayOptions = snapshot.context.dayOptions || [];
          this.itemOptions = snapshot.context.itemOptions || [];
          this.selectedItemId = snapshot.context.selectedItemId;
          this.selectedDayIndex = snapshot.context.selectedDayIndex;
          this.globalContext = { ...snapshot.context.globalContext };
          this.basketState = snapshot.context.state || {
            days: [],
            summary: {
              dayCount: 0,
              totalEntries: 0,
              daysWithWarnings: 0,
              daysWithErrors: 0,
            },
            selectedDayState: null,
          };
          this.selectedDayState = this.basketState.selectedDayState || null;
          this.basketEntries = (this.selectedDayState?.entries || []).map((entry) => ({
            ...entry,
            id: entry.entryId,
          }));
        };

        sync(actor.getSnapshot());
        actor.subscribe(sync);
      },

      selectDay(dayIndex) {
        actor.send({ type: 'SELECT_DAY', dayIndex: Number(dayIndex) });
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
          actor.send({
            type: 'CLEAR_ENTRY_OVERRIDE',
            dayIndex: this.selectedDayIndex,
            entryId,
            key,
          });
          return;
        }

        actor.send({
          type: 'SET_ENTRY_OVERRIDE',
          dayIndex: this.selectedDayIndex,
          entryId,
          key,
          value: parseOverrideValue(value),
        });
      },

      clearBasketOverride(entryId, key) {
        actor.send({
          type: 'CLEAR_ENTRY_OVERRIDE',
          dayIndex: this.selectedDayIndex,
          entryId,
          key,
        });
      },

      resetBasketOverrides(entryId) {
        actor.send({
          type: 'RESET_ENTRY_OVERRIDES',
          dayIndex: this.selectedDayIndex,
          entryId,
        });
      },

      destroyRuntimeEntry(column, entryId) {
        if (column !== 'basket') return;
        actor.send({
          type: 'REMOVE_ENTRY',
          dayIndex: this.selectedDayIndex,
          entryId,
        });
      },

      moveTargetsFor(entryId) {
        return this.dayOptions.filter((day) => day.dayIndex !== this.selectedDayIndex);
      },

      defaultMoveTarget(entryId) {
        const options = this.moveTargetsFor(entryId);
        if (options.length === 0) return this.selectedDayIndex;
        const cached = Number(this.moveTargetByEntry[entryId]);
        if (options.some((day) => day.dayIndex === cached)) return cached;
        return options[0].dayIndex;
      },

      setMoveTarget(entryId, dayIndex) {
        this.moveTargetByEntry = {
          ...this.moveTargetByEntry,
          [entryId]: Number(dayIndex),
        };
      },

      moveEntry(entryId) {
        const targetDayIndex = this.defaultMoveTarget(entryId);
        if (targetDayIndex === this.selectedDayIndex) return;
        actor.send({
          type: 'MOVE_ENTRY_TO_DAY',
          fromDayIndex: this.selectedDayIndex,
          targetDayIndex,
          entryId,
        });
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
  root.setAttribute('x-data', 'basketComponent()');
  root.setAttribute('x-init', 'init()');

  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
