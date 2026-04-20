/**
 * Human-readable formatting for REGLAS_NEGOCIO rows.
 * Used for debug logging and UI display.
 */

// ── Condition ────────────────────────────────────────────────────────────────

const COMPARATORS = {
  '===': '=',
  '!==': '≠',
  '>':   '>',
  '>=':  '≥',
  '<':   '<',
  '<=':  '≤',
};

function resolveValue(node) {
  if (node === null) return 'not set';
  if (typeof node !== 'object') return String(node);
  if ('var' in node) return node.var;
  return humanizeCondition(node);
}

function humanizeBinaryOp(op, args) {
  const [left, right] = args;
  const leftStr = resolveValue(left);
  const rightStr = right === null ? 'not set' : resolveValue(right);
  const sym = COMPARATORS[op];
  return sym ? `${leftStr} ${sym} ${rightStr}` : `${leftStr} ${op} ${rightStr}`;
}

function humanizeLogicalOp(op, args) {
  const joiner = op === 'and' ? ' AND ' : ' OR ';
  const parts = args.map(a => {
    const inner = humanizeCondition(a);
    // Wrap compound expressions in parens for clarity
    return typeof a === 'object' && !('var' in a) ? `(${inner})` : inner;
  });
  return parts.join(joiner);
}

export function humanizeCondition(condJson) {
  const logic = typeof condJson === 'string' ? JSON.parse(condJson) : condJson;

  if (logic === true || logic === 'true') return 'always';
  if (logic === false || logic === 'false') return 'never';
  if (typeof logic !== 'object' || logic === null) return String(logic);

  const [op] = Object.keys(logic);
  const args = logic[op];

  if (op === 'and' || op === 'or') return humanizeLogicalOp(op, args);
  if (op === '!')                   return `NOT (${humanizeCondition(args)})`;
  if (op in COMPARATORS)            return humanizeBinaryOp(op, args);
  if (op === 'in')                  return `${resolveValue(args[0])} in [${args[1].join(', ')}]`;

  // Fallback: stringify unknown operators
  return JSON.stringify(logic);
}

// ── Payload ──────────────────────────────────────────────────────────────────

const PAYLOAD_FORMATTERS = {
  MULTIPLY:         ({ factor }) => `×${factor} (+${Math.round((factor - 1) * 100)}%)`,
  ADD_FIXED:        ({ amount }) => amount < 0 ? `−$${Math.abs(amount).toLocaleString()} flat` : `+$${amount.toLocaleString()} flat`,
  SET_VALUE:        ({ value }) => `set price to $${value.toLocaleString()}`,
  SET_TAX:          ({ name, rate }) => `${name} ${rate * 100}%`,
  SET_DEFAULT:      ({ field, value }) => `default ${field} = ${value}`,
  ADD_ITEM:         ({ itemId }) => `auto-add ${itemId}`,
  WARNING:          ({ message }) => message,
  ERROR:            ({ message }) => message,
  INVALIDATE_BASKET:({ message }) => message,
};

export function humanizePayload(tipoAccion, payloadJson) {
  const payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
  const formatter = PAYLOAD_FORMATTERS[tipoAccion];
  return formatter ? formatter(payload) : JSON.stringify(payload);
}

// ── Rule summary ─────────────────────────────────────────────────────────────

export function humanizeRule(rule) {
  const condition = humanizeCondition(rule.Condicion_JSON);
  const action    = humanizePayload(rule.Tipo_Accion, rule.Payload_JSON);
  return `When ${condition}, ${rule.Tipo_Accion} ${action}`;
}
