# Documentation Index

Stable technical documentation for the CotizadorLodge v2 codebase.
For planning, roadmap, and phase-specific content see [`../plan/`](../plan/README.md).

## Folder Guide

### ARCHITECTURE/
Core technical decisions and design documents.

- `database-logic.md` — Database abstraction layer (IStore, ModelFactory)
- `rules-engine.md` — Pluggable rules engine design
- `state-machine.md` — XState machine design and transitions
- `ui-machine-context-sync-plan.md` — Alpine ↔ XState synchronization (implemented)

### PACKAGES/
Per-package technical reference.

- `database.md` — `@claps/database` package guide
- `pricing.md` — `@claps/pricing` pipeline reference
- `xstate.md` — `@claps/xstate` orchestration reference
- `frontend.md` — `@claps/frontend` component reference

### BUSINESS/
Domain logic and workflow documentation.

- `quotation-workflow.md` — End-to-end quotation flow

### DEPLOYMENT/
Build, deploy, and environment documentation.

- `README.md` — Deployment overview
- `LOCAL_vs_GAS.md` — Differences between local and GAS environments
- `gas-deployment.md` — Google Apps Script deployment guide
- `local-deployment.md` — Local development server setup

## Notes

- Generated deployment files live in `gas/` and are rebuilt from package sources on each `npm run build`.
- Older references in some docs may still mention previous worktree-era structure; prefer root docs for current operational truth.

Last updated: 2026-02-20
