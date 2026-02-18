import { AlpineXStateBridge } from '../../claps_codelab_frontend/src/bridge/AlpineXStateBridge.js';
import { createCotizadorActor } from './createCotizadorActor.js';

export { AlpineXStateBridge, createCotizadorActor };

export const QuotationEngine = {
  AlpineXStateBridge,
  createCotizadorActor,
};

if (typeof window !== 'undefined') {
  window.QuotationEngine = QuotationEngine;
  if (typeof window.createCotizadorActor !== 'function') {
    window.createCotizadorActor = createCotizadorActor;
  }
}
