/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { GenericUnitBase } from './GenericUnitBase.js';

function clonePlain(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => clonePlain(entry));
  }

  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'function' || typeof entry === 'undefined') {
      continue;
    }
    result[key] = clonePlain(entry);
  }
  return result;
}

export class GenericContainerBase extends GenericUnitBase {
  constructor(options = {}) {
    super({
      ...options,
      type: options.type ?? 'container',
    });
    this.aggregateState = {
      childCount: 0,
      visibleChildCount: 0,
      statuses: {},
      totals: {},
    };
  }

  registerChild(unit, meta = {}) {
    super.registerChild(unit, meta);
    unit.on('PROJECTION_UPDATED', () => {
      this.aggregate();
    });
    unit.on('SIGNAL_EMITTED', (signal) => {
      this.emit('SIGNAL_EMITTED', {
        ...clonePlain(signal),
        via: [...(signal.via ?? []), this.id],
      });
    });
    this.aggregate();
    return this;
  }

  unregisterChild(unitId) {
    super.unregisterChild(unitId);
    this.aggregate();
    return this;
  }

  aggregate() {
    const projections = this.getChildEntries().map(({ unit, meta }) => ({
      projection: unit.getProjection(),
      meta,
    }));
    const totals = projections.reduce((accumulator, entry) => {
      const count = Number(entry.projection.state?.count || 0);
      const subtotal = Number(entry.projection.derived?.pricing?.subtotal || 0);
      return {
        count: accumulator.count + count,
        subtotal: accumulator.subtotal + subtotal,
      };
    }, { count: 0, subtotal: 0 });

    this.aggregateState = {
      childCount: projections.length,
      visibleChildCount: projections.filter((entry) => entry.projection.visible !== false).length,
      statuses: projections.reduce((accumulator, entry) => ({
        ...accumulator,
        [entry.projection.id]: entry.projection.status,
      }), {}),
      totals,
    };

    this.derived = {
      ...clonePlain(this.derived),
      aggregate: clonePlain(this.aggregateState),
    };
    this.refresh();
    return clonePlain(this.aggregateState);
  }

  propagateContext(patch = {}) {
    for (const { unit } of this.getChildEntries()) {
      unit.receiveSignal({
        type: 'PATCH_CONTEXT',
        patch,
        sourceId: this.id,
      });
    }

    this.applyMutation({
      type: 'PATCH_CONTEXT',
      contextPatch: patch,
    });
    this.aggregate();
    return this;
  }

  routeSignal(signal = {}, target = null) {
    if (target) {
      const resolvedTarget = this.resolveSignalTarget(target, signal.targetId);
      if (resolvedTarget && typeof resolvedTarget.receiveSignal === 'function') {
        resolvedTarget.receiveSignal(signal);
        this.aggregate();
      }
      return this;
    }

    this.receiveSignal(signal);
    this.aggregate();
    return this;
  }

  getProjection() {
    return {
      ...super.getProjection(),
      aggregate: clonePlain(this.aggregateState),
    };
  }

  getSnapshot() {
    return {
      ...super.getSnapshot(),
      aggregate: clonePlain(this.aggregateState),
    };
  }
}
