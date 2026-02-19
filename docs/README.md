# Documentation Index

This folder contains active technical/business docs for the merged v2 repository.

## Current Focus

- Phase 3 stabilization (GAS parity, frontend/xstate integration, data-boundary cleanup).
- Build/regeneration workflow is active (`npm run build` resets and rebuilds `gas/`).

## Folder Guide

- `ARCHITECTURE/`
  - `state-machine.md`
- `PACKAGES/`
  - `database.md`
  - `pricing.md`
  - `xstate.md`
  - `frontend.md`
- `BUSINESS/`
  - `features.md`
  - `quotation-workflow.md`
- `PHASE3/`
  - `fixes.md`
  - `checklist.md`
  - `components.md`
- `DEPLOYMENT/`
  - `README.md`
  - `LOCAL_vs_GAS.md`
  - `gas-deployment.md`

## Important Root Docs

- `README.md` - repo overview and commands
- `PLAN.md` - current implementation priorities
- `DEPLOYMENT_GUIDE.md` - local/GAS build and deployment flow
- `changelog.md` - major changes log

## Notes

- Older references in some docs may still mention previous worktree-era structure; prefer root docs above for current operational truth.
- Generated deployment files live in `gas/` and are rebuilt from package sources on each `npm run build`.

Last updated: 2026-02-19
