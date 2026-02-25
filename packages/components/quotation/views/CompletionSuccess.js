import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class CompletionSuccess extends ViewBase {
  constructor(message = 'Cotizacion guardada correctamente') {
    super();
    this._message = message;
  }

  restart() {
    this.emit('RESTART');
    return this;
  }

  openPdf() {
    this.emit('OPEN_PDF');
    return this;
  }

  toDisplayObject() {
    return {
      message: this._message
    };
  }
}

export function createCompletionSuccess(message) {
  return new CompletionSuccess(message);
}
