import { createItemActor } from '../machine/itemMachine.js';

/**
 * Parse a user input value into a finite number, or null if invalid/empty.
 * @param {string|number|null|undefined} value - Raw input value.
 * @returns {number|null}
 */
function numberFromInput(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Mount the standalone item component into a DOM element.
 * Creates an XState item actor and registers `itemStandaloneComponent` on `window`
 * for Alpine.js. The component exposes catalog/basket views, override controls,
 * and quantity/schedule editing methods.
 * @param {HTMLElement|null} root - Container element to mount into. No-op if null.
 */
export async function mountItemStandalone(root) {
  if (!root) return;

  const templatePath = '/packages/components/item/ui/ItemStandalone.html';
  const html = await fetch(templatePath).then((res) => res.text());
  const actor = createItemActor();

  window.itemStandaloneComponent = function itemStandaloneComponent() {
    return {
      state: actor.getSnapshot().context,
      lineVisible: true,
      cargando: false,
      busquedaCatalogo: '',
      lineUi: {
        expanded: true
      },
      lastAction: '',
      _subscription: null,

      get catalogoPorCategoria() {
        const item = this.state?.catalogCard || null;
        if (!item) return {};
        const category = item.categoria || 'Sin categoria';
        const query = String(this.busquedaCatalogo || '').trim().toLowerCase();

        const matches = !query
          || String(item.Nombre || '').toLowerCase().includes(query)
          || String(item.detalle || '').toLowerCase().includes(query)
          || String(category).toLowerCase().includes(query);

        if (!matches) return {};
        return { [category]: [item] };
      },

      get carritoFiltrado() {
        if (!this.lineVisible) return [];
        return this.state?.basketLine ? [this.state.basketLine] : [];
      },

      get carrito() {
        return this.carritoFiltrado;
      },

      init() {
        this._subscription = actor.subscribe((snapshot) => {
          this.state = snapshot.context;
        });
      },

      setMode(mode) {
        actor.send({ type: 'SET_MODE', mode });
        this.lineVisible = true;
      },

      agregarItem(_item) {
        this.setMode('basket');
        this.lineVisible = true;
        this.lastAction = 'Item agregado desde catalogo (simulacion)';
      },

      setExternalNumber(key, value) {
        const parsed = numberFromInput(value);
        actor.send({ type: 'SET_EXTERNAL_CONTEXT', externalContext: { [key]: parsed } });
      },

      setExternalText(key, value) {
        actor.send({ type: 'SET_EXTERNAL_CONTEXT', externalContext: { [key]: value } });
      },

      setProfileNumber(key, value) {
        const parsed = numberFromInput(value);
        actor.send({ type: 'SET_PROFILE_VALUE', key, value: parsed ?? 0 });
      },

      setDefaultQuantityNumber(key, value) {
        const parsed = numberFromInput(value);
        if (parsed == null) {
          actor.send({ type: 'CLEAR_DEFAULT_QUANTITY_VALUE', key });
          return;
        }
        actor.send({ type: 'SET_DEFAULT_QUANTITY_VALUE', key, value: parsed ?? 0 });
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

      getLinePax(item) {
        return Number(item?.pax ?? 0);
      },

      getLineUnits(item) {
        return Number(item?.cantidad ?? 0);
      },

      getLineDuration(item) {
        return Number(item?.duracionMin ?? 0);
      },

      actualizarCantidad(_idx, value) {
        this.setOverrideNumber('pax', value);
      },

      actualizarCantidadUnidades(_idx, value) {
        this.setOverrideNumber('cantidad', value);
      },

      actualizarDuracionLinea(_idx, value) {
        this.setOverrideNumber('duracionMin', value);
      },

      actualizarHora(_idx, value) {
        this.setOverrideText('hora', value);
      },

      actualizarComentario(_idx, value) {
        this.setOverrideText('comentarios', value);
      },

      eliminarItem(_idx) {
        this.lineVisible = false;
        this.lastAction = 'Item removido (simulacion standalone)';
      },

      copiarItemAlDiaSiguiente(_idx) {
        const currentDia = Number(this.state.schedule?.dia ?? 1);
        this.setOverrideNumber('dia', currentDia + 1);
        this.lastAction = `Item copiado a dia ${currentDia + 1} (simulado)`;
      },

      duplicarItemEnDia(_idx) {
        this.lastAction = `Duplicacion simulada en dia ${this.state.schedule?.dia ?? 1}`;
      },

      restaurarItem() {
        this.lineVisible = true;
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
