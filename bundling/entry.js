import { AlpineXStateBridge } from '../packages/frontend/src/Bridge/AlpineXStateBridge.js';
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
