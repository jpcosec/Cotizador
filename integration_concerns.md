# Integration Concerns: Alpine.js + XState Compatibility

**Document Date**: 2026-02-18
**Status**: Architecture Analysis
**Scope**: Google Apps Script frontend + XState v5 state machine integration

---

## 1. Alpine.js Reactivity Model vs XState Architecture

### 1.1 Alpine.js Reactivity (Current)

Alpine.js uses **JavaScript Proxies** to implement fine-grained reactivity:

```js
function cotizadorApp() {
  return {
    carrito: [],           // Direct Alpine reactive property
    paxGlobal: 10,
    get totalNeto() {      // Computed property via getter
      return this.carrito.reduce((sum, item) => sum + item.total, 0);
    },
    agregarItem(item) {
      this.carrito.push(item);  // Mutation triggers reactivity
    }
  };
}
```

**How Alpine works:**
- Alpine wraps the returned object in a **Proxy**
- Property reads/writes trigger getter/setter traps
- When a property changes, Alpine re-evaluates directives that depend on it
- This is **fine-grained**: only affected DOM elements re-render
- Works well with **mutable state** and **imperative updates**

### 1.2 XState Architecture (Target)

XState uses **immutable snapshots** and **event-driven transitions**:

```js
const actor = createActor(quotationMachine, {
  input: { store: gasStore }
});

actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_001' });

actor.subscribe(snapshot => {
  console.log(snapshot.value);      // Current state node path
  console.log(snapshot.context);    // Immutable context object
});
```

**How XState works:**
- Events are sent to the actor
- The actor's **state machine** processes the event and produces a new state
- Subscribers receive an immutable **snapshot** containing `{ value, context, ... }`
- Subscribers must be **manually updated**
- State is **derived** from a pure state machine, not mutated directly

### 1.3 Fundamental Incompatibility

| Aspect | Alpine | XState |
|--------|--------|--------|
| **State mutation** | Direct (imperative) | Event-based transitions (declarative) |
| **Reactivity** | Proxy-based (automatic) | Subscriber-based (manual) |
| **Change detection** | Property assignment | Event processing → snapshot emission |
| **Undo/redo** | Difficult (no history) | Built-in (snapshot queue) |
| **Testability** | Tied to DOM | Pure functions, easily tested |

**The challenge:** Alpine expects to mutate state imperatively (`this.carrito.push(...)`), while XState expects to send events (`actor.send({ type: 'ADD_ITEM' })`). These are **opposite paradigms**.

---

## 2. Bridging Approaches

### 2.1 **Option A: XState as State Container, Alpine as UI Layer** (Recommended)

Replace Alpine's reactive state with XState, but keep Alpine for DOM binding:

```js
function cotizadorApp() {
  const actor = window.QuotationService.createActor();

  // Bridge object that Alpine can mutate
  const state = {
    lineas: [],
    totals: { subtotal: 0, taxes: [], total: 0 },
    machineState: 'idle',

    init() {
      // Subscribe to XState changes
      actor.subscribe(snapshot => {
        // Copy immutable context to Alpine reactive object
        this.lineas = snapshot.context.lineas || [];
        this.totals = snapshot.context.totals || {};
        this.machineState = snapshot.value;
      });
      actor.start();
    },

    // UI actions dispatch to XState, not mutate directly
    agregarItem(itemId) {
      actor.send({ type: 'ADD_ITEM', itemId });
      // Don't push to this.carrito directly!
    },

    actualizarCantidad(lineId, cantidad) {
      actor.send({ type: 'UPDATE_ITEM', lineId, overrides: { Override_Pax: cantidad } });
    }
  };

  return state;
}
```

**Pros:**
- ✅ Alpine still handles DOM reactivity (fast re-renders)
- ✅ XState manages all business logic (testable, reproducible)
- ✅ Clear separation: Alpine ≈ view, XState ≈ model
- ✅ Can test XState independently of Alpine

**Cons:**
- ⚠️ State duplication (XState context + Alpine object)
- ⚠️ Must manually subscribe and copy properties
- ⚠️ Potential sync issues if copying is incomplete

