# Phase 3 Issues And Blockers

## Current Status
- Date: 2026-02-18
- Scope: Alpine + XState integration for local deploy readiness
- State: Bridge and local actor bootstrap implemented; local static deploy still constrained by GAS templating model

## Issues Encountered

1. GAS template includes do not render on plain localhost
- Symptom: `Index.html` contains `<?!= include(...) ?>` tags that only GAS resolves.
- Impact: Static server (`python -m http.server`) serves raw tags, not composed page.
- Mitigation: Keep local-only runner strategy (bundle entry + local HTML path) instead of direct GAS template rendering.

2. `google.script.run` not available in browser-local runtime
- Symptom: Client code calling GAS APIs fails outside GAS.
- Impact: Catalog/client/save/load/PDF actions cannot use backend path locally.
- Mitigation: Keep machine-driven local path for basket/validation and add mocks/fallback for GAS calls when needed.

3. Port `8080` conflict during local run
- Symptom: `npm run dev:local` failed with `Address already in use`.
- Impact: Local server did not start on default port.
- Mitigation: switched local dev script to port `8081`.

4. Async actor-loader race condition
- Symptom: Bridge can initialize before `window.createCotizadorActor` is available.
- Impact: State machine mode silently disabled on first load.
- Mitigation: added retry loop in `initXStateBridge()` (10 attempts, 200ms interval).

5. Browser/Node module import mismatch for XState
- Symptom: importing xstate ESM path failed in Node tests with named export resolution error.
- Impact: local actor tests failed.
- Mitigation: test/runtime path in local actor now imports `xstate.cjs.mjs` compatible with Node ESM execution.

6. Load quotation flow is not fully wired in machine adapters
- Symptom: `LOAD_QUOTATION` path is still stubbed in orchestration adapter layer.
- Impact: frontend `cargarCotizacion()` remains on GAS path.
- Mitigation: keep current fallback and defer full machine-based load until adapter implementation is completed.

## Risks For Bundling Phase
- Cross-worktree imports (`frontend` -> `xstate` -> `pricing`) need stable alias/resolution.
- GAS HTML-template includes are not bundler-friendly directly; local bundle should target standalone browser entry.
- Any future adapter using Node-only APIs (fs/path) must stay out of browser bundle graph.

## Recommended Next Step
1. Produce standalone IIFE bundle with:
- `createCotizadorActor` (real xstate + pricing)
- `AlpineXStateBridge`
- global export (`window.QuotationEngine`)
2. Add local standalone HTML (non-GAS templates) that consumes the bundle for localhost validation.
