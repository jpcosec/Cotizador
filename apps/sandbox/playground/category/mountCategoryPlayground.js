import { loadSeedFromCsvUrl } from '../../../../packages/database/src/csvSeed.browser.js';
import { seedToResolverDb } from '../../../../packages/database/src/playgroundAdapter.js';
import { createCategoryActor } from '../../../../packages/components/category/machine/categoryMachine.js';
import { catalogRuntimeHtml } from '../../../../packages/components/item/ui/playgroundItemSections.js';

const CSV_BASE_URL = '/data/init';

function toNumberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseContextPatch(key, value) {
  if (key === 'hora') return { [key]: value || '09:00' };
  return { [key]: toNumberValue(value, 0) };
}

/**
 * Mount the single-category playground used by I-3 Step 01.
 * @param {HTMLElement|null} root
 */
export async function mountCategoryPlayground(root) {
  if (!root) return;

  const [rawTemplate, seed] = await Promise.all([
    fetch('/packages/components/category/ui/CategoryStandalone.html').then((r) => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);
  const template = rawTemplate.replace('<!-- ITEM_CATALOG_RUNTIME -->', catalogRuntimeHtml);

  const db = seedToResolverDb(seed);
  const actor = createCategoryActor({ db });

  window.categoryStandaloneComponent = function categoryStandaloneComponent() {
    return {
      categoryOptions: [],
      selectedCategoryId: null,
      globalContext: { paxGlobal: 20, dia: 1, hora: '09:00' },
      catalogEntries: [],
      categoryState: {
        items: [],
        subtotal: 0,
        hasErrors: false,
        hasWarnings: false,
      },

      init() {
        const sync = (snapshot) => {
          this.categoryOptions = snapshot.context.categoryOptions;
          this.selectedCategoryId = snapshot.context.selectedCategoryId;
          this.globalContext = { ...snapshot.context.globalContext };
          this.categoryState = snapshot.context.state;
          this.catalogEntries = (snapshot.context.state?.items || []).map((item) => ({
            ...item,
            id: item.entryId,
          }));
        };

        sync(actor.getSnapshot());
        actor.subscribe(sync);
      },

      selectCategory(categoryId) {
        actor.send({ type: 'SELECT_CATEGORY', categoryId });
      },

      setContextField(key, value) {
        actor.send({
          type: 'SET_CONTEXT',
          patch: parseContextPatch(key, value),
        });
      },

      formatMoney(value) {
        return `$${Number(value || 0).toLocaleString('es-CL')}`;
      },

      cardCategory(item) {
        return (
          item?.state?.catalogCard?.categoria ||
          item?.state?.definition?.category ||
          'Uncategorized'
        );
      },

      cardTitle(item) {
        return item?.state?.definition?.name || item?.name || 'Item';
      },

      cardFormula(item) {
        return (
          item?.state?.catalogFormulaHuman ||
          item?.state?.catalogCard?.Precio_Calculado_Default ||
          '-'
        );
      },

      cardPolicy(item) {
        return item?.state?.initPolicyHuman || item?.state?.catalogCard?.InitPolicyHuman || '';
      },

      hasRules(item) {
        return (item?.state?.definition?.rules || []).length > 0;
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

      isRuleApplied(item, ruleId) {
        return (item?.state?.appliedRules || []).some((rule) => rule.id === ruleId);
      },

      lineStatusClass(item) {
        if ((item?.errors || 0) > 0) return 'status-error';
        if ((item?.warnings || 0) > 0) return 'status-warn';
        return 'status-ok';
      },
    };
  };

  root.innerHTML = template;
  root.setAttribute('x-data', 'categoryStandaloneComponent()');
  root.setAttribute('x-init', 'init()');

  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
