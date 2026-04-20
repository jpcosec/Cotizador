import { createItemActor } from '../../../src/components/item/machine/itemMachine.js';
import { Item } from '../../../src/components/item/Item.js';

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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInputValue(value) {
  if (value === '') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function cleanupSubscription(subscription) {
  if (typeof subscription === 'function') subscription();
  if (typeof subscription?.unsubscribe === 'function') subscription.unsubscribe();
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
  const variableMap = { pax: 'item.pax', cantidad: 'item.cantidad', duracion: 'item.duracion' };
  const operator = ['>', '<', '>=', '<=', '===', '!=='].includes(draft.ruleOperator)
    ? draft.ruleOperator
    : '>';
  return [{
    ID_Regla: makeId('R_CUSTOM'),
    Nombre: `Custom rule for ${draft.name || 'item'}`,
    Etapa: 'RESTRICCION_UI',
    Scope: 'ITEM',
    ID_Componente: itemId,
    Tipo_Accion: draft.ruleType === 'ERROR' ? 'ERROR' : 'WARNING',
    Hook: null,
    Condicion_JSON: { [operator]: [{ var: variableMap[draft.ruleField] || 'item.cantidad' }, toNumberValue(draft.ruleValue, 0)] },
    Payload_JSON: { message: String(draft.ruleMessage || 'Custom rule triggered') },
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

/** Controller for the item playground factory/catalog/basket flow. */
export class ItemPlaygroundController {
  constructor({ db, resolveItemDefinition }) {
    this.db = db;
    this.resolveItemDefinition = resolveItemDefinition;
    this.dbItemOptions = db.items
      .filter((item) => item.Activo !== false)
      .map((item) => ({ id: item.ID_Item, name: item.Nombre }));
    this.selectedDbItemId = this.dbItemOptions[0]?.id || null;
    this.factoryEntries = [];
    this.catalogEntries = [];
    this.basketEntries = [];
    this.globalContext = { paxGlobal: 20, hora: '09:00', duracionMin: 120, dia: 1 };
    this.showCustomModal = false;
    this.customDraft = baseCustomDraft();
    this.draggingCatalogItemId = null;
    this.runtimeStore = { catalog: new Map(), basket: new Map() };
  }

  init() {
    if (!this.selectedDbItemId && this.dbItemOptions.length > 0) this.selectedDbItemId = this.dbItemOptions[0].id;
  }

  destroy() {
    this.catalogEntries.forEach((entry) => this.destroyRuntimeEntry('catalog', entry.id));
    this.basketEntries.forEach((entry) => this.destroyRuntimeEntry('basket', entry.id));
  }

  openCustomModal() { this.showCustomModal = true; }

  closeCustomModal() {
    this.showCustomModal = false;
    this.customDraft = baseCustomDraft();
  }

  addDbToFactory() {
    if (!this.selectedDbItemId) return;
    const resolvedDef = this.resolveItemDefinition(this.selectedDbItemId, this.db);
    this.factoryEntries = [...this.factoryEntries, { id: makeId('FACTORY'), source: 'db', label: resolvedDef.Nombre, resolvedDef }];
  }

  addCustomToFactory() {
    const resolvedDef = buildCustomResolvedDefinition(this.customDraft);
    this.factoryEntries = [...this.factoryEntries, { id: makeId('FACTORY'), source: 'custom', label: resolvedDef.Nombre, resolvedDef }];
    this.closeCustomModal();
  }

  removeFactoryEntry(factoryId) {
    this.factoryEntries = this.factoryEntries.filter((entry) => entry.id !== factoryId);
  }

  shipFactoryEntry(factoryId) {
    const entry = this.factoryEntries.find((item) => item.id === factoryId);
    if (!entry) return;
    this.createRuntimeEntry('catalog', entry.resolvedDef, 'catalog', factoryId);
    this.createRuntimeEntry('basket', entry.resolvedDef, 'basket', factoryId);
  }

  shipCatalogEntry(entryId) {
    const entry = this.catalogEntries.find((item) => item.id === entryId);
    if (!entry?.state?.definition) return;
    this.createRuntimeEntry('basket', entry.state.definition, 'basket', entry.factoryId || entryId);
  }

  createRuntimeEntry(column, resolvedDef, mode, factoryId) {
    const entryId = makeId(column === 'catalog' ? 'CAT' : 'BSK');
    const seed = Item.fromDefinition(resolvedDef, { externalContext: { ...this.globalContext } }).toSeed();
    seed.mode = mode;
    const actor = createItemActor(seed);
    const key = column === 'catalog' ? 'catalogEntries' : 'basketEntries';
    const initialEntry = { id: entryId, factoryId, sourceItemId: resolvedDef.ID_Item, name: resolvedDef.Nombre, state: actor.getSnapshot().context };
    this[key] = [...this[key], initialEntry];
    const subscription = actor.subscribe((snapshot) => {
      this[key] = this[key].map((entry) => (entry.id === entryId ? { ...entry, state: snapshot.context } : entry));
    });
    this.runtimeStore[column].set(entryId, { actor, subscription });
  }

  destroyRuntimeEntry(column, entryId) {
    const runtime = this.runtimeStore[column].get(entryId);
    if (runtime) {
      cleanupSubscription(runtime.subscription);
      runtime.actor?.stop?.();
      this.runtimeStore[column].delete(entryId);
    }
    const key = column === 'catalog' ? 'catalogEntries' : 'basketEntries';
    this[key] = this[key].filter((entry) => entry.id !== entryId);
  }

  broadcastContext() {
    const patch = { ...this.globalContext };
    this.catalogEntries.forEach((entry) => this.runtimeStore.catalog.get(entry.id)?.actor.send({ type: 'SET_CONTEXT', patch }));
    this.basketEntries.forEach((entry) => this.runtimeStore.basket.get(entry.id)?.actor.send({ type: 'SET_CONTEXT', patch }));
  }

  setGlobalField(key, value) {
    this.globalContext = key === 'hora'
      ? { ...this.globalContext, hora: value || '09:00' }
      : { ...this.globalContext, [key]: toNumberValue(value, 0) };
    this.broadcastContext();
  }

  setBasketOverride(entryId, key, value) {
    const actor = this.runtimeStore.basket.get(entryId)?.actor;
    if (!actor) return;
    if (value === '') return actor.send({ type: 'CLEAR_OVERRIDE', key });
    actor.send({ type: 'SET_OVERRIDE', key, value: parseInputValue(value) });
  }

  resetBasketOverrides(entryId) {
    this.runtimeStore.basket.get(entryId)?.actor?.send({ type: 'RESET_OVERRIDES' });
  }

  setItemComment(entryId, value) { this.setBasketOverride(entryId, 'comentarios', value); }
  setItemTime(entryId, value) { this.setBasketOverride(entryId, 'hora', value); }
  setItemDuration(entryId, value) { this.setBasketOverride(entryId, 'duracionMin', value); }
  duplicateBasketEntry(entryId) { this.shipBasketDefinition(entryId); }
  copyBasketEntry(entryId) { this.shipBasketDefinition(entryId); }

  shipBasketDefinition(entryId) {
    const entry = this.basketEntries.find((item) => item.id === entryId);
    if (!entry?.state?.definition) return;
    this.createRuntimeEntry('basket', entry.state.definition, 'basket', entry.factoryId || entryId);
  }

  startCatalogDrag(entryId, event) {
    this.draggingCatalogItemId = entryId;
    if (event?.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  endCatalogDrag() { this.draggingCatalogItemId = null; }
  isDraggingCatalogItem(entryId) { return this.draggingCatalogItemId === entryId; }
  ruleClass(state) { return (state?.ruleErrors || []).length > 0 ? 'error' : (state?.ruleWarnings || []).length > 0 ? 'warn' : 'ok'; }
  ruleIcon(state) { return (state?.ruleErrors || []).length > 0 ? 'fa-xmark' : (state?.ruleWarnings || []).length > 0 ? 'fa-exclamation' : 'fa-check'; }
  formatMoney(value) { return Number(value || 0).toLocaleString('es-CL'); }
}

export function createItemPlayground(options) {
  return new ItemPlaygroundController(options);
}
