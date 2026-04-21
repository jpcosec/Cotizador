# Persistence Boundary

## Purpose

This document explains the persistence boundary used by the quotation app.

The persistence layer is intentionally adapter-based so the same app-level flow can run in:

- local preview mode
- Google Apps Script mode

## Core Rule

The UI and quotation runtime should not know whether persistence is local or GAS-backed.

They should only depend on a persistence contract.

## Main Adapters

### Local Adapter

- `src/database/src/persistence/LocalPersistenceAdapter.js`

Used in local development and local GAS preview.

It persists through the in-memory/database model layer and local disk-backed tools.

### GAS Adapter

- `src/database/src/persistence/GasSheetAdapter.js`

Used when persistence must cross the real Apps Script boundary through `google.script.run`.

It normalizes Apps Script responses into the same persistence result shape expected by the app.

## Supported Operations

Current persistence behavior includes:

- save quotation
- load quotation
- list quotations
- load reference data

Local-only editor paths also support:

- save kit composition
- save rules

## Response Shape

Persistence responses are normalized into success/error results.

Typical success shape:

```js
{
  ok: true,
  data: {
    quotationId,
    cotizacion,
    lineas,
    lineCount,
  }
}
```

Typical error shape:

```js
{
  ok: false,
  error: {
    code,
    message,
    details,
  }
}
```

This normalized shape is what lets the runtime treat local and GAS persistence uniformly.

## Local Mode

In local mode:

- the app is served by `tools/serve-local.mjs`
- browser RPC calls go through `/api/google-script-run`
- local method execution is handled by the local GAS shim/tooling
- persistence is backed by local data files and models

This gives the app a GAS-like boundary without requiring real Apps Script during development.

## GAS Mode

In real GAS mode:

- `GasSheetAdapter` calls `google.script.run`
- Apps Script methods in generated `gas/Code.gs` do the actual server work
- Google Sheets becomes the storage backend

`GasSheetAdapter` also supports method fallback names such as:

- `guardarCotizacionV2` / `guardarCotizacion`
- `cargarCotizacionV2` / `cargarCotizacion`
- `buscarCotizacionesV2` / `buscarCotizaciones`
- `getReferenceDataV2` / `getReferenceData`

This helps the app tolerate version drift during backend transitions.

## Runtime Integration

The persisted quotation runtime uses the persistence boundary through:

- `src/state/createPersistedQuotationRuntime.js`

That runtime owns:

- saving state
- loading state
- persistence error handling
- progression from `validation` -> `saving` -> `completed`

The shell should observe the normalized persistence outcome, not the backend details.

## Why This Matters

The persistence boundary is one of the key reasons the app remains deployable.

It keeps:

- UI independent from backend transport
- runtime logic independent from local vs GAS mode
- response handling explicit and testable
- GAS compatibility preserved

## Related Docs

- `docs/DEPLOYMENT/Gas_workflow.md`
- `docs/ARCHITECTURE/current-architecture.md`
- `src/state/createPersistedQuotationRuntime.js`
