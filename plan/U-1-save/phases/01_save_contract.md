# Phase 01 - SavePayload Contract and Serialization Mapper

## Context

The quotation runtime already produces a full snapshot with client, settings, and basket entries across days. This phase defines the exact shape of data that persistence adapters will consume, and builds the pure mapper that transforms runtime state into that shape.

## Why

Every downstream step (local save, GAS save, PDF) depends on a stable, schema-aligned payload shape. Defining it first prevents rework.

## How

1. Write `SavePayload.md` documenting input → output mapping.
2. Implement `serializeQuotation.js` as a pure mapper function.
3. Write tests covering all mapping paths.

## Objectives

- [ ] `SavePayload.md` documents runtime snapshot → `COTIZACIONES` + `LINEA_DETALLE` field mapping.
- [ ] `serializeQuotation()` accepts `{ client, settings, basketState }` and returns `{ cotizacion, lineas }`.
- [ ] All `COTIZACIONES` columns from `Config_Schema.js` are populated.
- [ ] All `LINEA_DETALLE` columns from `Config_Schema.js` are populated per entry.
- [ ] Override fields mapped: `pax` → `Override_Pax`, `cantidad` → `Override_Cantidad`, `duracionMin` → `Override_Duracion_Min`.
- [ ] Schedule fields mapped: `hora` → `Hora_Inicio`, `dia` → `Dia_Numero`.
- [ ] Comments mapped: `comentarios` → `Comentarios`.
- [ ] ID generation: `COT-{timestamp}-{random}` for cotizacion, `LIN-{cotId}-{seq}` for lineas.
- [ ] Tests pass for single-day, multi-day, empty basket, and override edge cases.

## Subagent Instructions

### Subagent A - Contract definition (explore)

Read and cross-reference:

- `packages/database/src/Config_Schema.js:119-146` (COTIZACIONES + LINEA_DETALLE schemas)
- `apps/quotation/state/createQuotationInternalRuntime.js:62-86` (buildValidationProjection)
- `apps/quotation/state/createQuotationInternalRuntime.js:225-258` (getSnapshot)
- `packages/components/item/Item.js` (toSeed shape)
- `packages/components/basket/machine/basketMachine.js` (basket state shape)
- `claps_codelab/Stores_App.html:199-213` (legacy save reference)

Return: exact field-by-field mapping table.

### Subagent B - Mapper implementation (general)

Write `serializeQuotation.js` and `serializeQuotation.test.js`.
Follow the mapping from Subagent A's output.
Run `npm test` to verify.

## How To Test

### Automated
```bash
npx vitest run packages/database/src/persistence/serializeQuotation.test.js
npm test
```

### Manual
- Review mapper output shape against `Config_Schema.js` column names.

## Commit

`feat: add serializeQuotation mapper with tests`
