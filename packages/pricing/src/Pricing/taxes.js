import { getRulesForStageAndHook, evaluateCondition, executeAction } from '../RulesEngine/RulesEngine.js';

export function calculateTaxes(lineas, store, hook = null) {
  const subtotal = lineas.reduce(
    (sum, l) => sum + (l._netoFinal ?? l._netoAjustado ?? l._netoBase ?? 0), 0
  );

  const taxes = [];
  const rules = getRulesForStageAndHook('IMPUESTO', hook, store);

  for (const rule of rules) {
    if (!evaluateCondition(rule.Condicion_JSON, { subtotal, lineas })) continue;

    const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { subtotal });
    taxes.push({ name: result.name, rate: result.rate, amount: result.amount });
  }

  const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);

  return { subtotal, taxes, total: subtotal + totalTax };
}
