import { createItemActor } from '../machine/itemMachine.js';
import { Item } from '../Item.js';
import { loadSeedFromCsvUrl } from '../../../../packages/database/src/csvSeed.browser.js';
import { resolveItemDefinition } from '../../../../packages/database/src/resolveItemDefinition.js';

const CSV_BASE_URL = '/data/init';

/**
 * Mount the standalone item playground.
 * Loads reference data from CSV, resolves item definitions, and wires Alpine.
 *
 * @param {HTMLElement|null} root - Container element.
 */
export async function mountItemStandalone(root) {
  if (!root) return;

  const [html, dbSeed] = await Promise.all([
    fetch('/packages/components/item/ui/ItemStandalone.html').then(r => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL)
  ]);

  const db = {
    items:     dbSeed.ITEM_CATALOGO,
    categorias: dbSeed.CATEGORIAS,
    perfiles:   dbSeed.PERFILES_PRECIO,
    reglas:     dbSeed.REGLAS_NEGOCIO,
  };

  const itemOptions = db.items
    .filter(i => i.Activo !== false)
    .map(i => ({ id: i.ID_Item, name: i.Nombre }));

  let actor = null;
  let unsubscribe = null;

  function loadItem(itemId, component) {
    if (typeof unsubscribe === 'function') unsubscribe();
    actor?.stop?.();
    const resolvedDef = resolveItemDefinition(itemId, db);
    actor = createItemActor(Item.fromDefinition(resolvedDef).toSeed());
    unsubscribe = actor.subscribe(snap => { component.state = snap.context; });
    component.state = actor.getSnapshot().context;
  }

  window.itemStandaloneComponent = function itemStandaloneComponent() {
    return {
      state: {},
      selectedItemId: itemOptions[0]?.id ?? null,
      itemOptions,

      init() {
        if (this.selectedItemId) loadItem(this.selectedItemId, this);
      },

      changeItem(itemId) {
        this.selectedItemId = itemId;
        loadItem(itemId, this);
      },

      // ─── Context ───────────────────────────────────────────────────────────
      setContext(key, value) {
        actor.send({ type: 'SET_CONTEXT', patch: { [key]: Number(value) || value } });
      },

      // ─── Mode transitions ──────────────────────────────────────────────────
      addToBasket()      { actor.send({ type: 'ADD_TO_BASKET' }); },
      removeFromBasket() { actor.send({ type: 'REMOVE_FROM_BASKET' }); },

      // ─── Overrides (basket) ────────────────────────────────────────────────
      setOverride(key, value) { actor.send({ type: 'SET_OVERRIDE', key, value }); },
      clearOverride(key)      { actor.send({ type: 'CLEAR_OVERRIDE', key }); },
      resetOverrides()        { actor.send({ type: 'RESET_OVERRIDES' }); },

      // ─── Rule inspector helpers ────────────────────────────────────────────
      expandedRules: {},
      toggleRuleExpanded(idx) {
        this.expandedRules[idx] = !this.expandedRules[idx];
      },

      formatConditionPreview(condition) {
        const json = JSON.stringify(condition);
        return json.length > 80 ? json.slice(0, 80) + '…' : json;
      },

      humanizeCondition(condition) {
        if (!condition || typeof condition !== 'object') return 'No condition';
        const humanize = cond => {
          const [op] = Object.keys(cond);
          const val = cond[op];
          const label = v => (v && typeof v === 'object' && v.var) ? `"${v.var}"` : JSON.stringify(v);
          if (op === 'and') return (Array.isArray(val) ? val : [val]).map(humanize).join(' AND ');
          if (op === 'or')  return (Array.isArray(val) ? val : [val]).map(humanize).join(' OR ');
          const ops = { '===': 'equals', '!==': '≠', '>': '>', '<': '<', '>=': '≥', '<=': '≤' };
          if (ops[op] && Array.isArray(val)) return `${label(val[0])} ${ops[op]} ${label(val[1])}`;
          return `${op}: ${JSON.stringify(val)}`;
        };
        return humanize(condition);
      },
    };
  };

  root.innerHTML = html;
  if (window.Alpine?.initTree) window.Alpine.initTree(root);
}
