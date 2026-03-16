function toIsoString(now) {
  if (now instanceof Date) return now.toISOString();
  if (typeof now === 'string') {
    const date = new Date(now);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const resolved = new Date(now ?? Date.now());
  if (Number.isNaN(resolved.getTime())) {
    throw new Error('serializeQuotation: invalid "now" value');
  }
  return resolved.toISOString();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringOrFallback(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function resolveClientId(selectedClient) {
  const id = selectedClient?.id ?? selectedClient?.ID_Cliente;
  if (id === undefined || id === null || id === '') return null;
  return String(id);
}

function resolveItemId(entry) {
  const id = entry?.itemId ?? entry?.state?.definition?.id ?? entry?.state?.definition?.ID_Item;
  if (id === undefined || id === null || id === '') return null;
  return String(id);
}

function resolveHour(entry, fallbackHour) {
  const overrideHour = entry?.state?.overrides?.hora;
  if (overrideHour !== undefined && overrideHour !== null && overrideHour !== '') {
    return String(overrideHour);
  }

  const scheduleHour = entry?.state?.schedule?.hora;
  if (scheduleHour !== undefined && scheduleHour !== null && scheduleHour !== '') {
    return String(scheduleHour);
  }

  return toStringOrFallback(fallbackHour, '09:00');
}

function normalizeDays(days = []) {
  const indexedDays = (days || []).map((day, index) => ({
    day,
    order: index,
    dayIndex: toPositiveInteger(day?.dayIndex, index + 1),
  }));

  indexedDays.sort((left, right) => {
    if (left.dayIndex !== right.dayIndex) return left.dayIndex - right.dayIndex;
    return left.order - right.order;
  });

  return indexedDays;
}

function flattenEntries(days = []) {
  const out = [];
  const normalizedDays = normalizeDays(days);

  for (const normalizedDay of normalizedDays) {
    const entries = normalizedDay.day?.entries || [];
    for (const entry of entries) {
      out.push({ dayIndex: normalizedDay.dayIndex, entry });
    }
  }

  return out;
}

function assertPolicy(policy) {
  if (!policy || typeof policy.createQuotationId !== 'function' || typeof policy.createLineId !== 'function') {
    throw new Error('serializeQuotation: idPolicy must provide createQuotationId and createLineId');
  }
}

export function createDefaultIdPolicy() {
  return {
    createQuotationId({ nowIso }) {
      const compact = String(nowIso || '').replace(/[^0-9]/g, '').slice(0, 17);
      return `COT-${compact || '00000000000000000'}`;
    },
    createLineId({ quotationId, lineIndex }) {
      const padded = String(lineIndex + 1).padStart(4, '0');
      return `LIN-${quotationId}-${padded}`;
    },
  };
}

export function serializeQuotation({
  selectedClient,
  settings = {},
  basketState = {},
  quotationId = null,
  idPolicy = null,
  now = new Date(),
} = {}) {
  const clientId = resolveClientId(selectedClient);
  if (!clientId) {
    throw new Error('serializeQuotation: selectedClient id is required');
  }

  const nowIso = toIsoString(now);
  const policy = idPolicy || createDefaultIdPolicy();
  assertPolicy(policy);

  const generatedQuotationId = policy.createQuotationId({
    selectedClient,
    settings,
    basketState,
    nowIso,
  });

  const resolvedQuotationId = toStringOrFallback(quotationId, generatedQuotationId);
  if (!resolvedQuotationId) {
    throw new Error('serializeQuotation: quotationId cannot be empty');
  }

  const cotizacion = {
    ID_Cotizacion: resolvedQuotationId,
    ID_Cliente: clientId,
    Estado: 'Borrador',
    Fecha_Evento: toStringOrFallback(settings.fechaInicio),
    Duracion_Dias: toPositiveInteger(settings.duracionDias, 1),
    Pax_Global: toPositiveInteger(settings.paxGlobal, 1),
    Updated_At: nowIso,
  };

  const entries = flattenEntries(basketState.days || []);

  const lineas = entries.map(({ dayIndex, entry }, lineIndex) => {
    const overrides = entry?.state?.overrides || {};

    return {
      ID_Linea: String(policy.createLineId({
        quotationId: resolvedQuotationId,
        lineIndex,
        dayIndex,
        entry,
      })),
      ID_Cotizacion: resolvedQuotationId,
      ID_Item: resolveItemId(entry),
      Estado_Linea: 'ACTIVA',
      Dia_Numero: dayIndex,
      Hora_Inicio: resolveHour(entry, settings.horaInicio),
      Override_Pax: toNullableNumber(overrides.pax),
      Override_Cantidad: toNullableNumber(overrides.cantidad),
      Override_Duracion_Min: toNullableNumber(overrides.duracionMin),
      Comentarios: toStringOrFallback(overrides.comentarios),
      Updated_At: nowIso,
    };
  });

  return { cotizacion, lineas };
}
