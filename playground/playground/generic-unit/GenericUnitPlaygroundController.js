/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import {
  GenericUnitBase,
  GenericViewBase,
} from '../../../src/components/common/base/index.js';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

class DemoUnit extends GenericUnitBase {
  receiveSignal(signal = {}) {
    if (signal.type === 'BOOST') {
      const nextCount = Number(this.state.count || 0) + Number(signal.payload?.amount || 1);
      this.applyMutation({
        type: 'BOOST',
        patch: { count: nextCount },
        ui: { subtitle: `Count ${nextCount}` },
        derived: { updatedBy: signal.sourceId ?? 'playground' },
      });
      return this;
    }

    if (signal.type === 'CHILD_NOTE') {
      this.applyMutation({
        type: 'CHILD_NOTE',
        patch: { lastNote: signal.payload?.note ?? '' },
        ui: { subtitle: signal.payload?.note ?? 'Note received' },
      });
      return this;
    }

    if (signal.type === 'SET_VISUAL_STATUS') {
      this.applyMutation({
        type: 'SET_VISUAL_STATUS',
        status: signal.payload?.status ?? 'ready',
        ui: {
          badges: signal.payload?.badges ?? [],
        },
      });
      return this;
    }

    return super.receiveSignal(signal);
  }
}

function createMockBoundaries() {
  return {
    persistence: {
      async save({ snapshot, payload }) {
        await wait(120);
        return {
          ok: true,
          savedAt: 'playground',
          label: payload.label ?? 'draft',
          childCount: snapshot.childIds.length,
        };
      },
    },
    export: {
      async generate({ projection, payload }) {
        await wait(90);
        return {
          ok: true,
          format: payload.format ?? 'pdf',
          stage: projection.stage,
          visibleUnits: projection.visibleUnits.map((unit) => unit.id),
        };
      },
    },
    pricing: {
      async evaluate({ payload }) {
        await wait(80);
        const quantity = Number(payload.quantity || 0);
        const unitPrice = Number(payload.unitPrice || 0);
        return {
          subtotal: quantity * unitPrice,
          quantity,
          unitPrice,
        };
      },
    },
    rules: {
      async evaluate({ payload }) {
        await wait(70);
        const subtotal = Number(payload.subtotal || 0);
        return {
          level: subtotal >= 100 ? 'high-value' : 'standard',
          warnings: subtotal === 0 ? ['Subtotal is zero'] : [],
        };
      },
    },
  };
}

function createDemoRuntime() {
  const view = new GenericViewBase({
    id: 'generic-unit-lab',
    title: 'GenericUnit Lab',
    stages: [
      { id: 'compose', label: 'Compose' },
      { id: 'review', label: 'Review' },
      { id: 'export', label: 'Export' },
    ],
  });

  view.initialize(
    {
      mode: 'playground',
      runtime: 'generic-unit-spike',
    },
    createMockBoundaries(),
    {
      childSignals: [],
      selectedUnitId: 'status-unit',
    },
  );

  view.applyMutation({
    ui: {
      title: 'GenericUnit Runtime Lab',
      subtitle: 'Alpine renders projections while XState drives transitions and boundaries.',
      actions: [
        { id: 'next', label: 'Next stage' },
        { id: 'save', label: 'Save snapshot' },
        { id: 'export', label: 'Export projection' },
      ],
    },
  });

  const statusUnit = new DemoUnit({
    id: 'status-unit',
    type: 'demo-unit',
    title: 'Status Unit',
    subtitle: 'Tracks local mutations and outbound signals.',
  }).initialize(
    { unitRole: 'status' },
    {},
    { count: 1, lastNote: '' },
  );

  statusUnit.applyMutation({
    ui: {
      variant: 'signal',
      badges: ['local-state'],
      panels: ['count', 'signal'],
      actions: ['boost', 'notify'],
    },
  });

  const inspectorUnit = new DemoUnit({
    id: 'inspector-unit',
    type: 'demo-unit',
    title: 'Inspector Unit',
    subtitle: 'Receives routed signals and mirrors view status.',
  }).initialize(
    { unitRole: 'inspector' },
    {},
    { count: 0, lastNote: 'Waiting for sibling signal' },
  );

  inspectorUnit.applyMutation({
    ui: {
      variant: 'projection',
      badges: ['cross-unit'],
      panels: ['context', 'projection'],
      actions: ['highlight'],
    },
  });

  view.registerChild(statusUnit, {
    title: 'Status Unit',
    stages: ['compose', 'review', 'export'],
  });

  view.registerChild(inspectorUnit, {
    title: 'Inspector Unit',
    stages: ['review', 'export'],
  });

  return {
    view,
    statusUnit,
    inspectorUnit,
  };
}

