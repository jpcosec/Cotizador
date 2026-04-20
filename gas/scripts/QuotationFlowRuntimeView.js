/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { GenericViewBase, RuntimeSignal } from '../../src/components/common/base/runtime/index.js';

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

const QUOTATION_STAGES = ['browse', 'client', 'basket', 'validation'];

export class QuotationFlowRuntimeView extends GenericViewBase {
  constructor(runtime, options = {}) {
    super({
      id: options.id ?? 'quotation-flow-view',
      viewId: options.viewId ?? 'quotation-flow',
      title: options.title ?? 'Quotation Flow',
      stages: options.stages ?? QUOTATION_STAGES,
    });
    this.runtime = runtime;
    this.unsubscribeRuntime = null;
  }

  initialize(context = {}, boundaries = {}, initialState = {}) {
    super.initialize(context, boundaries, {
      ...initialState,
      stage: initialState.stage ?? this.runtime?.getSnapshot?.().stage ?? 'browse',
    });
    this.receiveRuntimeSnapshot(this.runtime?.getSnapshot?.() ?? {});
    return this;
  }

  attachRuntime(runtime = this.runtime) {
    this.runtime = runtime;
    if (typeof this.unsubscribeRuntime === 'function') {
      this.unsubscribeRuntime();
      this.unsubscribeRuntime = null;
    }

    if (typeof runtime?.subscribe === 'function') {
      this.unsubscribeRuntime = runtime.subscribe((snapshot) => {
        this.receiveRuntimeSnapshot(snapshot);
      });
    }

    this.receiveRuntimeSnapshot(runtime?.getSnapshot?.() ?? {});
    return this;
  }

  receiveRuntimeSnapshot(snapshot = {}) {
    this.receiveSignal({
      type: RuntimeSignal.enterStage,
      stageId: snapshot.stage ?? 'browse',
    });
    this.receiveSignal({
      type: RuntimeSignal.applyMutation,
      contextPatch: {
        selectedClient: clonePlain(snapshot.selectedClient ?? null),
        settings: clonePlain(snapshot.settings ?? {}),
      },
      derived: {
        shell: {
          clientModalOpen: Boolean(snapshot.clientModalOpen),
          clients: clonePlain(snapshot.clients ?? []),
          catalogSummary: clonePlain(snapshot.catalog?.summary ?? {}),
          basketSummary: clonePlain(snapshot.basket?.summary ?? {}),
          validationTotals: clonePlain(snapshot.validation?.totals ?? {}),
          persistence: clonePlain(snapshot.persistence ?? {}),
        },
      },
      ui: {
        title: snapshot.selectedClient?.nombre || 'Quotation Flow',
        subtitle: `Stage: ${snapshot.stage ?? 'browse'}`,
      },
      status: snapshot.persistence?.error ? 'error' : 'ready',
    });
    return this;
  }

  getProjection() {
    const projection = super.getProjection();
    return {
      ...projection,
      shell: {
        selectedClient: clonePlain(this.context.selectedClient ?? null),
        settings: clonePlain(this.context.settings ?? {}),
        ...clonePlain(this.derived.shell ?? {}),
      },
    };
  }

  dispose() {
    if (typeof this.unsubscribeRuntime === 'function') {
      this.unsubscribeRuntime();
      this.unsubscribeRuntime = null;
    }
    return super.dispose();
  }
}

export function createQuotationFlowRuntimeView(runtime, options = {}) {
  const view = new QuotationFlowRuntimeView(runtime, options);
  view.initialize({}, {}, {});
  view.attachRuntime(runtime);
  return view;
}
