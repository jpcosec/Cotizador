# CotizadorLodge (v2)

Quotation system for SF Lodge events, deployed to Google Apps Script.

## Current Status

- Phase 3 stabilization in progress (frontend + runtime parity).
- Root integration tests: `3/3` passing (`npm run test:integration`).
- Build pipeline working: `npm run build` regenerates `gas/` from package sources.
- Architecture direction enforced:
  - Database owns data stores/adapters.
  - Pricing remains pure business logic.
  - XState orchestrates and keeps loaded data in machine context.

## Quick Start

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm install
npm run build
npm run test:integration
```

Local dev helper:

```bash
npm run dev:local
# then open http://localhost:8082/LOCAL_DEPLOYMENT.html
```

## Key Commands

- `npm run build` - bundle + full GAS regeneration.
- `npm run build:bundle` - rebuild IIFE only.
- `npm run build:gas` - reset `gas/`, copy templates, regenerate runtime and `Code.gs`.
- `npm run test:integration` - root merged integration tests.
- `npm run validate:local` - build + integration tests.

## Sources of Truth

- Frontend templates: `packages/frontend/*.html` + `packages/frontend/appsscript.json`
- GAS backend generation sources: `packages/database/src/**` + `src/Config/Config_Schema.js`
- Runtime bundle entry: `bundling/entry.js`

Generated on build (do not edit manually):

- `gas/Bundle_Runtime.html`
- `gas/Code.gs`

## Documentation Map

- Current plan: `PLAN.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
- Change history: `changelog.md`
- Full docs index: `docs/README.md`
- Package docs:
  - `docs/PACKAGES/database.md`
  - `docs/PACKAGES/pricing.md`
  - `docs/PACKAGES/xstate.md`
  - `docs/PACKAGES/frontend.md`

## Runtime Dependencies

- `xstate`
- `alpinejs`
- `json-logic-js` (used by pricing RulesEngine)
