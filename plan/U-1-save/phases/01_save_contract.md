# Phase 01 - Save Contract (Legacy -> Rebuild)

## Context

Save behavior already exists in `claps_codelab` and must be used as baseline.
This phase extracts those decisions and translates them to rebuild schema/contracts.

## Legacy Sources (mandatory)

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Models.js`
- `claps_codelab/SheetDB.js`
- `claps_codelab/Stores_App.html`

## Objectives

- [ ] Document legacy save and load behavior in `SavePayload.md`.
- [ ] Document rebuild mapping to `COTIZACIONES` + `LINEA_DETALLE`.
- [ ] Define normalized response contract for persistence calls.
- [ ] Define ID policy as strategy (not runtime hard-coded constant).
- [ ] Implement pure serializer with tests.

## Outputs

- `packages/database/src/persistence/SavePayload.md`
- `packages/database/src/persistence/serializeQuotation.js`
- `packages/database/src/persistence/serializeQuotation.test.js`

## Acceptance

- Serializer output covers all required transactional fields.
- Contract clearly separates:
  - business semantic fields,
  - storage representation fields.
- No UI/runtime coupling introduced in serializer.

## Commit

`docs(plan): align U-1 save contract with legacy behavior`
