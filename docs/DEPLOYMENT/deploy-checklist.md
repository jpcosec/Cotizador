# Deploy Checklist

## Purpose

This is the operational checklist for pushing the current app to Google Apps Script.

## Before Push

Run:

```bash
npm test
npm run build
node tools/userFlowRunner.mjs
```

All three should pass before deploy.

## Confirm Generated Outputs

Make sure these exist and are current:

- `dist/quotation-engine.iife.js`
- `gas/Bundle_Runtime.html`
- `gas/Code.gs`
- `gas/Index.html`

## Confirm Apps Script Binding

Check:

- `dev/.clasp.json`

Make sure:

- the `scriptId` is the intended Apps Script project
- `rootDir` is `gas`

## Confirm Spreadsheet Configuration

In Apps Script, verify one of:

1. script property `COTIZADOR_SHEET_ID` is configured correctly
2. the script is bound to the intended spreadsheet

Without this, real persistence will fail.

## Push

Run:

```bash
clasp push
```

## Deploy or Update Web App

In the Apps Script editor:

- open the target project
- update or create a Web App deployment
- confirm execution identity and access settings

## Live Smoke Test

After deploy, verify at minimum:

- app loads
- client selection works
- catalog can add an item
- validation screen renders
- export works
- save works
- completed state appears
- load/search still works if applicable

## If Save Fails In Live GAS

Check first:

- `COTIZADOR_SHEET_ID`
- spreadsheet permissions
- Apps Script execution identity
- runtime logs in Apps Script

## Completion Rule

A deploy is only considered complete when:

- local validation passed
- push succeeded
- web app was updated
- live smoke test succeeded

## Related Docs

- `docs/DEPLOYMENT/Gas_workflow.md`
- `docs/ARCHITECTURE/persistence-boundary.md`
