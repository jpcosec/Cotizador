import { createAppState } from '../components/quotation/modals/AppState.js';

/**
 * Legacy app-level entry point kept for test and import compatibility.
 * The state implementation now lives in `src/components/quotation/modals/AppState.js`.
 */
export function createAppStateMachine() {
  return createAppState();
}
