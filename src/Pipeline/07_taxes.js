import { getRulesForStage, evaluateCondition, executeAction } from './rules_engine.js';

export function calculateTaxes(ctx, store) {
  const subtotal = ctx.lineas.reduce((sum, l) => sum + (l._netoFinal ?? l._netoAjustado ?? l._netoBase ?? 0), 0);
  ctx.totals.subtotal = subtotal;
  ctx.totals.taxes = [];

  const rules = getRulesForStage('IMPUESTO', store);

  for (const rule of rules) {
    if (!evaluateCondition(rule.Condicion_JSON, ctx)) continue;

    const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { subtotal });
    ctx.totals.taxes.push({ name: result.name, rate: result.rate, amount: result.amount });
  }

  const totalTax = ctx.totals.taxes.reduce((sum, t) => sum + t.amount, 0);
  ctx.totals.total = subtotal + totalTax;

  return ctx;
}
