# Local Development

The local server renders the real GAS app — the same `Index.html` and all its
`<?!= include() ?>` template directives — by processing them in Node.js before
serving. The `Local_GAS_Shim` replaces `google.script.run` with local
implementations backed by the seeded `InMemoryStore`. No Google Sheets needed.

## Run locally

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build       # generate gas/ from packages/frontend + bundle
npm run serve:gas   # http://localhost:8082
```

Or both in one step:

```bash
npm run dev
```

Open: `http://localhost:8082`

## How it works

```
tools/serve-gas.mjs
  └── reads gas/Index.html
  └── inlines every <?!= include('Name'); ?> recursively
  └── serves the combined HTML on port 8082

Browser receives:
  Bundle_Runtime.html   ← IIFE with XState + Alpine + bridge
  Local_XState_ActorLoader.html  ← creates actor with seeded InMemoryStore
  Local_GAS_Shim.html   ← stubs google.script.run with local data
  Bridge_AlpineXState.html  ← wires actor → Alpine store
  Stores_App.html       ← Alpine cotizadorApp() component
```

The `Local_GAS_Shim` serves catalog, clientes, and pricing reference data from
`window.localCatalogItems` / `window.localClientes` / `window.localPricingReferenceData`,
which the actor loader populates from the seeded store.

## Deploy to GAS

```bash
npm run build   # regenerates gas/
clasp push      # uploads gas/ to Apps Script
```

Then in the GAS editor run `initializeSheetDb()` if first deploy.

## Source of truth

Edit these, never `gas/` directly (it is fully regenerated on every build):

| What | Where |
|------|-------|
| HTML templates | `packages/frontend/*.html` |
| GAS shims | `packages/frontend/Local_GAS_Shim.html`, `Local_XState_ActorLoader.html` |
| Backend code | `packages/database/src/services/*.js` |
| Schema | `src/Config/Config_Schema.js` |
| Bundle entry | `bundling/entry.js` |

## Troubleshooting

**Port in use**
```bash
lsof -ti:8082 | xargs kill
npm run serve:gas
```

**Stale GAS files**
```bash
npm run build   # always wipes and recreates gas/
```
