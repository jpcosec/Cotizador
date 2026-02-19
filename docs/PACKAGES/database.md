# Database Package

**Location:** `packages/database/`

## Purpose

Database owns all persistence abstractions and data access adapters.

- Interface: `IStore`
- Store adapters: `GasSheetStore`, `InMemoryStore`, `FileStore`
- Table test helper store: `TableInMemoryStore`
- Model generation: `ModelFactory`
- Service layer used for GAS generation: `src/services/*`

## Current Notes

- This package is the source for `gas/Code.gs` generation.
- Frontend and pricing should not implement stores; they consume orchestration/runtime data.
- XState should receive injected stores/adapters and keep loaded data in machine context.

## Test Status

- Last local run in this repo: `5/5` tests passing.

Run:

```bash
cd /home/jp/CotizadorLodge/claps_codelab/packages/database
npm test
```
