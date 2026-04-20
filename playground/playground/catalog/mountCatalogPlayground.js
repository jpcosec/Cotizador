import { loadSeedFromCsvUrl } from '../../../src/database/src/csvSeed.browser.js';
import { seedToResolverDb } from '../../../src/database/src/playgroundAdapter.js';
import { createCatalogActor } from '../../../src/components/catalog/machine/catalogMachine.js';
import { catalogRuntimeHtml } from '../../../src/components/item/ui/playgroundItemSections.js';

const CSV_BASE_URL = '/data/init';

function toNumberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseContextPatch(key, value) {
  if (key === 'hora') return { [key]: value || '09:00' };
  return { [key]: toNumberValue(value, 0) };
}

function toCategoryEntryState(category) {
  const state = category?.state || null;
  return {
    ...category,
    catalogEntries: (state?.items || []).map((item) => ({
      ...item,
      id: item.entryId,
    })),
    ruleWarningsCount: (state?.ruleWarnings || []).length,
    ruleErrorsCount: (state?.ruleErrors || []).length,
    loadErrors: state?.loadErrors || [],
  };
}

export async function mountCatalogPlayground(root) {
  if (!root) return;

  const [rawTemplate, seed] = await Promise.all([
    fetch('/src/components/catalog/ui/CatalogStandalone.html').then((r) => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const template = rawTemplate.replace('<!-- ITEM_CATALOG_RUNTIME -->', catalogRuntimeHtml);
  const db = seedToResolverDb(seed);
  const actor = createCatalogActor({ db });

  window.catalogStandaloneComponent = function catalogStandaloneComponent() {
    return {
      searchTerm: '',
      categoryOptions: [],
      expandedCategoryIds: [],
      globalContext: { paxGlobal: 20, dia: 1, hora: '09:00' },
      catalogSummary: {
        categoryCount: 0,
        expandedCount: 0,
        loadedCount: 0,
        subtotal: 0,
        categoriesWithWarnings: 0,
        categoriesWithErrors: 0,
      },
      categoriesState: [],

      init() {
        const sync = (snapshot) => {
          this.categoryOptions = snapshot.context.categoryOptions || [];
          this.expandedCategoryIds = [...(snapshot.context.expandedCategoryIds || [])];
          this.globalContext = { ...snapshot.context.globalContext };
          this.catalogSummary = {
            categoryCount: 0,
            expandedCount: 0,
            loadedCount: 0,
            subtotal: 0,
            categoriesWithWarnings: 0,
            categoriesWithErrors: 0,
            ...(snapshot.context.state?.summary || {}),
          };
          this.categoriesState = (snapshot.context.state?.categories || []).map(toCategoryEntryState);
        };

        sync(actor.getSnapshot());
        actor.subscribe(sync);
      },

      filteredCategories() {
        const term = String(this.searchTerm || '').trim().toLowerCase();
        if (!term) return this.categoriesState;
        return this.categoriesState.filter((category) => {
          if (String(category.nombre || '').toLowerCase().includes(term)) return true;
          return category.catalogEntries.some((entry) =>
            String(entry?.state?.definition?.name || '').toLowerCase().includes(term)
          );
        });
      },

      toggleCategory(categoryId) {
        actor.send({ type: 'TOGGLE_CATEGORY', categoryId });
      },

      expandAll() {
        for (const option of this.categoryOptions) {
          if (this.expandedCategoryIds.includes(option.id)) continue;
          actor.send({ type: 'EXPAND_CATEGORY', categoryId: option.id });
        }
      },

      collapseAll() {
        for (const categoryId of this.expandedCategoryIds) {
          actor.send({ type: 'COLLAPSE_CATEGORY', categoryId });
        }
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
  root.setAttribute('x-data', 'catalogStandaloneComponent()');
  root.setAttribute('x-init', 'init()');

  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
