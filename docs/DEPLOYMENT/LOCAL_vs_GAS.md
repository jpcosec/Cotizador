# Local vs GAS

## Local Development

- Command: `npm run dev` (build + serve) or `npm run serve:gas` (serve only)
- URL: `http://localhost:8082`
- Renders the real GAS app (`gas/Index.html` with all includes processed)
- `google.script.run` replaced by `Local_GAS_Shim` using seeded `InMemoryStore`
- No Google Sheets, no network calls to GAS

See [local-development.md](./local-development.md) for full details.

## GAS Deployment

- Commands: `npm run build` then `clasp push`
- Build steps:
  1. Bundle runtime (`dist/quotation-engine.iife.js`)
  2. Reset `gas/`
  3. Copy frontend templates from `packages/frontend`
  4. Generate `gas/Bundle_Runtime.html`
  5. Generate `gas/Code.gs` from database services and schema
- GAS template engine processes `<?!= include() ?>` server-side
- `google.script.run` calls hit real GAS backend → Google Sheets

## Source of Truth

- Frontend templates: `packages/frontend/*.html`
- GAS backend generation: `packages/database/src/services/*` + `src/Config/Config_Schema.js`
- Generated (do not edit): `gas/Bundle_Runtime.html`, `gas/Code.gs`

## Parity Rule

Frontend catalog and pricing runtime store must be hydrated from the same
reference data source. XState context is the canonical runtime data holder.