### 2.2 **Option B: Full XState, Thin Alpine Layer**

Remove most of Alpine's state management; Alpine becomes only a rendering engine:

```js
// Components subscribe directly to actor
document.addEventListener('alpine:init', () => {
  Alpine.data('carrito', () => {
    let unsubscribe = null;

    return {
      lineas: [],

      init() {
        unsubscribe = window.actor.subscribe(snapshot => {
          this.lineas = snapshot.context.lineas;
          // Alpine re-renders due to property change
        });
      },

      destroy() {
        unsubscribe?.();
      }
    };
  });
});
```

Then in HTML:
```html
<div x-data="carrito()">
  <template x-for="linea in lineas">
    <div x-text="linea.nombre"></div>
  </template>
</div>
```

**Pros:**
- ✅ Cleaner separation (XState owns all state)
- ✅ No state duplication
- ✅ Alpine is truly just a rendering layer

**Cons:**
- ⚠️ More boilerplate (subscriptions in every component)
- ⚠️ Potential memory leaks if unsubscribe isn't called
- ⚠️ Harder to debug (state spread across components)

### 2.3 **Option C: XState on Server (Google Apps Script), Alpine on Client**

Run the actor on the **GAS server side**, not the browser:

```js
// In GAS server (server.gs)
global.quotationActor = createActor(quotationMachine, { input: { store: gasStore } });

function sendMachineEvent(eventType, data) {
  global.quotationActor.send({ type: eventType, ...data });
  return getSnapshot();
}

function getSnapshot() {
  return global.quotationActor.getSnapshot();
}

// Client-side Alpine (Index.html)
async function agregarItem(itemId) {
  const snapshot = await google.script.run.sendMachineEvent('ADD_ITEM', { itemId });
  this.lineas = snapshot.context.lineas;
  this.totals = snapshot.context.totals;
}
```

**Pros:**
- ✅ No browser bundling needed
- ✅ Server owns state (easier to persist)
- ✅ Alpine stays simple

**Cons:**
- ❌ Every state change = network round trip (500ms+ latency)
- ❌ Poor UX (UI freezes during transitions)
- ❌ Harder to test (requires mock GAS runtime)

---

## 3. Bundling Challenges for Google Apps Script

### 3.1 Current Frontend Structure

```
claps_codelab_frontend/
├── Index.html              # Loads Alpine via CDN
├── Components_*.html       # Template includes
├── Stores_App.html         # Global state function
└── Styles_Global.html      # CSS
```

**No `package.json`, no build system, no modules.**

XState and the pricing pipeline are in **separate repos** and written as ES modules:
- `/home/jp/claps_codelab_xstate/src/` (ES modules, imports from pricing)
- `/home/jp/claps_codelab_pricing/src/` (ES modules, pricing rules)

### 3.2 Bundling Strategy

To use XState in GAS, you must:

1. **Create a bundler config** (Vite or Rollup):
   - Entry: `/home/jp/claps_codelab_xstate/src/index.js` + `/home/jp/claps_codelab_pricing/src/index.js`
   - Output: Single `.js` file (IIFE) that exports globals
   - Target: browser (ES2020+)

2. **Example with Rollup:**

```js
// rollup.config.js
export default {
  input: 'src/index.js',
  external: [],  // Bundle everything
  output: {
    file: 'dist/xstate-bundle.iife.js',
    format: 'iife',
    name: 'QuotationXState',
    globals: {}
  },
  plugins: [
    nodeResolve({ preferBuiltins: false }),
    commonjs()
  ]
};
```

3. **Size concerns:**
   - XState v5 core: ~30KB minified
   - Pricing pipeline (estimated): ~20KB
   - Total: ~50KB (before gzip) → ~15-20KB gzipped
   - GAS HTML limit: 200KB per file
   - ✅ **Feasible**, but leaves little room for other libraries

4. **Deployment to GAS:**
   ```html
   <!-- In Index.html -->
   <script><?!= HtmlService.createHtmlOutput(
       Utilities.getBlob('dist/xstate-bundle.iife.js').getDataAsString()
     ).getHtml() ?>
   </script>
   ```

