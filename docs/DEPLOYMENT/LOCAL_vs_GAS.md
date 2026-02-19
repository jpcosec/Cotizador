# Local vs GAS

## Local Development

- Use: `npm run dev:local`
- Serves local harness at `http://localhost:8082/LOCAL_DEPLOYMENT.html`
- Uses local shim behavior and in-memory seeded runtime for fast iteration.

## GAS Deployment Runtime

- Use: `npm run build` then `clasp push`
- Build behavior:
  1. Bundle runtime (`dist/quotation-engine.iife.js`)
  2. Reset `gas/`
  3. Copy frontend templates from `packages/frontend`
  4. Generate `gas/Bundle_Runtime.html`
  5. Generate `gas/Code.gs` from database services/schema

## Source of Truth

- Frontend templates: `packages/frontend/*.html`
- GAS backend generation: `packages/database/src/services/*` + `src/Config/Config_Schema.js`
- Generated outputs: `gas/Bundle_Runtime.html`, `gas/Code.gs`

## Important Parity Rule

Frontend catalog and pricing runtime store must be hydrated from the same reference data source. XState context is the canonical runtime data holder.
