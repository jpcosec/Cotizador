import { createItemActor } from '../machine/itemMachine.js';
import { Item } from '../Item.js';
import { loadSeedFromCsvUrl } from '../../../../packages/database/src/csvSeed.browser.js';
import { resolveItemDefinition } from '../../../../packages/database/src/resolveItemDefinition.js';

const CSV_BASE_URL = '/data/init';

const PROFILE_KEY_MAP = {
  Costo_Base_Fijo: 'baseFijo',
  Costo_Unitario_Pax: 'porPersona',
  Costo_Unitario_Tiempo: 'porMinuto',
  Costo_Unitario_Item: 'porUnidad',
};

const INIT_KEY_MAP = {
  Duracion_Min: 'duracionMin',
  Unidades_Por_Pax: 'unidadesPorUsuario',
  Unidades_Por_Hora: 'unidadesPorHora',
  Minutos_Por_Usuario: 'minutosPorUsuario',
  Cantidad_Fija: 'cantidad',
  Pax_Fijo: 'pax',
};

function parseInputValue(value) {
  if (value === '') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

export async function mountItemStandalone(root) {
  if (!root) return;

  const [itemDisplayHtml, resolverPanelHtml, dbSeed] = await Promise.all([
    fetch('/packages/components/item/ui/ItemDisplay.html').then(r => r.text()),
    fetch('/packages/components/item/ui/ResolverPanel.html').then(r => r.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const seedMap = Object.fromEntries(dbSeed.map(({ table, records }) => [table, records]));
  const db = {
    items: seedMap.ITEM_CATALOGO,
    categorias: seedMap.CATEGORIAS,
    perfiles: seedMap.PERFILES_PRECIO,
    perfilesInit: seedMap.PERFILES_INICIALIZACION ?? [],
    reglas: seedMap.REGLAS_NEGOCIO,
  };

  let actor = null;
  let unsubscribe = null;
  let currentResolvedDef = null;

  function buildItemOptions() {
    return db.items
      .filter(i => i.Activo !== false)
      .map(i => ({ id: i.ID_Item, name: i.Nombre }));
  }

  function restartActor(seed, component) {
    if (typeof unsubscribe === 'function') unsubscribe();
    actor?.stop?.();
    actor = createItemActor(seed);
    unsubscribe = actor.subscribe(snap => {
      component.state = snap.context;
    });
    component.state = actor.getSnapshot().context;
  }

  function seedFromSnapshotWithDefinition(snapshot, definition) {
    return {
      mode: snapshot?.mode ?? 'catalog',
      definition,
      externalContext: { ...(snapshot?.externalContext || {}) },
      overrides: { ...(snapshot?.overrides || {}) },
      userSetFields: [...(snapshot?.userSetFields || [])],
    };
  }

  function loadItem(itemId, component) {
    currentResolvedDef = resolveItemDefinition(itemId, db);
    component.resolvedDef = currentResolvedDef;
    const seed = Item.fromDefinition(currentResolvedDef).toSeed();
    restartActor(seed, component);
  }

  function remountFromResolvedDef(component) {
    if (!currentResolvedDef) return;
    const snapshot = actor?.getSnapshot()?.context ?? {};
    const definition = Item.fromDefinition(currentResolvedDef).definition;
    const seed = seedFromSnapshotWithDefinition(snapshot, definition);
    restartActor(seed, component);
  }

  window.itemStandaloneComponent = function itemStandaloneComponent() {
    return {
      state: {},
      resolvedDef: null,
      selectedItemId: buildItemOptions()[0]?.id ?? null,
      itemOptions: buildItemOptions(),
      showStateDump: false,
      editing: {},

      init() {
        if (this.selectedItemId) loadItem(this.selectedItemId, this);
      },

      changeItem(itemId) {
        this.selectedItemId = itemId;
        this.editing = {};
        loadItem(itemId, this);
      },

      setContext(key, value) {
        actor.send({ type: 'SET_CONTEXT', patch: { [key]: parseInputValue(value) } });
      },

      addToBasket() { actor.send({ type: 'ADD_TO_BASKET' }); },
      removeFromBasket() { actor.send({ type: 'REMOVE_FROM_BASKET' }); },

      setOverride(key, value) {
        actor.send({ type: 'SET_OVERRIDE', key, value: parseInputValue(value) });
      },

      clearOverride(key) { actor.send({ type: 'CLEAR_OVERRIDE', key }); },
      resetOverrides() { actor.send({ type: 'RESET_OVERRIDES' }); },

      setProfileValue(key, value) {
        const n = Number(value);
        actor.send({ type: 'SET_PROFILE_VALUE', key, value: Number.isFinite(n) ? n : 0 });
      },

      setDefaultQuantity(key, value) {
        const n = Number(value);
        actor.send({ type: 'SET_DEFAULT_QUANTITY', key, value: Number.isFinite(n) ? n : 0 });
      },

      clearDefaultQuantity(key) {
        actor.send({ type: 'CLEAR_DEFAULT_QUANTITY', key });
      },

      setCategoriaFlag(key, checked) {
        if (!this.state?.definition) return;
        const nextDefinition = {
          ...this.state.definition,
          defaultQuantities: {
            ...(this.state.definition.defaultQuantities || {}),
            [key]: !!checked,
          },
        };
        const seed = seedFromSnapshotWithDefinition(this.state, nextDefinition);
        restartActor(seed, this);
        if (this.resolvedDef?.categoria) this.resolvedDef.categoria[key] = !!checked;
      },

      updateProfileField(key, value) {
        const mapped = PROFILE_KEY_MAP[key];
        if (!mapped) return;
        this.setProfileValue(mapped, value);
        if (this.resolvedDef?.perfil) this.resolvedDef.perfil[key] = parseInputValue(value);
      },

      updateInitField(key, value) {
        const mapped = INIT_KEY_MAP[key];
        if (!mapped) return;
        this.setDefaultQuantity(mapped, value);
        if (this.resolvedDef?.perfilInit) this.resolvedDef.perfilInit[key] = parseInputValue(value);
      },

      toggleRuleActive(index) {
        const rules = this.resolvedDef?.reglas || [];
        if (!rules[index]) return;
        rules[index].Activo = !rules[index].Activo;
        remountFromResolvedDef(this);
      },

      addRule() {
        if (!this.resolvedDef) return;
        const nextPriority = (this.resolvedDef.reglas || []).length * 10 + 10;
        const rule = {
          ID_Regla: `R-SBX-${Date.now()}`,
          Nombre: 'New sandbox rule',
          Etapa: 'RESTRICCION_UI',
          Scope: 'ITEM',
          ID_Componente: this.selectedItemId,
          Tipo_Accion: 'WARNING',
          Hook: null,
          Condicion_JSON: { '===': [{ var: 'item.id' }, this.selectedItemId] },
          Payload_JSON: { message: 'Sandbox rule' },
          Prioridad: nextPriority,
          Acumulable: false,
          Activo: true,
        };
        this.resolvedDef.reglas = [...(this.resolvedDef.reglas || []), rule];
        remountFromResolvedDef(this);
      },

      resolvedItemFields() {
        if (!this.resolvedDef) return {};
        const { categoria, perfil, perfilInit, reglas, ...rest } = this.resolvedDef;
        return rest;
      },

      formatResolverVal(v) {
        if (v === null || v === undefined) return 'null';
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      },

      isEditing(section, key) {
        return this.editing[`${section}.${key}`] === true;
      },

      startEditing(section, key) {
        this.editing[`${section}.${key}`] = true;
      },

      stopEditing(section, key) {
        this.editing[`${section}.${key}`] = false;
      },

      updateField(section, key, value) {
        if (section === 'PERFILES_PRECIO') this.updateProfileField(key, value);
        if (section === 'PERFILES_INICIALIZACION') this.updateInitField(key, value);
      },

      getDb() {
        return db;
      },
    };
  };

  const hasPanels = root.querySelector('#item-display') && root.querySelector('#resolver-panel');
  if (!hasPanels) {
    root.innerHTML = `
      <div class="sandbox-layout" style="display:grid;grid-template-columns:1fr 380px;gap:0;min-height:100vh;">
        <div id="item-display"></div>
        <div id="resolver-panel" style="border-left:1px solid #e2e8f0;overflow-y:auto;"></div>
      </div>
    `;
  }

  root.setAttribute('x-data', 'itemStandaloneComponent()');
  root.setAttribute('x-init', 'init()');
  const itemDisplayRoot = root.querySelector('#item-display');
  const resolverPanelRoot = root.querySelector('#resolver-panel');
  if (itemDisplayRoot) itemDisplayRoot.innerHTML = itemDisplayHtml;
  if (resolverPanelRoot) resolverPanelRoot.innerHTML = resolverPanelHtml;

  if (window.Alpine?.initTree) window.Alpine.initTree(root);
}
