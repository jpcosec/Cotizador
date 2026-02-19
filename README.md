# SF Lodge Quotation System - Integrated Worktree (`claps_codelab`)

This worktree is the integration and deployment hub. It composes database, pricing, xstate, and frontend into one browser/GAS runtime bundle.

## Current State

- Integration layer is active and runnable.
- Local merged integration tests are passing (`npm run test:integration`).
- Build pipeline is active (`npm run build`).
- Main artifacts are generated in `dist/` and `gas/`.

## Worktree History Reference

- Session-level progression: `../current_state.md`.
- Detailed change history: `changelog.md`.

## Expected Inputs and Outputs

- Input API: `createCotizadorActor(opts)`.
  - Typical `opts`: `store`, `clienteId`, `paxGlobal`, `fechaEvento`, `duracionDias`, `cotizacionId`, `bootstrap`.
- Input events: actor events such as `START_NEW_QUOTATION`, `CREATE_NEW`, `QUOTATION_INITIALIZED`, `ADD_ITEM`, `UPDATE_ITEM`, `REMOVE_ITEM`.
- Output API: `window.QuotationEngine` with:
  - `AlpineXStateBridge`
  - `createCotizadorActor`
- Output artifacts:
  - `dist/quotation-engine.iife.js`
  - `gas/Bundle_Runtime.html`

## Tech Stack

- Runtime: JavaScript (ES modules), XState v5, Alpine bridge layer.
- Build: Rollup + `@rollup/plugin-node-resolve` + `@rollup/plugin-commonjs`.
- Test: Node test runner (`node --test`) for merged integration tests.

## Integration With Module Worktrees

- Integrates through `packages/database`, `packages/pricing`, `packages/xstate`, and `packages/frontend`.
- Uses `bundling/entry.js` as the integration boundary that exports runtime primitives.
- Uses `gas/` as the Apps Script-facing deployment surface.

## Structural Differences vs Main Module Worktrees

- This is the only worktree with both source integration and deployment artifacts (`bundling/`, `dist/`, `gas/`).
- Module worktrees focus on one concern; this one coordinates all concerns.
- This worktree is packaging-first; module worktrees are implementation-first.

## Found TODOs

- Complete machine-native quotation loading (`LOAD_QUOTATION`) to remove remaining frontend fallback.
- Replace deep `node_modules` import paths in actor bootstrapping helpers with stable package-level imports.
- Replace GAS smoke harness page with full frontend composition while keeping runtime bundle loading.
- Keep clear policy for generated files (`dist/`, generated GAS HTML) during commits.

## Quick Commands

```bash
npm run test:integration
npm run build
```
