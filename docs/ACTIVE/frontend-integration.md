# Frontend Integration (Current)

## Module

- Path: `packages/frontend`
- Bridge: `src/Bridge/AlpineXStateBridge.js`
- Local actor bootstrap: `src/Local/createCotizadorActor.local.js`

## Responsibilities

- Sync actor snapshots to Alpine-compatible state.
- Provide event dispatch helpers and guard-aware interaction points.
- Support local and GAS runtime integration through bundled exports.

## Integration Surface

- Exported through integrated runtime (`window.QuotationEngine`) via `bundling/entry.js`.
- Consumes xstate actor and pricing/database behavior indirectly through the actor.

## Environment Notes

- GAS HTML templates (`<?!= include(...) ?>`) do not render on plain local static servers.
- Local validation should use standalone bundle/runtime paths.
- Browser runtime cannot rely on `google.script.run` unless running inside GAS.

## Known Open Items

- Remove fragile deep import paths in actor bootstrap/integration helpers.
- Unify one canonical local run path equivalent to integrated runtime behavior.
- Complete machine-native quotation load flow to avoid fallback-only paths.

See `../TODO_ACTIVE_NON_LEGACY.md`.
