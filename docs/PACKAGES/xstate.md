# XState Package

**Location:** `packages/xstate/`

## Purpose

XState is the orchestration middleware between frontend, pricing, and database-backed services.

- Machine blueprint: `src/Orchestration/quotationMachineBlueprint.js`
- Adapters: `src/Orchestration/adapters/*`
- Runtime actor helper: `src/runtime/createActor.js`
- Service facade: `src/QuotationService.js` (now store-injected, no local FS coupling)

## Architectural Boundary

- XState owns workflow coordination and event handling.
- Loaded reference data should live in machine context and be passed to pricing logic.
- Storage implementation is injected (from database package), not hard-coded.

## Current Test Snapshot

- Last local run in this repo: `64/65` passing (`1` failing tax-edge assertion in integration test).

Run:

```bash
cd /home/jp/CotizadorLodge/claps_codelab/packages/xstate
npm test
```
