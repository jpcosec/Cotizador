# Testing (Current)

## Primary Test Commands

From `claps_codelab`:

```bash
cd /home/jp/CotizadorLodge/claps_codelab && npm run validate:local

cd /home/jp/CotizadorLodge/claps_codelab/packages/database && npm test
cd /home/jp/CotizadorLodge/claps_codelab/packages/pricing && npm test
cd /home/jp/CotizadorLodge/claps_codelab/packages/xstate && npm test
cd /home/jp/CotizadorLodge/claps_codelab/packages/frontend && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

## Testing Strategy

- Module tests validate layer behavior in isolation.
- Integration tests validate merged actor + bridge behavior in `bundling/tests`.
- Keep deterministic assumptions explicit for future replay/event-sourcing work.

## Minimum Pre-Change Gate

- A change touching one module must pass that module tests.
- Changes touching orchestration/runtime boundaries must also pass `npm run test:integration`.

## Priority Gaps

- Add integrated test for load/edit/save quotation flow.
- Add deterministic injection tests (`Clock`/`IdGenerator`) before replay implementation.

See `../TODO_ACTIVE_NON_LEGACY.md`.
