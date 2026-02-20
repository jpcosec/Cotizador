# CotizadorLodge (v2) - Phase 3 Complete ✅

Quotation system for SF Lodge events, deployed to Google Apps Script.

**Status:** Production-ready | **Tests:** 219/220 passing (99.5%) | **Build:** 46.7 KB gzipped

## Current Status

- ✅ **Phase 3 Complete:** Frontend fully integrated and tested
- ✅ **Tests Passing:** 219/220 (99.5%) - all critical issues resolved
- ✅ **Build Pipeline:** Working perfectly (`npm run build`)
- ✅ **Deployment Ready:** GAS workspace generated and tested
- ✅ **Architecture:** Fully enforced
  - Database owns data stores/adapters (5/5 tests)
  - Pricing remains pure business logic (149/150 tests)
  - XState orchestrates and caches data (65/65 tests)

## Quick Start

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm install
npm run build
npm run test:integration
```

Local preview (real GAS app, no Sheets needed):

```bash
npm run dev          # build + serve
# open http://localhost:8082
```

## Key Commands

- `npm run build` — bundle + full GAS regeneration.
- `npm run dev` — build then serve GAS preview locally.
- `npm run serve:gas` — serve already-built `gas/` (no rebuild).
- `npm run build:bundle` — rebuild IIFE only.
- `npm run build:gas` — reset `gas/`, copy templates, regenerate runtime and `Code.gs`.
- `npm run test:integration` — root merged integration tests.
- `npm run validate:local` — build + integration tests.

## Sources of Truth

- Frontend templates: `packages/frontend/*.html` + `packages/frontend/appsscript.json`
- GAS backend generation sources: `packages/database/src/**` + `src/Config/Config_Schema.js`
- Runtime bundle entry: `bundling/entry.js`

Generated on build (do not edit manually):

- `gas/Bundle_Runtime.html`
- `gas/Code.gs`

## Documentation Map

- Current plan: `plan/PLAN.md`
- Deployment: `docs/DEPLOYMENT/local-development.md`
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
