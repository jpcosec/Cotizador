import { loadSeedFromCsvUrl } from '../../../../database/src/csvSeed.browser.js';
import { createCategoryActor } from '../machine/categoryMachine.js';

const CSV_BASE_URL = '/data/init';

function toNumberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseContextPatch(key, value) {
  if (key === 'hora') return { [key]: value || '09:00' };
  return { [key]: toNumberValue(value, 0) };
}

function mapSeedToDb(seed) {
  const seedMap = Object.fromEntries(seed.map(({ table, records }) => [table, records]));
  return {
    items: seedMap.ITEM_CATALOGO || [],
    categorias: seedMap.CATEGORIAS || [],
    perfiles: seedMap.PERFILES_PRECIO || [],
    perfilesInit: seedMap.PERFILES_INICIALIZACION || [],
    reglas: seedMap.REGLAS_NEGOCIO || [],
  };
}

/**
 * Mount the single-category playground used by I-3 Step 01.
 * @param {HTMLElement|null} root
 */
export async function mountCategoryStandalone(root) {
  if (!root) return;

  const [template, seed] = await Promise.all([
    fetch('/packages/components/category/ui/CategoryStandalone.html').then((r) => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const db = mapSeedToDb(seed);
  const actor = createCategoryActor({ db });

  window.categoryStandaloneComponent = function categoryStandaloneComponent() {
    return {
      categoryOptions: [],
      selectedCategoryId: null,
      globalContext: { paxGlobal: 20, dia: 1, hora: '09:00' },
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
