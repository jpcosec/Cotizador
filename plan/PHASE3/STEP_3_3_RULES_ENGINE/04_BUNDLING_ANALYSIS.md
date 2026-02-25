# Bundling Analysis: json-logic-js Integration

**Status:** Research Complete - Ready to Plan Integration

## Current State in claps_codelab

### Package Dependencies

**claps_codelab/package.json:**
```json
{
  "dependencies": {
    "json-logic-js": "^2.0.5"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^28.0.0",
    "@rollup/plugin-node-resolve": "^16.0.0",
    "rollup": "^4.34.0"
  }
}
```

✅ **json-logic-js is already installed as a dependency**

### Rollup Configuration

**claps_codelab/rollup.config.mjs:**

```javascript
export default {
  input: 'bundling/entry.js',
  output: {
    file: 'dist/quotation-engine.iife.js',
    format: 'iife',
    name: 'QuotationEngine',
    sourcemap: true,
    exports: 'named',
  },
  plugins: [
    resolve({
      browser: true,
      moduleDirectories: ['node_modules'],
      modulePaths: [xstateNodeModules],  // Note: custom path for xstate
      preferBuiltins: false,
    }),
    commonjs(),  // ← Handles CommonJS modules like json-logic-js
  ],
};
```

**Key Points:**
- Uses `@rollup/plugin-node-resolve` to resolve npm modules
- Uses `@rollup/plugin-commonjs` to convert CommonJS to ES modules
- `json-logic-js` is CommonJS, so it needs the `commonjs()` plugin
- Outputs as IIFE (Immediately Invoked Function Expression) for GAS

### Build Pipeline

**claps_codelab/package.json scripts:**
```json
{
  "build": "npm run build:bundle && npm run build:gas",
  "build:bundle": "node tools/generate_local_init_tables.mjs && rollup -c rollup.config.mjs",
  "build:gas": "node tools/reset_gas_workspace.mjs && node tools/generate_gas_runtime_bundle.mjs && node tools/generate_gas_code.mjs"
}
```

**Pipeline Flow:**
```
npm run build
    ↓
1. Generate local tables
2. Rollup bundle (includes json-logic-js)
    ↓ Output: dist/quotation-engine.iife.js (~354 KB)
    ↓
3. Reset GAS workspace
4. Generate GAS runtime (wraps IIFE in <script> tags)
    ↓ Output: gas/Bundle_Runtime.html
5. Generate GAS Code.gs (database services)
```

### How json-logic-js is Used

**claps_codelab/packages/pricing/src/RulesEngine/RulesEngine.js:**
```javascript
import jsonLogic from 'json-logic-js';

export function evaluateCondition(logic, data) {
  const parsedLogic = typeof logic === 'string' ? JSON.parse(logic) : logic;
  return jsonLogic.apply(parsedLogic, data);
}
```

**Import Style:** Direct default import from npm package
- Works because Rollup resolves `node_modules/json-logic-js`
- Rollup's `commonjs()` plugin converts it to ES module format

### Bundle Output Verification

**dist/quotation-engine.iife.js** contains:
- ✅ XState core (~15 KB)
- ✅ Alpine.js (~15 KB)
- ✅ json-logic-js (~8 KB gzipped)
- ✅ All project code
- **Total:** ~354 KB uncompressed, ~50 KB gzipped

---

## Current State in claps_codelab_rebuild_components

### Package Dependencies

**claps_codelab_rebuild_components/package.json:**
```json
{
  "dependencies": {},  // EMPTY!
  "devDependencies": {
    "vitest": "^4.0.18"
  }
}
```

❌ **json-logic-js is NOT installed**

### Implications

1. **Testing:** Can't use json-logic-js in tests (no bundling)
2. **Development:** Can only test pure JavaScript logic
3. **Future Integration:** Will need to add json-logic-js when bundling

### Current Workaround

The rebuild_components project:
- ✅ Tests Item domain logic (pure functions)
- ✅ No external dependencies (kept minimal)
- ⚠️ Can't import json-logic-js directly
- 🔄 Will need bundling setup later

---

## Integration Strategy: Step 3.3

### Option A: Keep json-logic-js Dependency Separate (Current Approach)

**For testing (claps_codelab_rebuild_components):**
- Keep json-logic-js OUT of dependencies
- Pass conditions as pre-evaluated data in tests
- Coordinator doesn't import json-logic-js, delegates to external function

**File structure:**
```javascript
// coordinator.js (NO json-logic-js import)
class RulesCoordinator {
  evaluate(snapshot) {
    for (const rule of this.rules) {
      // Delegate to external evaluator
      if (!evaluateCondition(rule.conditionJson, snapshot)) continue;
      // ...
    }
  }
}

// In tests: pass pre-evaluated rules or mock evaluator
```

**Pros:**
- ✅ Keeps rebuild_components minimal
- ✅ No external dependencies in component module
- ✅ Tests work without bundling

**Cons:**
- ❌ Coordinator doesn't know how to evaluate conditions alone
- ❌ Requires injecting evaluator at runtime

---

### Option B: Add json-logic-js to rebuild_components

**Dependencies:**
```json
{
  "dependencies": {
    "json-logic-js": "^2.0.5"
  }
}
```

