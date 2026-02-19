function cloneValue(value) {
  if (value === null || value === undefined) return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function statePath(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return 'unknown';

  const out = [];
  function walk(node, prefix) {
    if (typeof node === 'string') {
      out.push(prefix ? `${prefix}.${node}` : node);
      return;
    }
    Object.entries(node).forEach(([key, child]) => {
      const next = prefix ? `${prefix}.${key}` : key;
      walk(child, next);
    });
  }

  walk(value, '');
  return out.join(' | ');
}

export class AlpineXStateBridge {
  constructor(actor, alpineStore = {}, opts = {}) {
    if (!actor || typeof actor.getSnapshot !== 'function') {
      throw new Error('AlpineXStateBridge requires an actor with getSnapshot().');
    }

    this.actor = actor;
    this.alpineStore = alpineStore;
    this.opts = {
      autoStart: false,
      syncLineasAsCarrito: true,
      ...opts,
    };
    this.snapshot = actor.getSnapshot();
    this.unsubscribe = null;

    this.syncToAlpine();
  }

  start() {
    if (this.unsubscribe) return this;

    if (this.opts.autoStart && typeof this.actor.start === 'function') {
      this.actor.start();
    }

    const sub = this.actor.subscribe((snapshot) => {
      this.snapshot = snapshot;
      this.syncToAlpine();
    });

    this.unsubscribe = () => {
      if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
    };
    return this;
  }

  stop() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  }

  canSend(type) {
    if (!type) return false;
    if (this.snapshot && typeof this.snapshot.can === 'function') {
      return this.snapshot.can({ type });
    }
    return true;
  }

  send(type, payload = {}) {
    if (!this.canSend(type)) return false;
    this.actor.send({ type, ...payload });
    return true;
  }

  loadQuotation(cotizacionId) {
    if (!cotizacionId) return false;
    return this.send('LOAD_QUOTATION', { cotizacionId });
  }

  syncToAlpine() {
    const context = (this.snapshot && this.snapshot.context) || {};

    this.alpineStore.machineState = statePath(this.snapshot && this.snapshot.value);
    this.alpineStore.quotation = cloneValue(context.quotation || null);
    this.alpineStore.totalsSnapshot = cloneValue(context.totals || { subtotal: 0, taxes: [], total: 0 });
    this.alpineStore.messages = cloneValue(context.messages || []);
    this.alpineStore.errors = cloneValue(context.errors || []);
    this.alpineStore.previousQuotations = cloneValue(context.previousQuotations || []);
    this.alpineStore.databaseOpen = Boolean(context.databaseOpen);
    this.alpineStore.selectedRowData = cloneValue(context.selectedRowData || null);

    if (context.quotation && typeof context.quotation.paxGlobal === 'number') {
      this.alpineStore.paxGlobal = context.quotation.paxGlobal;
    }

    if (Array.isArray(context.catalogo)) {
      this.alpineStore.catalogo = cloneValue(context.catalogo);
    }

    if (this.opts.syncLineasAsCarrito) {
      this.alpineStore.carrito = this.mapLineasToCarrito(context.lineas || [], context.quotation);
    }
  }

  mapLineasToCarrito(lineas, quotation) {
    const fechaEvento = quotation && quotation.cotizacion ? quotation.cotizacion.Fecha_Evento : null;
    const paxDefault = quotation && typeof quotation.paxGlobal === 'number' ? quotation.paxGlobal : 1;

    return (lineas || [])
      .filter((linea) => !linea._removed)
      .map((linea, idx) => {
        const cantidad = linea.Override_Cantidad || linea.Override_Pax || linea._cantidad || linea._pax || paxDefault || 1;
        const total = linea._netoAjustado || linea._netoBase || 0;
        const precio = cantidad > 0 ? Math.round(total / cantidad) : total;

        return {
          id: linea.ID_Linea || linea.id || `LINA_${idx + 1}`,
          nombre: (linea._item && linea._item.Nombre_Item) || linea.Nombre_Item || linea.ID_Item || 'Item',
          categoria: (linea._item && linea._item.Categoria) || linea.Categoria || 'General',
          precio,
          cantidad,
          dia: linea.Dia || linea._dia || 1,
          fecha: linea.Fecha || linea._fecha || fechaEvento || '',
          hora: linea.Hora || linea._hora || '09:00',
          comentarios: linea.Comentarios || (linea._item && linea._item.Default_Glosa) || '',
          Comentarios: linea.Comentarios || (linea._item && linea._item.Default_Glosa) || '',
          total,
          lineId: linea.ID_Linea || linea.id || null,
          _raw: linea,
        };
      });
  }
}

if (typeof window !== 'undefined') {
  window.AlpineXStateBridge = AlpineXStateBridge;
}
