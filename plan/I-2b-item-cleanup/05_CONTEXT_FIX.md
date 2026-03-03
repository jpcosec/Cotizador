# Step 5: Context Delivery Fix + Wire Missing Machine Methods

## Intro

Two wiring issues in `createItemStandaloneComponent.js`:

1. **Zero-value bug**: `Number(value) || value` sends string `"0"` instead of number `0` when setting context values to zero (because `0` is falsy in JS).
2. **Missing methods**: The machine handles `SET_PROFILE_VALUE`, `SET_DEFAULT_QUANTITY`, `CLEAR_DEFAULT_QUANTITY` events (see `itemMachine.js` lines 51-67), but the component object doesn't expose methods to send them.

## Agent Instruction

Fix the zero-value parsing bug and add the 3 missing methods. This step is independent of Steps 2-4 (no schema changes needed).

## Objective

Context values are correctly parsed as numbers (including 0). All machine events can be triggered from the component API.

## Changes

### 5a. Fix zero-value bug in `createItemStandaloneComponent.js`

**Current** (line 102):
```javascript
setContext(key, value) {
  actor.send({ type: 'SET_CONTEXT', patch: { [key]: Number(value) || value } });
}
```

**Fixed**:
```javascript
setContext(key, value) {
  const n = Number(value);
  actor.send({ type: 'SET_CONTEXT', patch: { [key]: Number.isFinite(n) ? n : value } });
}
```

Why: `Number.isFinite(0)` is `true` → sends `0`. `Number.isFinite(NaN)` is `false` → passes string (for time values like `'21:30'`). Same pattern as `toNumber()` in `domain/pricing.js`.

Also apply the same fix to `setOverride()` (line 108):
```javascript
setOverride(key, value) {
  const n = Number(value);
  actor.send({ type: 'SET_OVERRIDE', key, value: Number.isFinite(n) ? n : value });
}
```

### 5b. Add missing methods to component object

Add after `resetOverrides()` (around line 110):

```javascript
// ── Profile & Init editing (used by sandbox resolver panel) ──
setProfileValue(key, value) {
  const n = Number(value);
  actor.send({ type: 'SET_PROFILE_VALUE', key, value: Number.isFinite(n) ? n : 0 });
},

setDefaultQuantity(key, value) {
  const n = Number(value);
  actor.send({ type: 'SET_DEFAULT_QUANTITY', key, value: Number.isFinite(n) ? n : 0 });
},

clearDefaultQuantity(key) {
  actor.send({ type: 'CLEAR_DEFAULT_QUANTITY', key });
},
```

### 5c. Consider extracting parse helper

Since the `Number.isFinite` pattern is now used in 4 places, extract a small helper at the top of the file:

```javascript
function parseInputValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}
```

Then all methods use `parseInputValue(value)` instead of repeating the pattern.

## Key Files

- `packages/components/item/logic/createItemStandaloneComponent.js` — all changes here

## Verification

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
npm test
```

Manual verification in sandbox:
1. Start dev server, open step-03 route
2. Set PAX Global to `0` → check state dump: `externalContext.paxGlobal` should be `0` (number), not `"0"` (string)
3. Set Duración to `0` → same check
4. Set Hora to `21:30` → should remain string `"21:30"`