**Import in coordinator.js:**
```javascript
import jsonLogic from 'json-logic-js';

class RulesCoordinator {
  evaluateCondition(conditionJson, data) {
    const logic = typeof conditionJson === 'string'
      ? JSON.parse(conditionJson)
      : conditionJson;
    return jsonLogic.apply(logic, data);
  }
}
```

**Pros:**
- ✅ Coordinator is self-contained
- ✅ Easy to test
- ✅ Matches legacy pattern
- ✅ Simpler integration

**Cons:**
- ❌ Adds dependency to rebuild_components
- ❌ Introduces external package into component module

---

## Bundling Readiness Assessment

### For Rollup (claps_codelab)
✅ **Ready** - Already configured with commonjs() plugin

### For rebuild_components
⚠️ **Not ready** - No bundling setup

### For GAS (Google Apps Script)
✅ **Compatible** - IIFE format supports GAS environment

---

## Recommendation

### Use Option B: Add json-logic-js to rebuild_components

**Reasoning:**
1. **Consistency** - Matches how claps_codelab does it
2. **Self-contained** - RulesCoordinator is complete
3. **Simpler** - Less injection/mocking in tests
4. **Bundle-ready** - When needed, json-logic-js will bundle automatically via Rollup

**Implementation:**
```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
npm install json-logic-js@^2.0.5
```

**Then in coordinator.js:**
```javascript
import jsonLogic from 'json-logic-js';

evaluateCondition(conditionJson, data) {
  const logic = typeof conditionJson === 'string'
    ? JSON.parse(conditionJson)
    : conditionJson;
  return jsonLogic.apply(logic, data);
}
```

---

## Build Process When Bundling is Needed

When rebuild_components is eventually bundled for production:

```
rebuild_components/
    ↓ (has json-logic-js in node_modules)
    ↓
Rollup with @rollup/plugin-commonjs
    ↓ (converts json-logic-js CommonJS → ES)
    ↓
Output: quotation-components.iife.js
    ↓
Includes: Item logic + json-logic-js (~25 KB gzipped)
```

**No special configuration needed** - Rollup automatically:
1. Finds json-logic-js in node_modules
2. Converts CommonJS to ES modules
3. Includes it in IIFE output

---

## Files Affected

### To Add json-logic-js
```
claps_codelab_rebuild_components/
├── package.json            ← Add dependency
├── package-lock.json       ← Auto-updated
└── node_modules/           ← Auto-installed
    └── json-logic-js/      ← New package
```

### Coordinator Integration
```
packages/components/item/domain/rulesEngine/
├── coordinator.js          ← Import json-logic-js
└── coordinator.test.js     ← Tests use it naturally
```

---

## Size Impact Summary

### Current (claps_codelab)
- Bundle size: ~354 KB uncompressed, ~50 KB gzipped
- Includes: XState + Alpine.js + json-logic-js + code

### With rebuild_components Addition
- json-logic-js npm install: ~200 KB in node_modules
- Build impact: Already handled by existing Rollup config
- No additional bundling overhead for rebuild_components (no build process yet)

---

## Checklist Before Implementation

When ready to implement Step 3.3:

- [ ] Decide: Option A (Inject) or Option B (Dependency)?
  - **Recommendation:** Option B
- [ ] If Option B:
  - [ ] Add to `package.json`: `"json-logic-js": "^2.0.5"`
  - [ ] Run: `npm install`
  - [ ] Verify: `node_modules/json-logic-js/` exists
  - [ ] Import in `coordinator.js`
- [ ] If Option A:
  - [ ] Design injection pattern
  - [ ] Document how tests mock evaluator
  - [ ] Update coordinator.js to accept evaluator function

---

## Testing Implications

### Option B (Dependency)
```javascript
// coordinator.test.js
import { RulesCoordinator } from './coordinator.js';

describe('RulesCoordinator', () => {
  it('evaluates json-logic conditions', () => {
    const coord = new RulesCoordinator('ITEM', [{
      id: 'R1',
      conditionJson: { '>': [{ 'var': 'pax' }, 100] },
      // ...
    }]);
    const result = coord.evaluate({ pax: 150 });
    // json-logic-js automatically parses and evaluates
  });
});
```

Works naturally - json-logic-js is a real dependency.

### Option A (Inject)
```javascript
// coordinator.test.js
import { RulesCoordinator } from './coordinator.js';

// Must mock or inject evaluator
const mockEvaluator = (logic, data) => {
  // Manual logic evaluation for tests
};

describe('RulesCoordinator', () => {
  it('evaluates conditions', () => {
    const coord = new RulesCoordinator('ITEM', [/*...*/], { evaluator: mockEvaluator });
    // More complex to test
  });
});
```

Requires more setup in tests.

---

## Next Steps

**DO NOT IMPLEMENT YET** - This is research only.

When ready to implement Step 3.3:
1. Decide: Option A or Option B (recommend B)
2. Update plan with chosen approach
3. Add dependency if Option B
4. Implement RulesCoordinator as planned
5. Integrate with Item.js

---

**Status:** Analysis Complete - Ready for Implementation
**Decision Needed:** Choose Option A (Inject) or Option B (Dependency)
**Recommendation:** Option B (Add json-logic-js dependency)