export function createGenericUnitPlaygroundController() {
  const runtime = createDemoRuntime();
  const signalLog = [];

  function recordSignal(kind, payload) {
    signalLog.unshift({
      kind,
      timestamp: new Date().toISOString(),
      payload: clonePlain(payload),
    });
    signalLog.splice(12);
  }

  runtime.view.on('SIGNAL_RECEIVED', (signal) => {
    recordSignal('view:received', signal);
  });

  runtime.view.on('SIGNAL_EMITTED', (signal) => {
    recordSignal('view:emitted', signal);
  });

  runtime.statusUnit.on('SIGNAL_EMITTED', (signal) => {
    recordSignal('status:emitted', signal);
  });

  runtime.inspectorUnit.on('SIGNAL_RECEIVED', (signal) => {
    recordSignal('inspector:received', signal);
  });

  return {
    projection: runtime.view.getProjection(),
    snapshot: runtime.view.getSnapshot(),
    signalLog,
    debugOpen: true,

    init() {
      const sync = () => {
        this.projection = runtime.view.getProjection();
        this.snapshot = runtime.view.getSnapshot();
        this.signalLog = [...signalLog];
      };

      runtime.view.on('PROJECTION_UPDATED', sync);
      runtime.view.on('SNAPSHOT_UPDATED', sync);
      runtime.statusUnit.on('PROJECTION_UPDATED', sync);
      runtime.inspectorUnit.on('PROJECTION_UPDATED', sync);
      sync();
    },

    previousStage() {
      runtime.view.transition({ type: 'PREVIOUS_STAGE' });
    },

    nextStage() {
      runtime.view.transition({ type: 'NEXT_STAGE' });
    },

    goToStage(stageId) {
      runtime.view.transition({ type: 'ENTER_STAGE', stageId });
    },

    boostStatusUnit() {
      runtime.view.routeSignal({
        type: 'BOOST',
        payload: { amount: 1 },
      }, 'status-unit');
    },

    sendSiblingSignal() {
      runtime.statusUnit.emitSignal({
        type: 'CHILD_NOTE',
        payload: { note: 'Sibling signal arrived through GenericUnit routing.' },
      }, 'inspector-unit');
    },

    mirrorViewStage() {
      runtime.view.routeSignal({
        type: 'SET_VISUAL_STATUS',
        payload: {
          status: runtime.view.stage === 'export' ? 'ready' : 'active',
          badges: [runtime.view.stage],
        },
      }, 'inspector-unit');
    },

    requestSave() {
      runtime.view.receiveSignal({
        type: 'REQUEST_SAVE',
        payload: { label: `draft-${runtime.view.stage}` },
      });
    },

    requestExport() {
      runtime.view.receiveSignal({
        type: 'REQUEST_EXPORT',
        payload: { format: 'pdf' },
      });
    },

    requestPricing() {
      runtime.view.receiveSignal({
        type: 'REQUEST_PRICING',
        payload: {
          quantity: runtime.statusUnit.state.count || 0,
          unitPrice: 12,
        },
      });
    },

    requestRules() {
      runtime.view.receiveSignal({
        type: 'REQUEST_RULES',
        payload: {
          subtotal: runtime.view.derived.pricing?.subtotal ?? 0,
        },
      });
    },

    toggleDebug() {
      this.debugOpen = !this.debugOpen;
    },

    pretty(value) {
      return JSON.stringify(value, null, 2);
    },
  };
}
