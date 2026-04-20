import { createItemActor } from '../../../src/components/item/machine/itemMachine.js';
import { Item } from '../../../src/components/item/Item.js';
import { loadSeedFromCsvUrl } from '../../../src/database/src/csvSeed.browser.js';
import { resolveItemDefinition } from '../../../src/database/src/resolveItemDefinition.js';
import { seedToResolverDb } from '../../../src/database/src/playgroundAdapter.js';
import { catalogRuntimeHtml, basketRuntimeHtml } from '../../../src/components/item/ui/playgroundItemSections.js';

const CSV_BASE_URL = '/data/init';

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeId(text) {
  return String(text || 'CUSTOM')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42) || 'CUSTOM';
}

function toNumberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function baseCustomDraft() {
  return {
    name: 'Custom Item',
    description: '',
    category: 'Custom Category',
    baseFijo: 0,
    porPersona: 0,
    porUnidad: 1,
    porMinuto: 0,
    duracionMin: 0,
    unidadesPorUsuario: 1,
    unidadesPorHora: 0,
    minutosPorUsuario: 0,
    cantidad: 0,
    pax: 0,
    requierePax: false,
    requiereCant: true,
    requiereTiempo: false,
    requiereHora: false,
    ruleEnabled: false,
    ruleType: 'WARNING',
    ruleField: 'cantidad',
    ruleOperator: '>',
    ruleValue: 100,
    ruleMessage: 'Custom rule triggered',
  };
}

function buildCustomRule(draft, itemId) {
  if (!draft.ruleEnabled) return [];
  const variableMap = {
    pax: 'item.pax',
    cantidad: 'item.cantidad',
    duracion: 'item.duracion',
  };
  const operator = ['>', '<', '>=', '<=', '===', '!=='].includes(draft.ruleOperator)
    ? draft.ruleOperator
    : '>';
  const field = variableMap[draft.ruleField] || 'item.cantidad';
  return [{
    ID_Regla: makeId('R_CUSTOM'),
    Nombre: `Custom rule for ${draft.name || 'item'}`,
    Etapa: 'RESTRICCION_UI',
    Scope: 'ITEM',
    ID_Componente: itemId,
    Tipo_Accion: draft.ruleType === 'ERROR' ? 'ERROR' : 'WARNING',
    Hook: null,
    Condicion_JSON: {
      [operator]: [{ var: field }, toNumberValue(draft.ruleValue, 0)],
    },
    Payload_JSON: {
      message: String(draft.ruleMessage || 'Custom rule triggered'),
    },
    Prioridad: 10,
    Acumulable: false,
    Activo: true,
  }];
}

