# Pricing Package

**Location:** `packages/pricing/`

## Purpose

Pure pricing + rules logic. No direct persistence.

- Pipeline: `src/Pricing/*`
- Rules engine: `src/RulesEngine/*`
- Uses `json-logic-js` for condition evaluation in rules.

For a detailed breakdown of how the rules system works, see [docs/ARCHITECTURE/rules-engine.md](../ARCHITECTURE/rules-engine.md).

## Architectural Boundary

- Pricing must not load data from DB adapters directly.
- Required data (catalog, categories, profiles, rules, compositions) should be passed in by XState/runtime context.
- Test mocks/scaffolding live under `tests/mock/` (not package runtime root).

## Current Notes

- Root build bundles pricing from `bundling/entry.js`.
- `json-logic-js` is installed at root to avoid unresolved bundle externals.

## Tests

Run:

```bash
cd /home/jp/CotizadorLodge/claps_codelab/packages/pricing
npm test
```

If `vitest` is missing, run `npm install` in this package first.
