# Runtime Environments

## Intent

This project has two runtime environments with different jobs.

## Sandbox

- Purpose: isolated component and view development
- Entry: `apps/sandbox/`
- Example route: `/step-04-quotation`
- Data source: local seed data and local adapters
- Allowed extras: dev-only tools such as database editor links
- Rule: sandbox is not the product surface

## GAS App

- Purpose: full integrated quotation application development
- Source: `apps/gas/`
- Local development: `npm run dev:gas`
- Runtime contract: integrated app only, no sandbox-only controls
- Local persistence mode: `tools/serve-local.mjs` + `data/db.json`
- Real persistence mode: Apps Script backend in `gas/Code.gs` + Google Sheets
- Rule: any end-to-end business flow must be validated here

## Boundary Rules

- `packages/` contains shared domain/runtime code used by both environments
- `apps/quotation/playground/` is sandbox-oriented wiring and should not be the source of truth for GAS screens
- `apps/gas/Quotation_App_Source.html` is the source template for the GAS app shell
- `apps/gas/Stores_QuotationApp.html` must pass explicit GAS capabilities into the app component
- `apps/gas/Local_GAS_Shim.html` is for local GAS development only and proxies `google.script.run` to the Node local server
- Sandbox-only affordances must be capability-gated and hidden in GAS

## Current Capability Matrix

| Capability | Sandbox | GAS |
|---|---:|---:|
| Full quotation flow | Yes | Yes |
| Database editor link | Yes | No |
| Quotation search | Yes | Yes |
| Manual load by ID | Yes | Yes |

## Working Rule

If a feature is requested for the app, implement and verify it in GAS first. Sandbox may receive a mirrored version later only if it helps component or view development.
