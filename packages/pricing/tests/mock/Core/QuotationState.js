let _lineSeq = 0;

export function resetLineSeq() { _lineSeq = 0; }

export class QuotationState {
  constructor({ paxGlobal, fechaEvento, duracionDias, clienteId, cotizacionId }) {
    this.cotizacion = {
      ID_Cotizacion: cotizacionId || `COT_${Date.now()}`,
      ID_Cliente: clienteId,
      Fecha_Evento: fechaEvento,
      Duracion_Dias: duracionDias,
      Pax_Global: paxGlobal,
      Estado: 'Borrador',
    };
    this.paxGlobal = paxGlobal;
    this.lineas = [];
    this.ajustesManuales = [];
    this.totals = { subtotal: 0, taxes: [], total: 0 };
  }

  nextLineId() {
    _lineSeq += 1;
    return `LIN_${_lineSeq}`;
  }

  findLineById(lineId) {
    return this.lineas.find(l => l.ID_Linea === lineId) || null;
  }

  addLine(line) {
    this.lineas.push(line);
  }

  removeLine(lineId) {
    this.lineas = this.lineas.filter(l => l.ID_Linea !== lineId);
  }

  removeLinesByParent(parentItemId) {
    this.lineas = this.lineas.filter(l => l._parentItem !== parentItemId);
  }

  stripComputed() {
    for (const linea of this.lineas) {
      for (const key of Object.keys(linea)) {
        if (key.startsWith('_')) delete linea[key];
      }
    }
  }
}
