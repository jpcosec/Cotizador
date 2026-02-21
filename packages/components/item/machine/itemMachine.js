import { assign, createActor, createMachine } from 'https://esm.sh/xstate@5.28.0';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInteger(value, fallback = 0) {
  return Math.round(toNumber(value, fallback));
}

function formatMoney(value) {
  return `$${toInteger(value).toLocaleString('es-CL')}`;
}

function normalizeProfile(raw = {}) {
  return {
    baseFijo: toNumber(raw.baseFijo ?? raw.Costo_Base_Fijo ?? 0),
    porPersona: toNumber(raw.porPersona ?? raw.Costo_Unitario_Pax ?? 0),
    porUnidad: toNumber(raw.porUnidad ?? raw.Costo_Unitario_Item ?? 0),
    porMinuto: toNumber(raw.porMinuto ?? raw.Costo_Unitario_Tiempo ?? 0)
  };
}

function pricingProfileToHuman(profile) {
  const parts = [];
  if (profile.baseFijo) parts.push(`${formatMoney(profile.baseFijo)} fijo`);
  if (profile.porPersona) parts.push(`${formatMoney(profile.porPersona)} por persona`);
  if (profile.porUnidad) parts.push(`${formatMoney(profile.porUnidad)} por unidad`);
  if (profile.porMinuto) parts.push(`${formatMoney(profile.porMinuto)} por minuto`);
  return parts.length ? parts.join(' + ') : '$0';
}

function computeDefaultDuracion(definition, external, pax) {
  const defaults = definition.defaultQuantities || {};
  if (defaults.duracionMin != null) return toInteger(defaults.duracionMin, 0);
  if (external.duracionMin != null) return toInteger(external.duracionMin, 0);
  if (defaults.minutosPorUsuario != null) {
    return toInteger(pax * toNumber(defaults.minutosPorUsuario, 0), 0);
  }
  return 0;
}

function computeDefaultCantidad(definition, external, pax, duracionMin) {
  const defaults = definition.defaultQuantities || {};
  if (defaults.cantidad != null) return toInteger(defaults.cantidad, 0);

  const porUsuario = toNumber(defaults.unidadesPorUsuario, 0) * pax;
  const porHora = toNumber(defaults.unidadesPorHora, 0) * (duracionMin / 60);
  const externalUnits = toNumber(external.cantidadBase, 0);

  const total = porUsuario + porHora + externalUnits;
  return toInteger(total, 0);
}

function resolveQuantities(definition, external, overrides = {}) {
  const pax = overrides.pax != null
    ? toInteger(overrides.pax, 0)
    : toInteger(external.paxGlobal ?? definition.defaultQuantities?.pax ?? 0, 0);

  const duracionMin = overrides.duracionMin != null
    ? toInteger(overrides.duracionMin, 0)
    : computeDefaultDuracion(definition, external, pax);

  const cantidad = overrides.cantidad != null
    ? toInteger(overrides.cantidad, 0)
    : computeDefaultCantidad(definition, external, pax, duracionMin);

  return { pax, duracionMin, cantidad };
}

function evaluateRules(rules = [], snapshot) {
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

function computeTotal(profile, quantities) {
  return (
    profile.baseFijo +
    quantities.pax * profile.porPersona +
    quantities.cantidad * profile.porUnidad +
    quantities.duracionMin * profile.porMinuto
  );
}

function computeState(context) {
  const profile = normalizeProfile(context.definition.pricingProfile || {});
  const quantities = resolveQuantities(context.definition, context.externalContext, context.overrides);

  const schedule = {
    dia: context.overrides.dia ?? context.externalContext.dia ?? 1,
    hora: context.overrides.hora ?? context.externalContext.hora ?? '09:00'
  };

  const baseSnapshot = {
    mode: context.mode,
    quantities,
    schedule
  };

  const ruleResult = evaluateRules(context.definition.rules || [], baseSnapshot);
  const total = computeTotal(profile, quantities);

  return {
    profile,
    quantities,
    schedule,
    pricingHuman: pricingProfileToHuman(profile),
    total,
    unitDisplay: quantities.pax > 0 ? toInteger(total / quantities.pax, 0) : toInteger(total, 0),
    available: ruleResult.available,
    appliedRules: ruleResult.appliedRules
  };
}

function buildItemState(ctx) {
  return {
    ...ctx,
    ...computeState(ctx)
  };
}

export const defaultItemDefinition = {
  name: 'Coffee Break Intermedio',
  category: 'Coffee',
  description: 'Servicio de coffee break para eventos corporativos.',
  pricingProfile: {
    baseFijo: 400,
    porPersona: 20,
    porUnidad: 0,
    porMinuto: 0
  },
  defaultQuantities: {
    unidadesPorUsuario: 1,
    unidadesPorHora: 2,
    minutosPorUsuario: 0
  },
  rules: [
    { id: 'R1', type: 'MAX_PAX', value: 500, label: 'Maximo 500 pax', active: true, blocking: true },
    {
      id: 'R2',
      type: 'ONLY_HOUR_RANGE',
      min: '07:00',
      max: '22:00',
      label: 'Disponible entre 07:00 y 22:00',
      active: true,
      blocking: true
    }
  ]
};

const initialContext = buildItemState({
  mode: 'catalog',
  definition: defaultItemDefinition,
  externalContext: {
    paxGlobal: 20,
    duracionMin: 120,
    dia: 1,
    hora: '09:00'
  },
  overrides: {}
});

export const itemMachine = createMachine({
  id: 'itemStandalone',
  initial: 'ready',
  context: initialContext,
  states: {
    ready: {
      on: {
        SET_MODE: {
          actions: assign(({ context, event }) => buildItemState({ ...context, mode: event.mode || 'catalog' }))
        },
        SET_EXTERNAL_CONTEXT: {
          actions: assign(({ context, event }) =>
            buildItemState({
              ...context,
              externalContext: { ...context.externalContext, ...(event.externalContext || {}) }
            })
          )
        },
        SET_OVERRIDE: {
          actions: assign(({ context, event }) =>
            buildItemState({
              ...context,
              overrides: { ...context.overrides, [event.key]: event.value }
            })
          )
        },
        CLEAR_OVERRIDE: {
          actions: assign(({ context, event }) => {
            const nextOverrides = { ...context.overrides };
            delete nextOverrides[event.key];
            return buildItemState({ ...context, overrides: nextOverrides });
          })
        },
        RESET_OVERRIDES: {
          actions: assign(({ context }) => buildItemState({ ...context, overrides: {} }))
        }
      }
    }
  }
});

export function createItemActor() {
  const actor = createActor(itemMachine);
  actor.start();
  return actor;
}
