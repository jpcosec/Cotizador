# U-3 GAS Persistence - Agent Guideline

## Context

This track ports already-known save/load behavior from legacy into rebuild architecture.
Do not start by inventing new GAS API shapes.

Review first:

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Models.js`
- `claps_codelab/SheetDB.js`
- `claps_codelab/Stores_App.html`

## Step 1 - Define GAS server contract from legacy

Extract the call/response behavior for save/load from legacy.
Document compatibility requirements and where rebuild intentionally differs.

## Step 2 - Implement GAS server functions in generated code

Add save/load functions via `tools/generate_gas_code.mjs`.
Keep service-layer separation in generated output (router/facade + service helpers).

## Step 3 - Implement `GasSheetAdapter`

Adapter responsibilities:

- call GAS functions through `google.script.run`,
- normalize responses to `PersistencePort`,
- isolate transport-specific error handling.

## Step 4 - Align local shim

Extend `Local_GAS_Shim.html` so local preview uses the same save/load contract.

## Step 5 - Integration verification

Run:

1. local GAS preview,
2. real Apps Script deployment + spreadsheet checks.

## What NOT to do

- Do not leak `google.script.run` into runtime domain logic.
- Do not hard-code new contracts incompatible with proven legacy flows.
- Do not skip local shim parity.
