import jsonLogic from 'json-logic-js';

export function getRulesForStage(stage, store) {
  return store
    .findAll('REGLAS_NEGOCIO', { Etapa: stage, Activo: true })
    .sort((a, b) => a.Prioridad - b.Prioridad);
}

export function evaluateCondition(logic, data) {
  return jsonLogic.apply(logic, data);
}

export function executeAction(tipoAccion, payload, target) {
  switch (tipoAccion) {
    case 'MULTIPLY': {
      const delta = target.neto * (payload.factor - 1);
      return { delta, description: `×${payload.factor}` };
    }
    case 'ADD_FIXED': {
      return { delta: payload.amount, description: `+${payload.amount}` };
    }
    case 'SET_TAX': {
      const amount = target.subtotal * payload.rate;
      return { delta: amount, description: `${payload.name} ${payload.rate * 100}%`, name: payload.name, rate: payload.rate, amount };
    }
    case 'SET_VALUE': {
      const delta = payload.value - target.neto;
      return { delta, description: `set to ${payload.value}` };
    }
    default:
      return { delta: 0, description: `unknown action: ${tipoAccion}` };
  }
}
