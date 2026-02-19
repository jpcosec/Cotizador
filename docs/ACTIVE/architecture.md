# Architecture (Current)

## Source of Truth

- Runtime integration and deployment live in `claps_codelab/`.
- Module boundaries live in:
  - `packages/database`
  - `packages/pricing`
  - `packages/xstate`
  - `packages/frontend`
- Integration surface lives in:
  - `bundling/entry.js`
  - `bundling/createCotizadorActor.js`
  - `gas/`

## Runtime Flow

1. Frontend bridge dispatches events to actor.
2. XState machine orchestrates workflow and data operations.
3. Pricing module performs deterministic calculations.
4. Database module provides adapter-backed model/store operations.
5. Bundling exports browser/GAS runtime as IIFE.

## Boundaries and Rules

- Pricing must remain pure (no direct DB I/O).
- XState owns orchestration and persistence entry points.
- Frontend consumes actor snapshots and sends events; it does not own pricing logic.
- Deployment concerns stay in `bundling/` and `gas/`.

## Current Risk Areas

- `LOAD_QUOTATION` machine-native flow still incomplete.
- Some imports still depend on deep package paths.
- Remaining adapter/service TODOs in xstate need closure.

See `../TODO_ACTIVE_NON_LEGACY.md` for implementation tasks.
