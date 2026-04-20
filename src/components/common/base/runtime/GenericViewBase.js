/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { assign, createActor, setup } from 'xstate';
import { GenericUnitBase } from './GenericUnitBase.js';
import { RuntimeSignal } from './signals.js';

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

function normalizeStages(stages = []) {
  return stages.map((stage, index) => {
    if (typeof stage === 'string') {
      return {
        id: stage,
        label: stage.replace(/[_-]+/g, ' '),
        order: index,
      };
    }

    return {
      id: stage.id,
      label: stage.label ?? stage.id,
      order: index,
    };
  });
}

function getStageIndex(stageOrder, stageId) {
  const index = stageOrder.indexOf(stageId);
  return index >= 0 ? index : 0;
}

function getNeighborStage(stageOrder, currentStageId, direction) {
  const currentIndex = getStageIndex(stageOrder, currentStageId);
  const nextIndex = Math.max(0, Math.min(stageOrder.length - 1, currentIndex + direction));
  return stageOrder[nextIndex] ?? currentStageId ?? null;
}

function createViewMachine(view) {
  const stageOrder = view.stages.map((stage) => stage.id);
  const initialStageId = view.stage ?? stageOrder[0] ?? null;

  return setup({
    actions: {
      requestSave: ({ event, self }) => {
        void view.callBoundary('persistence', 'save', {
          snapshot: view.getSnapshot(),
          payload: clonePlain(event.payload ?? {}),
        }, { actorRef: self });
      },
      requestExport: ({ event, self }) => {
        void view.callBoundary('export', 'generate', {
          projection: view.getProjection(),
          payload: clonePlain(event.payload ?? {}),
        }, { actorRef: self });
      },
      requestPricing: ({ event, self }) => {
        void view.callBoundary('pricing', 'evaluate', {
          snapshot: view.getSnapshot(),
          payload: clonePlain(event.payload ?? {}),
        }, { actorRef: self });
      },
      requestRules: ({ event, self }) => {
        void view.callBoundary('rules', 'evaluate', {
          snapshot: view.getSnapshot(),
          payload: clonePlain(event.payload ?? {}),
        }, { actorRef: self });
      },
      requestStore: ({ event, self }) => {
        void view.callBoundary('store', 'query', {
          snapshot: view.getSnapshot(),
          payload: clonePlain(event.payload ?? {}),
        }, { actorRef: self });
      },
    },
  }).createMachine({
    id: `${view.id}-view-machine`,
    initial: 'active',
    context: {
      stageOrder,
      stageId: initialStageId,
      contextData: clonePlain(view.context),
      runtimeState: clonePlain(view.state),
      ui: clonePlain(view.ui),
      boundaryStatus: clonePlain(view.boundaryStatus),
      derived: clonePlain(view.derived),
      errors: clonePlain(view.errors),
      warnings: clonePlain(view.warnings),
      status: view.status,
      lastSignal: null,
    },
    states: {
      active: {},
    },
    on: {
      [RuntimeSignal.applyMutation]: {
        actions: assign(({ context, event }) => ({
          runtimeState: mergePlain(context.runtimeState, clonePlain(event.patch ?? event.state ?? event.mutation?.patch ?? {})),
          contextData: mergePlain(context.contextData, clonePlain(event.contextPatch ?? event.mutation?.contextPatch ?? {})),
          ui: mergePlain(context.ui, clonePlain(event.ui ?? event.mutation?.ui ?? {})),
          derived: mergePlain(context.derived, clonePlain(event.derived ?? event.mutation?.derived ?? {})),
          status: event.status ?? event.mutation?.status ?? context.status,
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.patchContext]: {
        actions: assign(({ context, event }) => ({
          contextData: mergePlain(context.contextData, clonePlain(event.patch ?? event.contextPatch ?? {})),
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.setContext]: {
        actions: assign(({ event }) => ({
          contextData: clonePlain(event.patch ?? event.contextPatch ?? {}),
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.enterStage]: {
        actions: assign(({ context, event }) => ({
          stageId: stageOrder.includes(event.stageId) ? event.stageId : context.stageId,
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.nextStage]: {
        actions: assign(({ context, event }) => ({
          stageId: getNeighborStage(stageOrder, context.stageId, 1),
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.previousStage]: {
        actions: assign(({ context, event }) => ({
          stageId: getNeighborStage(stageOrder, context.stageId, -1),
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.requestSave]: {
        actions: [
          assign(({ context, event }) => ({
            boundaryStatus: mergePlain(context.boundaryStatus, {
              'persistence.save': {
                status: 'pending',
                payload: clonePlain(event.payload ?? {}),
              },
            }),
            lastSignal: clonePlain(event),
          })),
          'requestSave',
        ],
      },
      [RuntimeSignal.requestExport]: {
        actions: [
          assign(({ context, event }) => ({
            boundaryStatus: mergePlain(context.boundaryStatus, {
              'export.generate': {
                status: 'pending',
                payload: clonePlain(event.payload ?? {}),
              },
            }),
            lastSignal: clonePlain(event),
          })),
          'requestExport',
        ],
      },
      [RuntimeSignal.requestPricing]: {
        actions: [
          assign(({ context, event }) => ({
            boundaryStatus: mergePlain(context.boundaryStatus, {
              'pricing.evaluate': {
                status: 'pending',
                payload: clonePlain(event.payload ?? {}),
              },
            }),
            lastSignal: clonePlain(event),
          })),
          'requestPricing',
        ],
      },
      [RuntimeSignal.requestRules]: {
        actions: [
          assign(({ context, event }) => ({
            boundaryStatus: mergePlain(context.boundaryStatus, {
              'rules.evaluate': {
                status: 'pending',
                payload: clonePlain(event.payload ?? {}),
              },
            }),
            lastSignal: clonePlain(event),
          })),
          'requestRules',
        ],
      },
      [RuntimeSignal.requestStore]: {
        actions: [
          assign(({ context, event }) => ({
            boundaryStatus: mergePlain(context.boundaryStatus, {
              'store.query': {
                status: 'pending',
                payload: clonePlain(event.payload ?? {}),
              },
            }),
            lastSignal: clonePlain(event),
          })),
          'requestStore',
        ],
      },
      [RuntimeSignal.boundaryDone]: {
        actions: assign(({ context, event }) => ({
          boundaryStatus: mergePlain(context.boundaryStatus, {
            [`${event.boundaryName}.${event.actionName}`]: {
              status: 'success',
              result: clonePlain(event.result),
            },
          }),
          derived: mergePlain(context.derived, {
            [event.boundaryName]: clonePlain(event.result),
          }),
          status: 'ready',
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.boundaryError]: {
        actions: assign(({ context, event }) => ({
          boundaryStatus: mergePlain(context.boundaryStatus, {
            [`${event.boundaryName}.${event.actionName}`]: {
              status: 'error',
              error: event.error,
            },
          }),
          errors: [...context.errors, event.error],
          status: 'error',
          lastSignal: clonePlain(event),
        })),
      },
      [RuntimeSignal.childSignal]: {
        actions: assign(({ context, event }) => ({
          runtimeState: mergePlain(context.runtimeState, {
            childSignals: [...(context.runtimeState.childSignals ?? []), clonePlain(event.signal)].slice(-10),
          }),
          lastSignal: clonePlain(event),
        })),
      },
    },
  });
}

export class GenericViewBase extends GenericUnitBase {
  constructor(options = {}) {
    super({
      ...options,
      type: options.type ?? 'view',
    });
    this.viewId = options.viewId ?? this.id;
    this.stages = normalizeStages(options.stages ?? []);
    this.stage = options.initialStageId ?? this.stages[0]?.id ?? null;
  }

  initialize(context = {}, boundaries = {}, initialState = {}) {
    super.initialize(context, boundaries, {
      ...initialState,
      childSignals: initialState.childSignals ?? [],
    });

    this.stage = initialState.stage ?? this.stage ?? this.stages[0]?.id ?? null;
    const actor = createActor(createViewMachine(this));
    this.attachActor(actor);
    actor.start();
    this.refresh();
    return this;
  }

  onActorUpdate(snapshot) {
    const machineContext = snapshot?.context;
    if (!machineContext) {
      return;
    }

    this.stage = machineContext.stageId ?? this.stage;
    this.context = clonePlain(machineContext.contextData ?? this.context);
    this.state = clonePlain(machineContext.runtimeState ?? this.state);
    this.ui = clonePlain(machineContext.ui ?? this.ui);
    this.boundaryStatus = clonePlain(machineContext.boundaryStatus ?? this.boundaryStatus);
    this.derived = clonePlain(machineContext.derived ?? this.derived);
    this.errors = clonePlain(machineContext.errors ?? this.errors);
    this.warnings = clonePlain(machineContext.warnings ?? this.warnings);
    this.status = machineContext.status ?? this.status;
    this.lastSignal = clonePlain(machineContext.lastSignal ?? this.lastSignal);
    this.refresh();
  }

  registerChild(unit, meta = {}) {
    super.registerChild(unit, meta);

    unit.on('SIGNAL_EMITTED', (signal) => {
      if (this.hasActorRef) {
        this.sendEvent(RuntimeSignal.childSignal, { signal });
      }
    });

    return this;
  }

  transition(signal = {}) {
    this.receiveSignal(signal);
    return this.stage;
  }

  routeSignal(signal = {}, target = null) {
    if (target) {
      const resolvedTarget = this.resolveSignalTarget(target, signal.targetId);
      if (resolvedTarget && typeof resolvedTarget.receiveSignal === 'function') {
        resolvedTarget.receiveSignal(signal);
        this.refresh();
      }
      return this;
    }

    this.receiveSignal(signal);
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

    return super.receiveSignal(envelope);
  }

  getVisibleChildren() {
    return this.getChildEntries().filter(({ meta }) => {
      if (!Array.isArray(meta.stages) || meta.stages.length === 0) {
        return true;
      }

      return meta.stages.includes(this.stage);
    });
  }

  getProjection() {
    const visibleChildren = this.getVisibleChildren();
    const visibleUnits = visibleChildren.map(({ unit, meta }) => ({
      id: unit.id,
      type: unit.type,
      title: meta.title ?? unit.ui.title,
      stageIds: clonePlain(meta.stages ?? []),
    }));

    return {
      ...super.getProjection(),
      viewId: this.viewId,
      stage: this.stage,
      stages: this.stages.map((stage) => ({
        ...stage,
        isActive: stage.id === this.stage,
      })),
      visibleUnits,
      children: visibleChildren.map(({ unit, meta }) => ({
        ...unit.getProjection(),
        meta,
      })),
      derived: {
        ...clonePlain(this.derived),
        visibleChildCount: visibleChildren.length,
        totalChildCount: this.children.size,
      },
    };
  }
}