### 3.3 Cross-Project Import Problem

**Issue:** `/home/jp/claps_codelab_xstate/src/` imports from `../../../../claps_codelab_pricing/src/`

This assumes a specific directory structure that may not exist when bundling. Solutions:

1. **Monorepo approach** (recommended):
   ```
   claps_codelab-monorepo/
   ├── packages/xstate/
   ├── packages/pricing/
   └── packages/frontend/
   ```
   Use workspaces in `package.json`.

2. **Alias in bundler config:**
   ```js
   alias: {
     '@pricing': '/home/jp/claps_codelab_pricing/src/'
   }
   ```

3. **Merge pricing into xstate repo:**
   Copy pricing code into xstate project to avoid external imports.

---

## 4. Compatibility Layer Implementation

### 4.1 Proposed Bridge: `AlpineXStateBridge`

Create a thin compatibility layer that mediates between Alpine and XState:

```js
class AlpineXStateBridge {
  constructor(actor) {
    this.actor = actor;
    this.snapshot = actor.getSnapshot();
    this.reactiveState = {};
    this._syncProperties();
  }

  _syncProperties() {
    // Identify which context properties to expose to Alpine
    const exposedKeys = [
      'lineas', 'totals', 'quotation', 'messages', 'errors',
      'databaseOpen', 'selectedRowData'
    ];

    exposedKeys.forEach(key => {
      this.reactiveState[key] = this.snapshot.context[key];
    });
  }

  // Subscribe to state changes and update reactive object
  start() {
    this.actor.subscribe(snapshot => {
      this.snapshot = snapshot;
      this._syncProperties();
      // Trigger Alpine update manually if needed
      this._notifyAlpine();
    });
    this.actor.start();
  }

  // User actions dispatch to state machine
  send(type, data) {
    this.actor.send({ type, ...data });
  }

  // Computed properties derived from snapshot
  get machineState() {
    return this.snapshot.value;
  }

  get isInBasket() {
    return this.snapshot.value === 'basket';
  }

  get totalNeto() {
    return this.snapshot.context.totals?.subtotal || 0;
  }

  get totalFinal() {
    return this.snapshot.context.totals?.total || 0;
  }

  _notifyAlpine() {
    // Trigger Alpine's reactivity system
    // This depends on how Alpine is initialized
  }
}
```

Usage in frontend:
```js
function cotizadorApp() {
  const bridge = new AlpineXStateBridge(window.QuotationXState.createActor());

  return {
    ...bridge.reactiveState,

    init() {
      bridge.start();
    },

    agregarItem(itemId) {
      bridge.send('ADD_ITEM', { itemId });
    },

    get totalFinal() {
      return bridge.totalFinal;
    }
  };
}
```

---

## 5. Testing Strategy with Mocks

### 5.1 Mock Data Structures

Since XState and pricing modules are in separate repos, define mock interfaces:

```js
// mocks/MockPricingPipeline.js
export const mockPricingPipeline = {
  calculateLinePrice(item, context) {
    // Simplified: Base * Pax
    return (item.precio_base || 0) * (context.paxGlobal || 10);
  },

  calculateTaxes(subtotal) {
    return [{ nombre: 'IVA', tasa: 0.19, monto: subtotal * 0.19 }];
  }
};

// mocks/MockStore.js
export class MockStore {
  constructor() {
    this.data = {};
  }

  seed(table, rows) {
    this.data[table] = rows;
  }

  all(table) {
    return this.data[table] || [];
  }

  findById(table, id) {
    return this.all(table).find(r => r[Object.keys(r)[0]] === id);
  }

  insert(table, row) {
    this.data[table] = this.data[table] || [];
    this.data[table].push(row);
    return row;
  }
}
```

### 5.2 Testing Alpine Integration

