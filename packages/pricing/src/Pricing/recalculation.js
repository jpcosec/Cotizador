// Pipeline recalculation primitives split from pipeline.js to avoid
// circular imports with operations modules.

import { expandCompositions } from './calculations/expand.js';
import { resolveDefaults } from './calculations/defaults.js';
import { calculateLinePrice } from './calculations/pricing.js';
import { applyLineAdjustments, applyGlobalAdjustments } from './calculations/rules.js';
import { applyManualAdjustments, getGlobalManualAdjustments } from './manual.js';
import { calculateTaxes } from './taxes.js';
import { getRulesForStageAndHook, evaluateCondition, executeAction } from '../RulesEngine/RulesEngine.js';

const DEFAULT_FIELD_TO_LINE_KEY = {
  cantidad: '_cantidad',
  pax: '_pax',
  duracionMin: '_duracionMin',
  _cantidad: '_cantidad',
  _pax: '_pax',
  _duracionMin: '_duracionMin',
};

function applyCantidadDefaultRules(linea, store) {
  const rules = getRulesForStageAndHook('CANTIDAD_DEFAULT', null, store);
  if (!rules.length) return;

  for (const rule of rules) {
    if (!evaluateCondition(rule.Condicion_JSON, { linea })) continue;

    const result = executeAction(rule.Tipo_Accion, rule.Payload_JSON, {
      cantidad: linea._cantidad,
      pax: linea._pax,
      duracionMin: linea._duracionMin,
      linea,
    });

    const targetField = DEFAULT_FIELD_TO_LINE_KEY[result?.field] || null;
    if (targetField && Number.isFinite(result.value)) {
      linea[targetField] = result.value;
      continue;
    }

    if (Number.isFinite(result?.cantidad)) linea._cantidad = result.cantidad;
    if (Number.isFinite(result?.pax)) linea._pax = result.pax;
    if (Number.isFinite(result?.duracionMin)) linea._duracionMin = result.duracionMin;
    if (result?.field == null && Number.isFinite(result?.value)) linea._cantidad = result.value;
  }
}

export function expandItemCompositions(linea, store) {
  return expandCompositions([linea], store);
}

export function resolveItemDefaults(linea, paxGlobal, store) {
  resolveDefaults(linea, paxGlobal, store);
  applyCantidadDefaultRules(linea, store);
}

export function recalculateItemPrice(linea, store) {
  calculateLinePrice(linea, store);
}

export function applyItemRules(linea, store) {
  const errors = [];

  const restriccionRules = getRulesForStageAndHook('RESTRICCION_UI', null, store);
  for (const rule of restriccionRules) {
    if (!evaluateCondition(rule.Condicion_JSON, { linea })) continue;
    if (rule.Tipo_Accion === 'ERROR') {
      errors.push({
        ruleId: rule.ID_Regla,
        message: rule.Mensaje || rule.ID_Regla,
        blocking: true,
      });
    }
  }

  applyLineAdjustments([linea], store);

  return {
    linea,
    errors,
    adjustments: linea._ajustes || [],
  };
}

export function aggregateBasketTotals(lineas, ajustesManuales, store) {
  const messages = [];

  applyGlobalAdjustments(lineas, messages, store);
  applyManualAdjustments(lineas, ajustesManuales);

  const totals = calculateTaxes(lineas, store);
  const globalManuals = getGlobalManualAdjustments(ajustesManuales);
  const globalDelta = globalManuals.reduce(
    (sum, a) =>
      a.Tipo_Ajuste === 'RECARGO' ? sum + a.Valor_Nuevo : sum - a.Valor_Nuevo,
    0
  );

  totals.subtotal += globalDelta;
  totals.total += globalDelta;

  return { totals, messages };
}

const STRUCTURAL_KEYS = new Set(['_source', '_parentItem', '_tipoPrecio', '_cantidadComp']);

function stripComputedFields(lineas) {
  return lineas.map(linea => {
    const clean = {};
    for (const [k, v] of Object.entries(linea)) {
      if (!k.startsWith('_') || STRUCTURAL_KEYS.has(k)) {
        clean[k] = v;
      }
    }
    return clean;
  });
}

export function fullRecalculateBasket(lineas, quotation, store) {
  const messages = [];
  const errors = [];
  const cleanedLineas = stripComputedFields(lineas);

  for (let i = 0; i < cleanedLineas.length; i++) {
    const linea = cleanedLineas[i];

    resolveItemDefaults(linea, quotation.paxGlobal, store);
    recalculateItemPrice(linea, store);

    const ruleResult = applyItemRules(linea, store);
    if (ruleResult.errors.length > 0) {
      errors.push(...ruleResult.errors);
    }
  }

  const { totals, messages: globalMessages } = aggregateBasketTotals(
    cleanedLineas,
    quotation.ajustesManuales,
    store
  );

  messages.push(...globalMessages);

  const basketValidationRules = getRulesForStageAndHook('RESTRICCION_UI', null, store);
  for (const rule of basketValidationRules) {
    if (!evaluateCondition(rule.Condicion_JSON, { lineas: cleanedLineas, quotation })) {
      continue;
    }
    if (rule.Tipo_Accion === 'ERROR') {
      errors.push({
        ruleId: rule.ID_Regla,
        message: rule.Mensaje || rule.ID_Regla,
        blocking: true,
      });
    }
  }

  return {
    lineas: cleanedLineas,
    totals,
    messages,
    errors,
  };
}
