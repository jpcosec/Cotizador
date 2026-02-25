import { createAppState } from '../../../packages/components/quotation/modals/AppState.js';

/**
 * Legacy app-level entry point kept for test and import compatibility.
 * The state implementation now lives in `packages/components/quotation/modals/AppState.js`.
 */
export function createAppStateMachine() {
  return createAppState();
}
