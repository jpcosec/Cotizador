import { createItemActor } from '../machine/itemMachine.js';

function numberFromInput(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

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

      toLineItem(state) {
        const lineId = state.mode === 'basket' ? 'LIN_DEMO_001' : null;
        return {
          id: lineId || 'ITEM_DEMO',
          lineId,
          nombre: state.definition.name,
          descripcion: state.definition.description,
          categoria: state.definition.category,
          hora: state.schedule.hora,
          dia: state.schedule.dia,
          comentarios: state.comentarios || '',
          pax: state.quantities.pax,
          cantidad: state.quantities.cantidad,
          duracionMin: state.quantities.duracionMin,
          precio: state.unitDisplay,
          baseFijo: Number(state.lineBaseValue ?? 0),
          rateLabel: state.lineRateLabel,
          rateValue: Number(state.lineRateValue ?? 0),
          rateSubtotal: Number(state.lineRateSubtotal ?? 0),
          pricingKind: state.pricingKind,
          basketLegend: state.basketLegend,
          isOverridden: !!state.isOverridden,
          showPaxControl: !!state.showPaxControl,
          showUnitsControl: !!state.showUnitsControl,
          showTimeControl: !!state.showTimeControl,
          total: state.total,
          available: state.available
        };
      },

      toCatalogItem(state) {
        return {
          ID_Item: 'ITEM_DEMO',
          Nombre: state.definition.name,
          Precio_Base: state.catalogFormulaHuman,
          Precio_Calculado_Default: state.catalogFormulaHuman,
          CatalogFormulaHuman: state.catalogFormulaHuman,
          Precio_Por_Cantidad: state.pricingHuman,
          InitPolicyHuman: state.initPolicyHuman,
          detalle: `${state.definition.description}\n${state.catalogFormulaHuman}`,
          pricingHuman: state.pricingHuman,
          categoria: state.definition.category
        };
      },

      get catalogoPorCategoria() {
        const item = this.toCatalogItem(this.state);
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
        return [this.toLineItem(this.state)];
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
