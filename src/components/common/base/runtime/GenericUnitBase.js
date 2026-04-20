/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { Actorlike, Alpineable, Eventable } from '../../mixins/ui/index.js';

const RuntimeUnitMixin = (Base) => Alpineable(Eventable(Actorlike(Base)));

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

function mergePlain(base = {}, patch = {}) {
  return {
    ...clonePlain(base),
    ...clonePlain(patch),
  };
}

export class GenericUnitBase extends RuntimeUnitMixin(class {}) {
  constructor(options = {}) {
    super();
    this.id = options.id ?? 'generic-unit';
    this.type = options.type ?? 'generic-unit';
    this.parent = null;
    this.children = new Map();
    this.boundaries = {};
    this.context = {};
    this.state = {};
    this.ui = {
      title: options.title ?? this.id,
      subtitle: options.subtitle ?? '',
      variant: options.variant ?? 'default',
      badges: [],
      panels: [],
      fields: [],
      actions: [],
      classes: [],
    };
    this.status = 'idle';
    this.visible = options.visible ?? true;
    this.enabled = options.enabled ?? true;
    this.stage = options.stage ?? null;
    this.derived = {};
    this.errors = [];
    this.warnings = [];
    this.meta = clonePlain(options.meta ?? {});
    this.boundaryStatus = {};
    this.lastSignal = null;
    this.signalHistory = [];
    this._unsubscribeActor = null;
  }

  initialize(context = {}, boundaries = {}, initialState = {}) {
    this.context = clonePlain(context);
    this.boundaries = { ...boundaries };
    this.state = mergePlain(this.state, initialState);
    this.status = 'ready';
    this.refresh();
    this.emit('UNIT_INITIALIZED', this.getSnapshot());
    return this;
  }

  dispose() {
    if (typeof this._unsubscribeActor === 'function') {
      this._unsubscribeActor();
      this._unsubscribeActor = null;
    }

    this.setActorRef(null);
    this.status = 'disposed';
    this.refresh();
    return this;
  }

  attachActor(actorRef) {
    if (typeof this._unsubscribeActor === 'function') {
      this._unsubscribeActor();
      this._unsubscribeActor = null;
    }

    this.setActorRef(actorRef ?? null);

    if (actorRef && typeof actorRef.subscribe === 'function') {
      const subscription = actorRef.subscribe((snapshot) => {
        this.onActorUpdate(snapshot);
      });

      if (typeof subscription === 'function') {
        this._unsubscribeActor = subscription;
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        this._unsubscribeActor = () => subscription.unsubscribe();
      }
    }

    return this;
  }

  setParent(parent) {
    this.parent = parent ?? null;
    return this;
  }

  registerChild(unit, meta = {}) {
    if (!unit || typeof unit.id !== 'string' || !unit.id.trim()) {
      throw new Error('registerChild(unit, meta) requires a unit with a string id');
    }

    const childMeta = clonePlain(meta);
    unit.setParent(this);

    unit.on('PROJECTION_UPDATED', () => {
      this.refresh();
    });

    unit.on('SNAPSHOT_UPDATED', () => {
      this.refresh();
    });

    this.children.set(unit.id, { unit, meta: childMeta });
    this.emit('CHILD_REGISTERED', { unitId: unit.id, meta: childMeta });
    this.refresh();
    return this;
  }

  unregisterChild(unitId) {
    if (this.children.delete(unitId)) {
      this.emit('CHILD_UNREGISTERED', { unitId });
      this.refresh();
    }

    return this;
  }

  applyMutation(mutation = {}) {
    const normalized = clonePlain(mutation);
    const patch = normalized.patch ?? normalized.state ?? {};
    const contextPatch = normalized.contextPatch ?? normalized.context ?? normalized.patchContext ?? {};

    if (Object.keys(contextPatch).length > 0) {
      this.context = mergePlain(this.context, contextPatch);
    }

    if (Object.keys(patch).length > 0) {
      this.state = mergePlain(this.state, patch);
    }

    if (normalized.ui) {
      this.ui = mergePlain(this.ui, normalized.ui);
    }

    if (normalized.derived) {
      this.derived = mergePlain(this.derived, normalized.derived);
    }

    if (normalized.boundaryStatus) {
      this.boundaryStatus = mergePlain(this.boundaryStatus, normalized.boundaryStatus);
    }

    if (Array.isArray(normalized.errors)) {
      this.errors = clonePlain(normalized.errors);
    }

    if (Array.isArray(normalized.warnings)) {
      this.warnings = clonePlain(normalized.warnings);
    }

    if (typeof normalized.status === 'string') {
      this.status = normalized.status;
    }

    if (typeof normalized.visible === 'boolean') {
      this.visible = normalized.visible;
    }

    if (typeof normalized.enabled === 'boolean') {
      this.enabled = normalized.enabled;
    }

    if (Object.prototype.hasOwnProperty.call(normalized, 'stage')) {
      this.stage = normalized.stage ?? null;
    }

    this.lastSignal = {
      type: normalized.type ?? 'APPLY_MUTATION',
      unitId: this.id,
    };
    this.signalHistory.push(this.lastSignal);
    this.signalHistory = this.signalHistory.slice(-20);
    this.emit('STATE_MUTATED', { mutation: normalized, snapshot: this.getSnapshot() });
    this.refresh();
    return this;
  }

