import jsonLogic from 'json-logic-js';
import { getActionHandler } from './actions/index.js';
export { humanizeCondition, humanizePayload, humanizeRule } from './humanize.js';

// Self-register all actions on import
import './actions/multiply.js';
import './actions/add_fixed.js';
import './actions/set_value.js';
import './actions/set_tax.js';
import './actions/set_default.js';
import './actions/add_item.js';
import './actions/warning.js';
import './actions/error.js';
import './actions/invalidate_basket.js';

export function getRulesForStageAndHook(stage, hook, store) {
  return store
    .findAll('REGLAS_NEGOCIO', { Etapa: stage, Activo: true })
    .filter(r => !hook || !r.Hook || r.Hook === hook)
    .sort((a, b) => a.Prioridad - b.Prioridad);
}

export function evaluateCondition(logic, data) {
  // Parse logic if it's a JSON string
  const parsedLogic = typeof logic === 'string' ? JSON.parse(logic) : logic;
  return jsonLogic.apply(parsedLogic, data);
}

export function executeAction(tipoAccion, payload, target) {
  const handler = getActionHandler(tipoAccion);
  // Parse payload if it's a JSON string
  const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
  return handler(parsedPayload, target);
}
