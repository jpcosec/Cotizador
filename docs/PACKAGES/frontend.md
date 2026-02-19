# Frontend Package

**Location:** `packages/frontend/`

## Purpose

Alpine.js UI layer and bridge integration with XState runtime.

- Main app store: `Stores_App.html`
- Bridge include: `Bridge_AlpineXState.html`
- Local dev shims: `Local_GAS_Shim.html`, `Local_XState_ActorLoader.html`
- Components: `Components_*.html`

## Current Boundary

- Frontend should not own persistence logic.
- It communicates through XState events and GAS APIs.
- Runtime data mismatch was addressed by hydrating actor store reference tables before catalog usage.

## Build Integration

- `packages/frontend/*.html` and `packages/frontend/appsscript.json` are source-of-truth templates.
- `npm run build:gas` resets `gas/` and copies these templates, then regenerates runtime/backend artifacts.

## Local Run

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run dev:local
```

Open: `http://localhost:8082/LOCAL_DEPLOYMENT.html`
