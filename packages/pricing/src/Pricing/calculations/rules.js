import { getRulesForStageAndHook, evaluateCondition, executeAction } from '../../RulesEngine/RulesEngine.js';

export function applyLineAdjustments(lineas, store, hook = null) {
  const rules = getRulesForStageAndHook('AJUSTE_LINEA', hook, store);

  for (const linea of lineas) {
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

export function applyGlobalAdjustments(lineas, messages, store, hook = null) {
  const rules = getRulesForStageAndHook('AJUSTE_GLOBAL', hook, store);

  for (const rule of rules) {
    const subtotal = lineas.reduce((s, l) => s + l._netoAjustado, 0);
    const ctx = { subtotal, lineas };
    if (!evaluateCondition(rule.Condicion_JSON, ctx)) continue;

    const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, { neto: subtotal });
    messages.push({ stage: 'AJUSTE_GLOBAL', ruleId: rule.ID_Regla, ...result });
  }
}
