# GAS Workflow

## Purpose

This project ships as a Google Apps Script web app, but it is developed from source files in `src/`, generated into `gas/`, previewed locally through a GAS shim, and only then pushed to Apps Script.

This document is the current end-to-end reference for:

- what GAS means in this repo
- how local GAS preview works
- how builds generate deployable artifacts
- what must be configured for real deployment
- how to validate the app before pushing

## Mental Model

There are three relevant runtime surfaces:

1. `src/` and `gas/scripts/` - source of truth
2. local GAS preview - Node server that simulates the Apps Script boundary
3. real GAS deployment - generated `gas/` files pushed with `clasp`

The important rule is:

```text
edit source -> test -> build -> preview locally as GAS -> push generated gas/ -> deploy web app
```

## Key Directories

- `src/` - application logic, runtime units, pricing, rules, state
- `playground/` - isolated runtime and UI experiments
- `dist/` - bundled browser runtime
- `gas/` - generated GAS deployment workspace
- `gas/scripts/` - build-time generators and GAS-facing adapters
- `tools/serve-local.mjs` - local GAS preview server
- `tools/localPersistenceStore.js` - local persistence backend used by the GAS shim
- `data/db.json` - disk-backed local persistence store
- `.clasp.json` - Apps Script project binding

## Commands

### Core Commands

```bash
npm test
npm run build
npm run serve:local
npm run dev:gas
```

### What They Do

- `npm test` runs the full Vitest suite
- `npm run build` builds the browser bundle and regenerates `gas/`
- `npm run serve:local` serves the generated GAS app at `http://localhost:8082`
- `npm run dev:gas` builds first, then starts the local GAS preview

## Build Pipeline

`npm run build` is split into two phases.

### Bundle Phase

```bash
npm run build:bundle
```

What happens:

- `gas/scripts/generate_local_init_tables.mjs` regenerates local initialization tables
- Rollup bundles the browser runtime into `dist/quotation-engine.iife.js`

### GAS Generation Phase

```bash
npm run build:gas
```

What happens:

- `gas/scripts/reset_gas_workspace.mjs` resets generated GAS outputs
- `gas/scripts/generate_gas_runtime_bundle.mjs` writes `gas/Bundle_Runtime.html`
- `gas/scripts/generate_gas_code.mjs` writes `gas/Code.gs`
- template generation recreates the GAS HTML includes such as `gas/Index.html`, `gas/Sidebar.html`, `gas/Timeline.html`, `gas/ItemList.html`, and `gas/Modals.html`

Important rule:

- do not manually edit generated files in `gas/`
- regenerate them from source with `npm run build`

## Local GAS Preview

The local GAS preview is implemented in `tools/serve-local.mjs`.

### What It Simulates

- GAS `doGet()`-style HTML serving
- GAS include expansion
- a `google.script.run`-like server boundary
- disk-backed persistence instead of live Apps Script + Sheets

### How It Works

`tools/serve-local.mjs`:

- reads `gas/Index.html`
- recursively expands `<?!= include('...'); ?>` includes from `gas/*.html`
- injects the local GAS shim if present
- serves the page at `http://localhost:8082`
- handles local RPC calls at `POST /api/google-script-run`

That RPC endpoint delegates to local method execution through `tools/localPersistenceStore.js`.

## Local Persistence

In local preview mode, persistence is disk-backed.

- local database file: `data/db.json`
- server entry: `tools/localPersistenceStore.js`

This exercises the same persistence boundary shape as GAS, without needing Apps Script during development.

## Real GAS Backend Shape

The generated backend entrypoint is `gas/Code.gs`.

It contains:

- `doGet()`
- `include(filename)`
- `healthcheck()`
- quotation persistence methods:
  - `guardarCotizacionV2`
  - `cargarCotizacionV2`
  - `buscarCotizacionesV2`
  - `getReferenceDataV2`

## Spreadsheet Configuration

Real GAS persistence needs a spreadsheet target.

The generated backend reads script property `COTIZADOR_SHEET_ID`.

Behavior:

- if `COTIZADOR_SHEET_ID` exists, GAS opens that spreadsheet
- otherwise it tries `SpreadsheetApp.getActiveSpreadsheet()`
- if neither works, persistence fails

So production deploy readiness requires one of:

1. a configured `COTIZADOR_SHEET_ID` script property
2. a script bound to the intended spreadsheet

## Real Deployment With Clasp

This repo is already bound to an Apps Script project via `.clasp.json`.

Current binding:

- root dir: `gas`
- Apps Script project id stored in `dev/.clasp.json`

### Typical Deploy Sequence

```bash
npm test
npm run build
clasp push
```

Then in Apps Script:

- open the project
- confirm script properties are correct
- update or deploy the Web App
- verify the live URL against the real Sheets backend

## Validation Workflow

The current completion gate for GAS-facing work is:

```bash
npm test
npm run build
node tools/userFlowRunner.mjs
```

`user_flow.json` drives the full quotation lifecycle against the local GAS preview at `http://localhost:8082`.

Evidence is written to `auto_user_test/`, especially `auto_user_test/report.json`.

## Recommended Day-To-Day Workflow

### For source changes

```bash
npm test
```

### For GAS UI or full-flow changes

```bash
npm run build
npm run serve:local
```

Then open `http://localhost:8082`.

### For final local validation

```bash
node tools/userFlowRunner.mjs
```

### For real deployment

```bash
npm test
npm run build
clasp push
```

## Common Failure Modes

### App works in tests but fails in local GAS preview

Likely causes:

- generated `gas/` files are stale
- build was not rerun after source changes
- Alpine template/runtime mismatch in generated HTML

Fix:

```bash
npm run build
```

### App works locally but save/load fails in real GAS

Likely causes:

- `COTIZADOR_SHEET_ID` missing or wrong
- script not bound to intended spreadsheet
- deployment permissions or execution identity mismatch

### Generated GAS code looks wrong

Likely causes:

- source-of-truth changed but generators were not rerun
- manual edits were made in `gas/`

## Current Status

As of the current runtime redesign completion:

- local GAS preview works
- full quotation lifecycle passes through `user_flow.json`
- generated `gas/` artifacts build cleanly
- the remaining deployment-specific step is a real `clasp push` plus live Apps Script environment verification

## Related Docs

- `docs/ARCHITECTURE/current-architecture.md`
- `desk/drawers/objective-design/gas-platform-constraints.md`
- `project_topology.md`