```js
// tests/alpine-xstate.test.js
import { describe, it, expect } from 'vitest';
import { AlpineXStateBridge } from '../src/AlpineXStateBridge.js';
import { mockActor } from './mocks/MockActor.js';

describe('AlpineXStateBridge', () => {
  it('syncs actor state to reactive properties', () => {
    const actor = mockActor({
      lineas: [{ ID_Linea: 1, nombre: 'Item 1', precio: 100 }],
      totals: { subtotal: 1000, total: 1190 }
    });

    const bridge = new AlpineXStateBridge(actor);

    expect(bridge.reactiveState.lineas).toHaveLength(1);
    expect(bridge.totalFinal).toBe(1190);
  });

  it('dispatches user actions to actor', () => {
    const actor = mockActor();
    const bridge = new AlpineXStateBridge(actor);

    bridge.send('ADD_ITEM', { itemId: 'ITEM_001' });

    expect(actor.send).toHaveBeenCalledWith({
      type: 'ADD_ITEM',
      itemId: 'ITEM_001'
    });
  });
});
```

### 5.3 Testing in Isolated Worktrees

Create separate test configurations per component:

```
claps_codelab-frontend/
├── src/
│   ├── alpine/
│   │   └── Stores_App.html
│   └── bridge/
│       └── AlpineXStateBridge.js
├── tests/
│   ├── alpine.test.js      # Test Alpine alone with mocks
│   ├── bridge.test.js      # Test bridge with mock XState
│   ├── integration.test.js # Test Alpine + bridge + mock state machine
│   └── mocks/
│       ├── MockActor.js
│       ├── MockStore.js
│       └── MockPricingPipeline.js
└── worktrees/
    ├── alpine-only/        # Test Alpine with mock state
    ├── bridge-only/        # Test bridge with mock actor
    └── full-integration/   # Test with real imports from xstate repo
```

---

## 6. GAS-Specific Concerns

### 6.1 Google Apps Script Limitations

1. **No native ES modules**: Import/export not supported
   - Workaround: Use bundled IIFE
2. **No top-level await**: Async code must use callbacks
   - Workaround: Use `.catch()` instead of try/catch
3. **Network latency**: `google.script.run.*` calls take 200-500ms
   - Workaround: Batch state machine events, cache results
4. **Quotas**: Limited execution time (6 min), memory (50MB per actor)
   - Workaround: Keep state machine lightweight
5. **Sandboxing**: Code runs in a restricted environment
   - Workaround: No filesystem access, no arbitrary npm modules

### 6.2 GASStore Adapter Interface

```js
class GASStore {
  async seed(table, rows) {
    return google.script.run.withSuccessHandler(r => r)
      .withFailureHandler(e => { throw e; })
      .storeSeed(table, rows);
  }

  async all(table) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .storeAll(table);
    });
  }

  async findById(table, id) {
    return google.script.run
      .withSuccessHandler(r => r)
      .withFailureHandler(e => { throw e; })
      .storeFindById(table, id);
  }
}
```

---

## 7. Recommendation Matrix

| Scenario | Recommended Approach | Rationale |
|----------|---------------------|-----------|
| **Keep GAS backend** | Option A + Mock pricing | Minimal changes, familiar setup |
| **Test Alpine independently** | Mock XState actor | Fast feedback loop |
| **Test bridge logic** | Mock both actor + Alpine | Pure function testing |
| **Full integration test** | Real XState (monorepo) | Verify end-to-end flow |
| **Production deployment** | Option A + bundled XState | Good UX + testability balance |

---

## 8. Implementation Roadmap

1. ✅ **Phase 0 (Current)**: Analyze compatibility → Document concerns
2. **Phase 1**: Create AlpineXStateBridge + mock interfaces
3. **Phase 2**: Write tests for bridge + mocks (in this repo, no external deps)
4. **Phase 3**: Setup monorepo structure to coordinate xstate + pricing + frontend
5. **Phase 4**: Bundle XState + pricing into IIFE
6. **Phase 5**: Integrate bridge into Stores_App.html
7. **Phase 6**: Update components to use bridge properties
8. **Phase 7**: Deploy to GAS and test end-to-end

---

## 9. Open Questions

- [ ] Do we keep GAS as backend or migrate to Node.js/Express?
- [ ] Should pricing module be merged into xstate repo or remain separate?
- [ ] Do we use Option A, B, or C for the bridge?
- [ ] What test coverage threshold do we target?
- [ ] When do we introduce the bundler to the xstate project?

