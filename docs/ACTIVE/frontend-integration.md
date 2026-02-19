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

## Canonical Local Validation Flow

From `claps_codelab`:

```bash
npm run validate:local
```

This is the single local gate for runtime parity:

1. Build integrated bundle and GAS runtime include.
2. Run merged integration tests in `bundling/tests`.

## Known Open Items

- Reduce remaining direct `google.script.run` fallback usage to machine-first flows where feasible.
- Keep GAS and package frontend HTML entry files aligned to avoid drift.

See `../TODO_ACTIVE_NON_LEGACY.md`.
