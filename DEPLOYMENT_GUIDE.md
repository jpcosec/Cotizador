# Local Deployment Guide

This guide reflects the current build pipeline and local workflow.

## What `npm run build` does now

From `claps_codelab/package.json`:

1. `build:bundle`
   - Builds `dist/quotation-engine.iife.js` (Rollup IIFE bundle).

2. `build:gas`
   - Deletes and recreates `gas/`.
   - Copies frontend templates from `packages/frontend/*.html` into `gas/*.html`.
   - Copies `packages/frontend/appsscript.json` into `gas/appsscript.json`.
   - Regenerates `gas/Bundle_Runtime.html` from the bundle.
   - Regenerates `gas/Code.gs` from `packages/database` services and `src/Config/Config_Schema.js`.

This means `packages/frontend` is the source of truth for GAS HTML templates.

## Local testing modes

### 1) Fast runtime smoke test (debug harness)

Use this when you want quick checks of actor wiring and pricing execution.

- Build assets:

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
```

- Serve files:

```bash
npm run serve:dist
```

- Open:

```text
http://localhost:8082/LOCAL_DEPLOYMENT.html
```

Notes:
- This is a diagnostic harness, not full GAS template rendering parity.
- Use it for quick checks, not final deployment confidence.

### 2) CI-style local validation

Use this for repeatable local verification before deploy:

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run validate:local
```

This runs a full build plus integration checks.

## Generated artifacts (do not hand-edit)

- `gas/Code.gs`
- `gas/Bundle_Runtime.html`

Both are generated and overwritten on each build.

## Source-of-truth files (edit these)

- Frontend GAS templates:
  - `packages/frontend/Index.html`
  - `packages/frontend/Stores_App.html`
  - `packages/frontend/Components_*.html`
  - `packages/frontend/Styles_Global.html`
  - `packages/frontend/Bridge_AlpineXState.html`
  - `packages/frontend/Local_GAS_Shim.html`
  - `packages/frontend/Local_XState_ActorLoader.html`
  - `packages/frontend/appsscript.json`

- Backend/service-side generation sources:
  - `packages/database/src/services/*.js`
  - `packages/database/src/stores/GasSheetStore.js`
  - `packages/database/src/ModelFactory.js`
  - `src/Config/Config_Schema.js`

## Deploy to GAS

After local validation:

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
clasp push
```

Then run your initialization entrypoint in GAS if needed (for example `initializeSheetDb()`).

## Troubleshooting

### Bundle not loading

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
ls -lh dist/quotation-engine.iife.js
```

### GAS files look stale

Run full build (not only bundle):

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
```

`build:gas` always recreates `gas/`, so stale HTML drift should be removed.

### Port 8082 busy

```bash
pkill -f "http.server 8082"
npm run serve:dist
```

## Current caveat

There is still a runtime data-source mismatch to resolve in actor initialization (bundle actor store seed vs GAS catalog source). The build pipeline is now consistent for generated files, but runtime data unification still needs to be finalized.
