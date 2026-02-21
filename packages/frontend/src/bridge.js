/**
 * AlpineXStateBridge - Standalone module for state machine ↔ Alpine.js sync
 * Extracted from Bridge_AlpineXState.html for testability
 */

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  try { return structuredClone(value); } catch (e) { return JSON.parse(JSON.stringify(value)); }
}

function statePath(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return 'unknown';

  var out = [];
  function walk(node, prefix) {
    if (typeof node === 'string') {
      out.push(prefix ? prefix + '.' + node : node);
      return;
    }
    Object.keys(node).forEach(function(key) {
      var next = prefix ? prefix + '.' + key : key;
      walk(node[key], next);
    });
  }
  walk(value, '');
  return out.join(' | ');
}

export function AlpineXStateBridge(actor, alpineStore, opts) {
  if (!actor || typeof actor.getSnapshot !== 'function') {
    throw new Error('AlpineXStateBridge requires an actor with getSnapshot().');
  }

  this.actor = actor;
  this.alpineStore = alpineStore || {};
  this.opts = Object.assign({
    autoStart: false,
    syncLineasAsCarrito: true
  }, opts || {});
  this.snapshot = actor.getSnapshot();
  this.unsubscribe = null;
  this.syncToAlpine();
}

AlpineXStateBridge.prototype.start = function() {
  if (this.unsubscribe) return this;
  if (this.opts.autoStart && typeof this.actor.start === 'function') this.actor.start();

  var self = this;
  var sub = this.actor.subscribe(function(snapshot) {
    self.snapshot = snapshot;
    self.syncToAlpine();
  });
  this.unsubscribe = function() {
    if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
  };
  return this;
};

AlpineXStateBridge.prototype.stop = function() {
  if (this.unsubscribe) this.unsubscribe();
  this.unsubscribe = null;
};

AlpineXStateBridge.prototype.canSend = function(type) {
  if (!type) return false;
  if (this.snapshot && typeof this.snapshot.can === 'function') {
    return this.snapshot.can({ type: type });
  }
  return true;
};

AlpineXStateBridge.prototype.send = function(type, payload) {
  if (!this.canSend(type)) return false;
  var data = Object.assign({ type: type }, payload || {});
  this.actor.send(data);
  return true;
};

AlpineXStateBridge.prototype.syncToAlpine = function() {
  var context = (this.snapshot && this.snapshot.context) || {};
  this.alpineStore.machineState = statePath(this.snapshot && this.snapshot.value);
  this.alpineStore.quotation = cloneValue(context.quotation || null);
  this.alpineStore.totalsSnapshot = cloneValue(context.totals || { subtotal: 0, taxes: [], total: 0 });
  this.alpineStore.messages = cloneValue(context.messages || []);
  this.alpineStore.errors = cloneValue(context.errors || []);
  this.alpineStore.previousQuotations = cloneValue(context.previousQuotations || []);
  this.alpineStore.databaseOpen = !!context.databaseOpen;
  this.alpineStore.selectedRowData = cloneValue(context.selectedRowData || null);

  if (context.quotation && typeof context.quotation.paxGlobal === 'number') {
    this.alpineStore.paxGlobal = context.quotation.paxGlobal;
  }
  if (Array.isArray(context.catalogo)) {
    this.alpineStore.catalogo = cloneValue(context.catalogo);
  }
  if (this.opts.syncLineasAsCarrito) {
    if (context.basket && typeof context.basket.toDisplayObject === 'function') {
      const displayObj = context.basket.toDisplayObject();
      this.alpineStore.carrito = this.mapDaysToCarrito(displayObj.days || []);
      this.alpineStore.totalsSnapshot = cloneValue(displayObj.totals || context.totals);
    } else {
      this.alpineStore.carrito = this.mapLineasToCarrito(context.lineas || [], context.quotation);
    }
  }
};

AlpineXStateBridge.prototype.mapLineasToCarrito = function(lineas, quotation) {
  var fechaEvento = quotation && quotation.cotizacion ? quotation.cotizacion.Fecha_Evento : null;
  var paxDefault = quotation && typeof quotation.paxGlobal === 'number' ? quotation.paxGlobal : 1;

  return (lineas || []).filter(function(linea) {
    return !linea._removed;
  }).map(function(linea, idx) {
    var cantidad = linea.Override_Cantidad || linea.Override_Pax || linea._cantidad || linea._pax || paxDefault || 1;
    var total = linea._netoAjustado || linea._netoBase || 0;
    var precio = cantidad > 0 ? Math.round(total / cantidad) : total;

    return {
      id: linea.ID_Linea || linea.id || ('LINA_' + (idx + 1)),
      nombre: (linea._item && (linea._item.Nombre_Item || linea._item.Nombre)) || linea.Nombre_Item || linea.Nombre || linea.ID_Item || 'Item',
      categoria: (linea._item && linea._item.Categoria) || linea.Categoria || 'General',
      precio: precio,
      cantidad: cantidad,
      dia: linea.Dia || linea._dia || 1,
      fecha: linea.Fecha || linea._fecha || fechaEvento || '',
      hora: linea.Hora || linea._hora || '09:00',
      comentarios: linea.Comentarios || (linea._item && linea._item.Default_Glosa) || '',
      Comentarios: linea.Comentarios || (linea._item && linea._item.Default_Glosa) || '',
      total: total,
      lineId: linea.ID_Linea || linea.id || null,
      _raw: linea
    };
  });
};

AlpineXStateBridge.prototype.mapDaysToCarrito = function(days) {
  var carrito = [];
  (days || []).forEach(function(day) {
    (day.items || []).forEach(function(item) {
      carrito.push({
        id: item.id || item.lineId,
        lineId: item.lineId,
        itemId: item.itemId,
        nome: item.nombre,
        nombre: item.nombre,
        categoria: day.nombre || 'General',
        precio: item.precio || 0,
        cantidad: item.pax || 1,
        dia: day.dia,
        fecha: day.fecha,
        hora: item.hora || '09:00',
        comentarios: item.comentarios || '',
        Comentarios: item.comentarios || '',
        total: item.total || 0
      });
    });
  });
  return carrito;
};