  receiveSignal(signal = {}) {
    const envelope = {
      ...clonePlain(signal),
      targetId: signal.targetId ?? this.id,
    };

    this.lastSignal = envelope;
    this.signalHistory.push(envelope);
    this.signalHistory = this.signalHistory.slice(-20);
    this.emit('SIGNAL_RECEIVED', envelope);

    if (this.hasActorRef && typeof envelope.type === 'string') {
      this.sendEvent(envelope.type, envelope);
      return this;
    }

    if (envelope.type === 'PATCH_CONTEXT' || envelope.type === 'SET_CONTEXT') {
      this.applyMutation({
        type: envelope.type,
        contextPatch: envelope.patch ?? envelope.contextPatch ?? {},
      });
      return this;
    }

    if (envelope.type === 'APPLY_MUTATION') {
      this.applyMutation({
        type: envelope.type,
        ...(envelope.mutation ?? {}),
      });
      return this;
    }

    if (envelope.type === 'SET_UI') {
      this.applyMutation({ type: envelope.type, ui: envelope.ui ?? {} });
      return this;
    }

    if (envelope.type === 'SET_STATUS') {
      this.applyMutation({ type: envelope.type, status: envelope.status ?? 'ready' });
      return this;
    }

    if (envelope.type === 'REQUEST_SNAPSHOT' || envelope.type === 'REFRESH_PROJECTION') {
      this.refresh();
      return this;
    }

    return this;
  }

  emitSignal(signal = {}, target = null) {
    const envelope = {
      ...clonePlain(signal),
      sourceId: signal.sourceId ?? this.id,
      sourceType: signal.sourceType ?? this.type,
    };

    this.lastSignal = envelope;
    this.signalHistory.push(envelope);
    this.signalHistory = this.signalHistory.slice(-20);
    this.emit('SIGNAL_EMITTED', envelope);

    const resolvedTarget = this.resolveSignalTarget(target, envelope.targetId);
    if (resolvedTarget && typeof resolvedTarget.receiveSignal === 'function') {
      resolvedTarget.receiveSignal(envelope);
    }

    return envelope;
  }

  resolveSignalTarget(target, targetId) {
    if (target && typeof target.receiveSignal === 'function') {
      return target;
    }

    if (typeof target === 'string' && this.children.has(target)) {
      return this.children.get(target).unit;
    }

    if (typeof target === 'string' && this.parent && this.parent.children.has(target)) {
      return this.parent.children.get(target).unit;
    }

    if (typeof targetId === 'string' && this.children.has(targetId)) {
      return this.children.get(targetId).unit;
    }

    if (typeof targetId === 'string' && this.parent && this.parent.children.has(targetId)) {
      return this.parent.children.get(targetId).unit;
    }

    if (this.parent && (target === null || typeof target === 'undefined' || targetId === this.parent.id)) {
      return this.parent;
    }

    return null;
  }

  async callBoundary(boundaryName, actionName, payload = {}, options = {}) {
    const boundary = this.boundaries[boundaryName];
    const boundaryKey = `${boundaryName}.${actionName}`;
    const actorRef = options.actorRef ?? this._actorRef;
    const successType = options.successType ?? 'BOUNDARY_DONE';
    const errorType = options.errorType ?? 'BOUNDARY_ERROR';

    this.applyMutation({
      boundaryStatus: {
        [boundaryKey]: {
          status: 'pending',
          requestedAt: new Date().toISOString(),
        },
      },
    });

    try {
      let result;

      if (typeof boundary === 'function') {
        result = await boundary(payload);
      } else if (boundary && typeof boundary[actionName] === 'function') {
        result = await boundary[actionName](payload);
      } else {
        throw new Error(`Missing boundary handler for ${boundaryKey}`);
      }

      if (actorRef && typeof actorRef.send === 'function') {
        actorRef.send({
          type: successType,
          boundaryName,
          actionName,
          result: clonePlain(result),
        });
      } else {
        this.applyMutation({
          boundaryStatus: {
            [boundaryKey]: {
              status: 'success',
              result: clonePlain(result),
            },
          },
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (actorRef && typeof actorRef.send === 'function') {
        actorRef.send({
          type: errorType,
          boundaryName,
          actionName,
          error: message,
        });
      } else {
        this.applyMutation({
          boundaryStatus: {
            [boundaryKey]: {
              status: 'error',
              error: message,
            },
          },
          errors: [...this.errors, message],
          status: 'error',
        });
      }

      throw error;
    }
  }

  getChildEntries() {
    return Array.from(this.children.values()).map(({ unit, meta }) => ({
      id: unit.id,
      unit,
      meta: clonePlain(meta),
    }));
  }

  getProjection() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      visible: this.visible,
      enabled: this.enabled,
      stage: this.stage,
      state: clonePlain(this.state),
      context: clonePlain(this.context),
      ui: clonePlain(this.ui),
      children: this.getChildEntries().map(({ unit, meta }) => ({
        ...unit.getProjection(),
        meta,
      })),
      derived: clonePlain(this.derived),
      errors: clonePlain(this.errors),
      warnings: clonePlain(this.warnings),
      actions: clonePlain(this.ui.actions ?? []),
      boundaryStatus: clonePlain(this.boundaryStatus),
      lastSignal: clonePlain(this.lastSignal),
    };
  }

  getSnapshot() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      visible: this.visible,
      enabled: this.enabled,
      stage: this.stage,
      context: clonePlain(this.context),
      state: clonePlain(this.state),
      ui: clonePlain(this.ui),
      derived: clonePlain(this.derived),
      errors: clonePlain(this.errors),
      warnings: clonePlain(this.warnings),
      boundaryStatus: clonePlain(this.boundaryStatus),
      meta: clonePlain(this.meta),
      lastSignal: clonePlain(this.lastSignal),
      childIds: this.getChildEntries().map(({ id }) => id),
    };
  }

  toDisplayObject() {
    return this.getProjection();
  }

  refresh() {
    this.emit('PROJECTION_UPDATED', this.getProjection());
    this.emit('SNAPSHOT_UPDATED', this.getSnapshot());
    return this;
  }
}