function buildCustomResolvedDefinition(draft) {
  const token = sanitizeId(draft.name);
  const itemId = `ITEM_CUSTOM_${token}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const categoriaId = `CAT_CUSTOM_${token}`;
  const perfilId = `PP_CUSTOM_${token}`;
  const perfilInitId = `PI_CUSTOM_${token}`;

  return {
    ID_Item: itemId,
    Nombre: String(draft.name || 'Custom Item'),
    Default_Glosa: String(draft.description || ''),
    ID_Categoria: categoriaId,
    ID_Perfil_Precio_Override: perfilId,
    ID_Perfil_Init_Override: perfilInitId,
    Activo: true,
    categoria: {
      ID_Categoria: categoriaId,
      Nombre: String(draft.category || 'Custom Category'),
      ID_Perfil_Precio_Default: perfilId,
      ID_Perfil_Init_Default: perfilInitId,
      Def_Requiere_Pax: !!draft.requierePax,
      Def_Requiere_Cant: !!draft.requiereCant,
      Def_Requiere_Tiempo: !!draft.requiereTiempo,
      Def_Requiere_Hora: !!draft.requiereHora,
      Icono_UI: null,
      Activo: true,
    },
    perfil: {
      ID_Perfil_Precio: perfilId,
      Nombre: `Custom pricing ${draft.name || 'Item'}`,
      Costo_Base_Fijo: toNumberValue(draft.baseFijo, 0),
      Costo_Unitario_Pax: toNumberValue(draft.porPersona, 0),
      Costo_Unitario_Tiempo: toNumberValue(draft.porMinuto, 0),
      Costo_Unitario_Item: toNumberValue(draft.porUnidad, 0),
      Activo: true,
    },
    perfilInit: {
      ID_Perfil_Init: perfilInitId,
      Nombre: `Custom init ${draft.name || 'Item'}`,
      Duracion_Min: toNumberValue(draft.duracionMin, 0),
      Unidades_Por_Pax: toNumberValue(draft.unidadesPorUsuario, 0),
      Unidades_Por_Hora: toNumberValue(draft.unidadesPorHora, 0),
      Minutos_Por_Usuario: toNumberValue(draft.minutosPorUsuario, 0),
      Cantidad_Fija: toNumberValue(draft.cantidad, 0),
      Pax_Fijo: toNumberValue(draft.pax, 0),
      Activo: true,
    },
    reglas: buildCustomRule(draft, itemId),
  };
}

function cleanupSubscription(sub) {
  if (!sub) return;
  if (typeof sub === 'function') {
    sub();
    return;
  }
  if (typeof sub.unsubscribe === 'function') {
    sub.unsubscribe();
  }
}

function parseInputValue(value) {
  if (value === '') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

/**
 * Mount item playground with factory + global context + catalog + basket columns.
 * Shipping from factory creates 2 independent entities (catalog and basket).
 * @param {HTMLElement|null} root
 */
export async function mountItemPlayground(root) {
  if (!root) return;

  const dbSeed = await loadSeedFromCsvUrl(CSV_BASE_URL);
  const db = seedToResolverDb(dbSeed);

  const runtimeStore = {
    catalog: new Map(),
    basket: new Map(),
  };

  window.itemPlayground = function itemPlayground() {
    return {
      dbItemOptions: db.items
        .filter(item => item.Activo !== false)
        .map(item => ({ id: item.ID_Item, name: item.Nombre })),
      selectedDbItemId: db.items.find(item => item.Activo !== false)?.ID_Item || null,
      factoryEntries: [],
      catalogEntries: [],
      basketEntries: [],
      globalContext: {
        paxGlobal: 20,
        hora: '09:00',
        duracionMin: 120,
        dia: 1,
      },
      showCustomModal: false,
      customDraft: baseCustomDraft(),

      init() {
        if (!this.selectedDbItemId && this.dbItemOptions.length > 0) {
          this.selectedDbItemId = this.dbItemOptions[0].id;
        }
      },

      destroy() {
        this.catalogEntries.forEach(entry => this.destroyRuntimeEntry('catalog', entry.id));
        this.basketEntries.forEach(entry => this.destroyRuntimeEntry('basket', entry.id));
      },

      openCustomModal() {
        this.showCustomModal = true;
      },

      closeCustomModal() {
        this.showCustomModal = false;
        this.customDraft = baseCustomDraft();
      },

      addDbToFactory() {
        if (!this.selectedDbItemId) return;
        const resolvedDef = resolveItemDefinition(this.selectedDbItemId, db);
        const entry = {
          id: makeId('FACTORY'),
          source: 'db',
          label: resolvedDef.Nombre,
          resolvedDef,
        };
        this.factoryEntries = [...this.factoryEntries, entry];
      },

      addCustomToFactory() {
        const resolvedDef = buildCustomResolvedDefinition(this.customDraft);
        const entry = {
          id: makeId('FACTORY'),
          source: 'custom',
          label: resolvedDef.Nombre,
          resolvedDef,
        };
        this.factoryEntries = [...this.factoryEntries, entry];
        this.closeCustomModal();
      },

      removeFactoryEntry(factoryId) {
        this.factoryEntries = this.factoryEntries.filter(entry => entry.id !== factoryId);
      },

      shipFactoryEntry(factoryId) {
        const entry = this.factoryEntries.find(item => item.id === factoryId);
        if (!entry) return;
        this.createRuntimeEntry('catalog', entry.resolvedDef, 'catalog', factoryId);
        this.createRuntimeEntry('basket', entry.resolvedDef, 'basket', factoryId);
      },

      createRuntimeEntry(column, resolvedDef, mode, factoryId) {
        const entryId = makeId(column === 'catalog' ? 'CAT' : 'BSK');
        const seed = Item.fromDefinition(resolvedDef, {
          externalContext: { ...this.globalContext },
        }).toSeed();
        seed.mode = mode;

        const actor = createItemActor(seed);

        const initialEntry = {
          id: entryId,
          factoryId,
          sourceItemId: resolvedDef.ID_Item,
          name: resolvedDef.Nombre,
          state: actor.getSnapshot().context,
        };

        const key = column === 'catalog' ? 'catalogEntries' : 'basketEntries';
        this[key] = [...this[key], initialEntry];

        const subscription = actor.subscribe(snapshot => {
          const listKey = column === 'catalog' ? 'catalogEntries' : 'basketEntries';
          this[listKey] = this[listKey].map(entry => (
            entry.id === entryId
              ? { ...entry, state: snapshot.context }
              : entry
          ));
        });

        runtimeStore[column].set(entryId, { actor, subscription });
      },

      destroyRuntimeEntry(column, entryId) {
        const runtime = runtimeStore[column].get(entryId);
        if (runtime) {
          cleanupSubscription(runtime.subscription);
          runtime.actor?.stop?.();
          runtimeStore[column].delete(entryId);
        }

        const key = column === 'catalog' ? 'catalogEntries' : 'basketEntries';
        this[key] = this[key].filter(entry => entry.id !== entryId);
      },

      broadcastContext() {
        const patch = { ...this.globalContext };
        this.catalogEntries.forEach(entry => {
          runtimeStore.catalog.get(entry.id)?.actor.send({ type: 'SET_CONTEXT', patch });
        });
        this.basketEntries.forEach(entry => {
          runtimeStore.basket.get(entry.id)?.actor.send({ type: 'SET_CONTEXT', patch });
        });
      },

      setGlobalField(key, value) {
        if (key === 'hora') {
          this.globalContext = { ...this.globalContext, hora: value || '09:00' };
        } else {
          this.globalContext = { ...this.globalContext, [key]: toNumberValue(value, 0) };
        }
        this.broadcastContext();
      },

      setBasketOverride(entryId, key, value) {
        const actor = runtimeStore.basket.get(entryId)?.actor;
        if (!actor) return;
        if (value === '') {
          actor.send({ type: 'CLEAR_OVERRIDE', key });
          return;
        }
        actor.send({ type: 'SET_OVERRIDE', key, value: parseInputValue(value) });
      },

      clearBasketOverride(entryId, key) {
        const actor = runtimeStore.basket.get(entryId)?.actor;
        if (!actor) return;
        actor.send({ type: 'CLEAR_OVERRIDE', key });
      },

      resetBasketOverrides(entryId) {
        const actor = runtimeStore.basket.get(entryId)?.actor;
        if (!actor) return;
        actor.send({ type: 'RESET_OVERRIDES' });
      },

      ruleClass(state) {
        if ((state?.ruleErrors || []).length > 0) return 'error';
        if ((state?.ruleWarnings || []).length > 0) return 'warn';
        return 'ok';
      },

      ruleLabel(state) {
        const errors = (state?.ruleErrors || []).length;
        const warns = (state?.ruleWarnings || []).length;
        if (errors > 0) return `${errors} error`;
        if (warns > 0) return `${warns} warning`;
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

  root.innerHTML = `
    <section x-data="itemPlayground()" x-init="init()" class="playground-root">
      <div class="playground-grid">
        <aside class="panel panel-factory">
          <h3>Item Factory</h3>
          <div class="field">
            <label>DB item</label>
            <select x-model="selectedDbItemId">
              <template x-for="opt in dbItemOptions" :key="opt.id">
                <option :value="opt.id" x-text="opt.name"></option>
              </template>
            </select>
          </div>
          <div class="row-actions">
            <button class="btn-small btn-primary" @click="addDbToFactory()"><i class="fa-solid fa-database"></i> Add DB item</button>
            <button class="btn-small btn-secondary" @click="openCustomModal()"><i class="fa-solid fa-wand-magic-sparkles"></i> New custom</button>
          </div>

          <div class="factory-list">
            <template x-if="factoryEntries.length === 0">
              <p class="empty">Factory is empty</p>
            </template>
            <template x-for="entry in factoryEntries" :key="entry.id">
              <article class="factory-card">
                <div class="factory-head">
                  <strong x-text="entry.label"></strong>
                  <span class="source-chip" x-text="entry.source"></span>
                </div>
                <p class="muted" x-text="entry.resolvedDef.ID_Item"></p>
                <div class="row-actions">
                  <button class="btn-small btn-primary" @click="shipFactoryEntry(entry.id)"><i class="fa-solid fa-box-open"></i> Ship</button>
                  <button class="btn-small btn-secondary" @click="removeFactoryEntry(entry.id)"><i class="fa-solid fa-trash"></i> Remove</button>
                </div>
              </article>
            </template>
          </div>
        </aside>

        <aside class="panel panel-context">
          <h3>Global Context</h3>
          <div class="field">
            <label>PAX global</label>
            <input type="number" :value="globalContext.paxGlobal" @input="setGlobalField('paxGlobal', $event.target.value)" min="0">
          </div>
          <div class="field">
            <label>Hora</label>
            <input type="time" :value="globalContext.hora" @input="setGlobalField('hora', $event.target.value)">
          </div>
          <div class="field">
            <label>Duracion (min)</label>
            <input type="number" :value="globalContext.duracionMin" @input="setGlobalField('duracionMin', $event.target.value)" min="0" step="15">
          </div>
          <div class="field">
            <label>Dia</label>
            <input type="number" :value="globalContext.dia" @input="setGlobalField('dia', $event.target.value)" min="1">
          </div>
          <p class="hint">Broadcasts <code>SET_CONTEXT</code> to every catalog and basket entity.</p>
        </aside>

        <section class="panel panel-runtime panel-catalog">
          <h3>Catalog</h3>
          ${catalogRuntimeHtml}
        </section>

        <section class="panel panel-runtime panel-basket">
          <h3>Basket</h3>
          ${basketRuntimeHtml}
        </section>
      </div>

      <div class="modal-overlay" x-show="showCustomModal" x-cloak style="display:none;" @click.self="closeCustomModal()">
        <div class="modal">
          <h3>Create Custom Item</h3>

          <div class="field-grid two-col">
            <div class="field"><label>Name</label><input type="text" x-model="customDraft.name"></div>
            <div class="field"><label>Category</label><input type="text" x-model="customDraft.category"></div>
            <div class="field two-col"><label>Description</label><textarea rows="2" x-model="customDraft.description"></textarea></div>
          </div>

          <h4>Pricing Profile</h4>
          <div class="field-grid two-col">
            <div class="field"><label>Base fijo</label><input type="number" x-model="customDraft.baseFijo"></div>
            <div class="field"><label>Por pax</label><input type="number" x-model="customDraft.porPersona"></div>
            <div class="field"><label>Por unidad</label><input type="number" x-model="customDraft.porUnidad"></div>
            <div class="field"><label>Por minuto</label><input type="number" x-model="customDraft.porMinuto"></div>
          </div>

          <h4>Initialization Profile</h4>
          <div class="field-grid two-col">
            <div class="field"><label>Duracion min</label><input type="number" x-model="customDraft.duracionMin"></div>
            <div class="field"><label>Unidades por pax</label><input type="number" x-model="customDraft.unidadesPorUsuario"></div>
            <div class="field"><label>Unidades por hora</label><input type="number" x-model="customDraft.unidadesPorHora"></div>
            <div class="field"><label>Minutos por usuario</label><input type="number" x-model="customDraft.minutosPorUsuario"></div>
            <div class="field"><label>Cantidad fija</label><input type="number" x-model="customDraft.cantidad"></div>
            <div class="field"><label>Pax fijo</label><input type="number" x-model="customDraft.pax"></div>
          </div>

          <h4>Visibility Flags</h4>
          <div class="checkbox-row">
            <label><input type="checkbox" x-model="customDraft.requierePax"> Requiere Pax</label>
            <label><input type="checkbox" x-model="customDraft.requiereCant"> Requiere Cantidad</label>
            <label><input type="checkbox" x-model="customDraft.requiereTiempo"> Requiere Tiempo</label>
            <label><input type="checkbox" x-model="customDraft.requiereHora"> Requiere Hora</label>
          </div>

          <h4>Optional Rule</h4>
          <div class="checkbox-row">
            <label><input type="checkbox" x-model="customDraft.ruleEnabled"> Enable rule</label>
          </div>
          <div class="field-grid two-col" x-show="customDraft.ruleEnabled">
            <div class="field"><label>Type</label>
              <select x-model="customDraft.ruleType"><option>WARNING</option><option>ERROR</option></select>
            </div>
            <div class="field"><label>Field</label>
              <select x-model="customDraft.ruleField"><option value="cantidad">cantidad</option><option value="pax">pax</option><option value="duracion">duracion</option></select>
            </div>
            <div class="field"><label>Operator</label>
              <select x-model="customDraft.ruleOperator"><option>&gt;</option><option>&lt;</option><option>&gt;=</option><option>&lt;=</option><option>===</option><option>!==</option></select>
            </div>
            <div class="field"><label>Value</label><input type="number" x-model="customDraft.ruleValue"></div>
            <div class="field two-col"><label>Message</label><input type="text" x-model="customDraft.ruleMessage"></div>
          </div>

          <div class="row-actions">
            <button class="btn btn-primary" @click="addCustomToFactory()">Add to Factory</button>
            <button class="btn btn-ghost" @click="closeCustomModal()">Cancel</button>
          </div>
        </div>
      </div>

      <style>
        [x-cloak] { display: none !important; }
        .playground-root {
          --primary: #2d5a27;
          --primary-dark: #1a3d2b;
          --primary-light: #e8f2ec;
          --muted: #64748b;
          --border: #e2e8f0;
          width: 100%;
          min-height: calc(100vh - 70px);
          padding: 16px;
          background: #f1f5f9;
        }
        .playground-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 320px 280px minmax(340px, 1fr) minmax(420px, 1.2fr);
          gap: 14px;
          align-items: start;
        }
        .panel {
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .panel h3 {
          margin: 0 0 12px;
          font-size: .75rem;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #94a3b8;
          font-weight: 700;
        }
        .panel-runtime { max-height: calc(100vh - 120px); overflow: auto; position: relative; }
        .panel-catalog { overflow: visible; max-height: none; z-index: 5; }
        .panel-basket { z-index: 1; }
        .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .field label { font-size: .75rem; font-weight: 600; color: var(--muted); }
        .field input, .field select, .field textarea {
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 5px;
          font-size: .87rem;
          font-family: inherit;
          color: #1e293b;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(45,90,39,0.1);
        }
        .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-small {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: white;
          cursor: pointer;
          font: inherit;
          font-size: .82rem;
          font-weight: 600;
        }
        .btn-primary { background: var(--primary); border-color: var(--primary); color: white; }
        .btn-secondary { background: white; color: #475569; }
        .factory-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .factory-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px;
          background: #f8fafc;
        }
        .factory-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .source-chip {
          text-transform: uppercase;
          font-size: .65rem;
          padding: 2px 6px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #334155;
          font-weight: 700;
        }
        .muted, .hint { color: #64748b; font-size: .78rem; margin: 2px 0; }
        .entity-wrap { margin-bottom: 10px; position: relative; }
        .entity-wrap:hover { z-index: 20; }
        .mini-card {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: white;
          transition: all .2s;
        }
        .mini-main { flex: 1; min-width: 0; }
        .catalog-card { position: relative; overflow: visible; z-index: 1; }
        .catalog-card:hover { z-index: 25; }
        .mini-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(45,90,39,.12);
          transform: translateY(-1px);
        }
        .category-badge {
          display: inline-block;
          background: var(--primary-light);
          color: var(--primary);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: .72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 6px;
        }
        .mini-card h5 { margin: 0; font-size: 1.02rem; color: #1e293b; }
        .catalog-formula { margin: 6px 0 0; color: #334155; font-size: .88rem; }
        .glosa-popover {
          position: absolute;
          left: 12px;
          right: 12px;
          top: calc(100% + 6px);
          z-index: 27;
          background: #0f172a;
          color: #e2e8f0;
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: .78rem;
          line-height: 1.35;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
        }
        .card-actions { display: flex; align-items: flex-start; gap: 10px; margin-left: 12px; flex-shrink: 0; }
        .rules-indicator { position: relative; z-index: 26; }
        .rules-dot {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: .72rem;
          font-weight: 700;
          border: 1px solid transparent;
        }
        .dot-ok { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
        .dot-warn { background: #fef9c3; color: #854d0e; border-color: #fde047; }
        .dot-error { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .rules-popover {
          position: absolute;
          top: 30px;
          left: 0;
          z-index: 30;
          width: 250px;
          max-height: 280px;
          overflow-y: auto;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
          overflow-x: hidden;
        }
        .rules-popover-right { left: auto; right: 0; }
        .popover-header {
          font-size: .7rem;
          text-transform: uppercase;
          letter-spacing: .06em;
          font-weight: 700;
          color: #94a3b8;
          background: #f8fafc;
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .popover-empty {
          font-size: .76rem;
          color: #94a3b8;
          padding: 10px;
        }
        .popover-rule-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: .78rem;
          color: #334155;
          padding: 8px 10px;
          border-top: 1px solid #f1f5f9;
        }
        .popover-rule-row.row-error { background: #fef2f2; color: #991b1b; }
        .popover-rule-row.row-warn { background: #fffbeb; color: #92400e; }
        .popover-rule-row i { width: 12px; text-align: center; }
        .popover-rule-row span { flex: 1; min-width: 0; }
        .acc-total-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 11px;
          background: var(--primary-light);
          color: var(--primary-dark);
          border-radius: 20px;
          font-size: .78rem;
          font-weight: 700;
        }
        .accordion-item {
          background: white;
          border: 1px solid var(--border);
          border-left: 3px solid var(--primary);
          border-radius: 0 8px 8px 0;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .accordion-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          cursor: pointer;
          background: white;
        }
        .accordion-header:hover { background: #fafafa; }
        .acc-time { flex-shrink: 0; }
        .time-input-small {
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: .85rem;
          background: #f8fafc;
          color: #1e293b;
          width: 86px;
        }
        .acc-info { flex: 1; min-width: 0; }
        .acc-title { font-weight: 600; font-size: .9rem; color: #1e293b; }
        .acc-subtitle { font-size: .78rem; color: #64748b; margin-top: 2px; }
        .acc-toggle { color: #94a3b8; font-size: .8rem; }
        .accordion-body {
          border-top: 1px solid var(--border);
          background: #fafafa;
          padding: 12px;
        }
        .accordion-layout {
          display: grid;
          grid-template-columns: 200px minmax(180px, 1fr) 40px;
          gap: 12px;
        }
        .accordion-col-left { display: flex; flex-direction: column; gap: 8px; }
        .control-group label {
          font-size: .75rem;
          color: #475569;
          font-weight: 600;
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }
        .control-group input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 6px 8px;
          font-size: .85rem;
          background: white;
        }
        .field-user-set input { border-color: #f97316; background: #fff7ed; }
        .manual-badge {
          background: #f97316;
          color: white;
          font-size: .62rem;
          border-radius: 4px;
          padding: 1px 5px;
          text-transform: uppercase;
          font-weight: 700;
        }
        .line-price-box {
          margin-top: 6px;
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
        }
        .line-price-row {
          display: flex;
          justify-content: space-between;
          font-size: .8rem;
          color: #334155;
          margin-bottom: 4px;
        }
        .line-price-row.total-row {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
          font-weight: 700;
        }
        .line-price-row strong { color: #0f172a; }
        .accordion-col-middle textarea {
          width: 100%;
          resize: vertical;
          min-height: 92px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          font: inherit;
          font-size: .82rem;
          background: white;
        }
        .accordion-col-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        .icon-action {
          width: 30px;
          height: 30px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: white;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .icon-action.danger { color: #b91c1c; border-color: #fecaca; }
        .empty { color: #94a3b8; font-size: .82rem; margin: 4px 0; }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 80;
        }
        .modal {
          width: min(880px, 92vw);
          max-height: 92vh;
          overflow: auto;
          background: #fff;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 14px;
        }
        .modal h3, .modal h4 { margin: 6px 0 10px; color: #1e3a5f; }
        .checkbox-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
          font-size: .82rem;
          color: #475569;
        }
        @media (max-width: 1500px) {
          .playground-grid {
            grid-template-columns: 320px 280px 1fr;
            grid-template-areas:
              "factory context context"
              "catalog basket basket";
          }
          .panel-factory { grid-area: factory; }
          .panel-context { grid-area: context; }
          .panel-runtime:nth-of-type(1) { grid-area: catalog; }
          .panel-runtime:nth-of-type(2) { grid-area: basket; }
        }
        @media (max-width: 1120px) {
          .playground-grid { grid-template-columns: 1fr; grid-template-areas: none; }
          .accordion-layout { grid-template-columns: 1fr; }
          .accordion-col-actions { flex-direction: row; justify-content: flex-start; }
          .panel-runtime { max-height: none; }
        }
      </style>
    </section>
  `;

  if (window.Alpine?.initTree) window.Alpine.initTree(root);
}
