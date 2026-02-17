import { getRulesForStage, evaluateCondition, executeAction } from './rules_engine.js';

export function applyAdjustments(ctx, store) {
  applyLineAdjustments(ctx, store);
  applyGlobalAdjustments(ctx, store);
  return ctx;
}

function applyLineAdjustments(ctx, store) {
  const rules = getRulesForStage('AJUSTE_LINEA', store);

  for (const linea of ctx.lineas) {
    linea._ajustes = [];
    linea._netoAjustado = linea._netoBase;

    for (const rule of rules) {
      if (!evaluateCondition(rule.Condicion_JSON, linea)) continue;

      const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { neto: linea._netoAjustado });
      linea._ajustes.push({ ruleId: rule.ID_Regla, ...result });
      linea._netoAjustado += result.delta;

      if (!rule.Acumulable) break;
    }
  }
}

function applyGlobalAdjustments(ctx, store) {
  const rules = getRulesForStage('AJUSTE_GLOBAL', store);

  for (const rule of rules) {
    if (!evaluateCondition(rule.Condicion_JSON, ctx)) continue;

    const subtotal = ctx.lineas.reduce((s, l) => s + l._netoAjustado, 0);
    const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { neto: subtotal });
    ctx.messages.push({ stage: 'AJUSTE_GLOBAL', ruleId: rule.ID_Regla, ...result });
  }
}
