# XState Orchestration Architecture

## Role in System

XState is the middleware layer:

- Receives events from frontend.
- Uses loaded reference data in machine context.
- Calls pricing pipeline with context data.
- Persists through injected store/services (database-owned adapters).

## Core Machine

- Definition: `packages/xstate/src/Orchestration/quotationMachineBlueprint.js`
- Factory: `packages/xstate/src/Orchestration/quotationMachine.xstate.js`
- Adapters: `packages/xstate/src/Orchestration/adapters/*`

## Context Expectations

Machine context is expected to hold at least:

- quotation header and line items
- calculated totals
- error/messages
- loaded reference tables (catalog, categories, profiles, rules, compositions)
- injected `store`/service dependencies

## Boundary Rules

- Frontend sends events and renders snapshots; no direct pricing/database logic.
- Pricing stays pure and receives data as parameters.
- Database package owns persistence/store implementations.

## Test Snapshot

- Last local run: `64/65` xstate tests passing.

Run:

```bash
cd /home/jp/CotizadorLodge/claps_codelab/packages/xstate
npm test
```
