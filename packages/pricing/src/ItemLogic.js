export const PricingKind = {
  NONE: 'NONE',
  PAX: 'PAX',
  UNITS: 'UNITS',
  TIME: 'TIME'
};

export const InitializationMode = {
  NONE: 'NONE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  CONTEXT_PAX: 'CONTEXT_PAX',
  CONTEXT_TIME: 'CONTEXT_TIME'
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInteger(value, fallback = 0) {
  return Math.round(toNumber(value, fallback));
}

function money(value) {
  return `$${toInteger(value, 0).toLocaleString('es-CL')}`;
}

export class ItemLogic {
  normalizeProfile(raw = {}) {
    return {
      baseFijo: toNumber(raw.baseFijo ?? raw.Costo_Base_Fijo ?? 0),
      porPersona: toNumber(raw.porPersona ?? raw.Costo_Unitario_Pax ?? 0),
      porUnidad: toNumber(raw.porUnidad ?? raw.Costo_Unitario_Item ?? 0),
      porMinuto: toNumber(raw.porMinuto ?? raw.Costo_Unitario_Tiempo ?? 0)
    };
  }

  detectPricingKind(profile) {
    if (toNumber(profile.porPersona, 0) > 0) return PricingKind.PAX;
    if (toNumber(profile.porUnidad, 0) > 0) return PricingKind.UNITS;
    if (toNumber(profile.porMinuto, 0) > 0) return PricingKind.TIME;
    return PricingKind.NONE;
  }

  detectInitializationMode(kind, defaults = {}) {
    if (kind === PricingKind.NONE) return InitializationMode.NONE;

    if (kind === PricingKind.PAX) {
      if (toNumber(defaults.pax, 0) > 0) return InitializationMode.FIXED_AMOUNT;
      return InitializationMode.CONTEXT_PAX;
    }

    if (kind === PricingKind.UNITS) {
      if (toNumber(defaults.cantidad, 0) > 0) return InitializationMode.FIXED_AMOUNT;
      if (toNumber(defaults.unidadesPorUsuario, 0) > 0) return InitializationMode.CONTEXT_PAX;
      if (toNumber(defaults.unidadesPorHora, 0) > 0) return InitializationMode.CONTEXT_TIME;
      return InitializationMode.NONE;
    }

    if (kind === PricingKind.TIME) {
      if (toNumber(defaults.duracionMin, 0) > 0) return InitializationMode.FIXED_AMOUNT;
      if (toNumber(defaults.minutosPorUsuario, 0) > 0) return InitializationMode.CONTEXT_PAX;
      return InitializationMode.CONTEXT_TIME;
    }

    return InitializationMode.NONE;
  }

  rateForKind(profile, kind) {
    if (kind === PricingKind.PAX) return toNumber(profile.porPersona, 0);
    if (kind === PricingKind.UNITS) return toNumber(profile.porUnidad, 0);
    if (kind === PricingKind.TIME) return toNumber(profile.porMinuto, 0);
    return 0;
  }

  overrideFieldForKind(kind) {
    if (kind === PricingKind.PAX) return 'pax';
    if (kind === PricingKind.UNITS) return 'cantidad';
    if (kind === PricingKind.TIME) return 'duracionMin';
    return null;
  }

  fixedAmountForKind(kind, defaults = {}) {
    if (kind === PricingKind.PAX) return toNumber(defaults.pax, 0);
    if (kind === PricingKind.UNITS) return toNumber(defaults.cantidad, 0);
    if (kind === PricingKind.TIME) return toNumber(defaults.duracionMin, 0);
    return 0;
  }

  resolveContextQuantity(kind, mode, defaults = {}, context = {}) {
    const paxGlobal = toNumber(context.paxGlobal, 0);
    const durationMin = toNumber(context.duracionMin, 0);

    if (mode === InitializationMode.CONTEXT_PAX) {
      if (kind === PricingKind.PAX) return paxGlobal;
      if (kind === PricingKind.UNITS) return paxGlobal * toNumber(defaults.unidadesPorUsuario, 0);
      if (kind === PricingKind.TIME) return paxGlobal * toNumber(defaults.minutosPorUsuario, 0);
    }

    if (mode === InitializationMode.CONTEXT_TIME) {
      if (kind === PricingKind.UNITS) return (durationMin / 60) * toNumber(defaults.unidadesPorHora, 0);
      if (kind === PricingKind.TIME) return durationMin;
    }

    return 0;
  }

  resolveBasketQuantity(kind, mode, defaults = {}, context = {}, overrides = {}) {
    const overrideField = this.overrideFieldForKind(kind);
    const overrideValue = overrideField ? overrides[overrideField] : null;

    if (overrideField && overrideValue != null) {
      return {
        quantity: toInteger(overrideValue, 0),
        isOverridden: true,
        overrideField
      };
    }

    if (mode === InitializationMode.FIXED_AMOUNT) {
      return {
        quantity: toInteger(this.fixedAmountForKind(kind, defaults), 0),
        isOverridden: false,
        overrideField
      };
    }

    return {
      quantity: toInteger(this.resolveContextQuantity(kind, mode, defaults, context), 0),
      isOverridden: false,
      overrideField
    };
  }

  formatCatalogTerms(base, kind, mode, rate, defaults) {
    const parts = [];
    if (base > 0) parts.push(`${money(base)} fijo`);

    if (kind === PricingKind.NONE) {
      return parts.join(' + ') || '$0';
    }

    if (kind === PricingKind.PAX) {
      if (mode === InitializationMode.FIXED_AMOUNT) {
        parts.push(`${toInteger(defaults.pax, 0)} pax x ${money(rate)}`);
      } else {
        parts.push(`${money(rate)} por pax`);
      }
      return parts.join(' + ');
    }

    if (kind === PricingKind.UNITS) {
      if (mode === InitializationMode.FIXED_AMOUNT) {
        parts.push(`${toInteger(defaults.cantidad, 0)} und x ${money(rate)}`);
      } else if (mode === InitializationMode.CONTEXT_PAX) {
        parts.push(`${toNumber(defaults.unidadesPorUsuario, 0)} und/pax x ${money(rate)}`);
      } else if (mode === InitializationMode.CONTEXT_TIME) {
        parts.push(`${toNumber(defaults.unidadesPorHora, 0)} und/h x ${money(rate)}`);
      } else {
        parts.push(`${money(rate)} por unidad`);
      }
      return parts.join(' + ');
    }

    if (kind === PricingKind.TIME) {
      if (mode === InitializationMode.FIXED_AMOUNT) {
        parts.push(`${toInteger(defaults.duracionMin, 0)} min x ${money(rate)}`);
      } else if (mode === InitializationMode.CONTEXT_PAX) {
        parts.push(`${toNumber(defaults.minutosPorUsuario, 0)} min/pax x ${money(rate)}`);
      } else {
        parts.push(`${money(rate)} por minuto`);
      }
      return parts.join(' + ');
    }

    return parts.join(' + ') || '$0';
  }

  policyHint(kind, mode, defaults = {}) {
    if (kind === PricingKind.UNITS && mode === InitializationMode.CONTEXT_PAX) {
      return `${toNumber(defaults.unidadesPorUsuario, 0)} und/persona`;
    }
    if (kind === PricingKind.UNITS && mode === InitializationMode.CONTEXT_TIME) {
      return `${toNumber(defaults.unidadesPorHora, 0)} und/hora`;
    }
    if (kind === PricingKind.TIME && mode === InitializationMode.CONTEXT_PAX) {
      return `${toNumber(defaults.minutosPorUsuario, 0)} min/persona`;
    }
    return '';
  }

  legendForBasket(base, kind, quantity, rate, total) {
    if (kind === PricingKind.NONE) return `${money(base)} fijo`;

    const qtyLabel = kind === PricingKind.PAX
      ? `${quantity} pax`
      : kind === PricingKind.UNITS
        ? `${quantity} und`
        : `${quantity} min`;

    return `${money(base)} + (${qtyLabel} x ${money(rate)}) = ${money(total)}`;
  }

  resolveSchedule(externalContext = {}, overrides = {}) {
    return {
      dia: overrides.dia ?? externalContext.dia ?? 1,
      hora: overrides.hora ?? externalContext.hora ?? '09:00'
    };
  }

  evaluateRules(rules = [], snapshot) {
    const appliedRules = [];
    let available = true;

    for (const rule of rules) {
      if (!rule || !rule.active) continue;

      if (rule.type === 'MAX_PAX' && snapshot.quantities.pax > toNumber(rule.value, Infinity)) {
        appliedRules.push(rule.label || 'MAX_PAX violated');
        if (rule.blocking) available = false;
        continue;
      }

      if (rule.type === 'MIN_PAX' && snapshot.quantities.pax < toNumber(rule.value, -Infinity)) {
        appliedRules.push(rule.label || 'MIN_PAX violated');
        if (rule.blocking) available = false;
        continue;
      }

      if (rule.type === 'ONLY_HOUR_RANGE') {
        const min = String(rule.min || '00:00');
        const max = String(rule.max || '23:59');
        const hour = String(snapshot.schedule.hora || '00:00');
        if (hour < min || hour > max) {
          appliedRules.push(rule.label || 'hour out of range');
          if (rule.blocking) available = false;
        }
      }
    }

    return { appliedRules, available };
  }

  evaluate({ definition = {}, externalContext = {}, overrides = {}, mode = 'catalog' }) {
    const defaults = definition.defaultQuantities || {};
    const profile = this.normalizeProfile(definition.pricingProfile || {});
    const kind = this.detectPricingKind(profile);
    const initMode = this.detectInitializationMode(kind, defaults);
    const rate = this.rateForKind(profile, kind);
    const base = toNumber(profile.baseFijo, 0);

    const basketResolution = this.resolveBasketQuantity(kind, initMode, defaults, externalContext, overrides);
    const quantity = basketResolution.quantity;
    const total = toInteger(base + quantity * rate, 0);

    const quantities = {
      pax: kind === PricingKind.PAX ? quantity : 0,
      cantidad: kind === PricingKind.UNITS ? quantity : 0,
      duracionMin: kind === PricingKind.TIME ? quantity : 0
    };

    const schedule = this.resolveSchedule(externalContext, overrides);
    const ruleResult = this.evaluateRules(definition.rules || [], { mode, quantities, schedule });

    const profileHuman = [];
    if (base > 0) profileHuman.push(`${money(base)} fijo`);
    if (kind === PricingKind.PAX && rate > 0) profileHuman.push(`${money(rate)} por pax`);
    if (kind === PricingKind.UNITS && rate > 0) profileHuman.push(`${money(rate)} por unidad`);
    if (kind === PricingKind.TIME && rate > 0) profileHuman.push(`${money(rate)} por minuto`);

    const lineRateLabel = kind === PricingKind.PAX
      ? 'Pax'
      : kind === PricingKind.UNITS
        ? 'Unidades'
        : kind === PricingKind.TIME
          ? 'Duracion'
          : 'Cantidad';

    const catalogDisaggregated = this.formatCatalogTerms(base, kind, initMode, rate, defaults);

    return {
      profile,
      pricingKind: kind,
      initializationMode: initMode,
      rate,
      base,
      basketQuantity: quantity,
      total,
      unitDisplay: quantity > 0 ? toInteger(total / quantity, 0) : toInteger(total, 0),
      isOverridden: basketResolution.isOverridden,
      overrideField: basketResolution.overrideField,
      catalogDisaggregated,
      policyHint: this.policyHint(kind, initMode, defaults),
      basketLegend: this.legendForBasket(base, kind, quantity, rate, total),
      pricingHuman: profileHuman.join(' + ') || '$0',
      quantities,
      schedule,
      available: ruleResult.available,
      appliedRules: ruleResult.appliedRules,
      lineRateLabel,
      lineRateSubtotal: quantity * rate,
      comentarios: overrides.comentarios ?? '',
      showPaxControl: kind === PricingKind.PAX,
      showUnitsControl: kind === PricingKind.UNITS,
      showTimeControl: kind === PricingKind.TIME
    };
  }

  applyExclusiveDefaultMode(defaultQuantities = {}, key, rawValue) {
    const value = toNumber(rawValue, 0);
    const next = { ...(defaultQuantities || {}) };

    if (value <= 0) {
      delete next[key];
      return next;
    }

    next[key] = value;

    if (key === 'cantidad') {
      delete next.unidadesPorUsuario;
      delete next.unidadesPorHora;
    }
    if (key === 'unidadesPorUsuario' || key === 'unidadesPorHora') {
      delete next.cantidad;
    }
    if (key === 'duracionMin') {
      delete next.minutosPorUsuario;
    }
    if (key === 'minutosPorUsuario') {
      delete next.duracionMin;
    }

    return next;
  }
}
