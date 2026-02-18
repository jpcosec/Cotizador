// Assembles guards, actions, and services into the adapter object
// expected by createQuotationXStateMachine().
//
// XState v5: fromPromise is available and services are wrapped as proper actors.
// XState v4: fromPromise is undefined and services remain plain async functions.
//
// Adapters are thin wrappers:
// - Guards: pure context/event predicates
// - Actions: assign() functions that call pricing module
// - Services: async functions for external operations (optional for now)

import * as xstate from 'xstate';
import { guards } from './guards.js';
import { actions } from './actions.js';
import { saveQuotationService, sendQuotationService } from './services.js';

// fromPromise only exists in XState v5
const { fromPromise } = xstate;

function wrapService(fn) {
  return fromPromise
    ? fromPromise(({ input }) => fn(input))
    : fn;
}

const actors = {
  saveQuotationService: wrapService(saveQuotationService),
  sendQuotationService: wrapService(sendQuotationService),
};

const services = {
  saveQuotationService: ctx => saveQuotationService(ctx),
  sendQuotationService: ctx => sendQuotationService(ctx),
};

export const quotationAdapters = { guards, actions, services, actors };
