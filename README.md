# Rebuild Components Worktree

From-scratch reconstruction of SF Lodge Cotizador components using XState + Alpine + pure JS modules.

## Agent Workflow

This project follows a Supervisor/Executor workflow.
- **Supervisor**: Orchestrates tasks, updates `desk/tasks/Board.md` and `REMAINING_VISTAS.md`.
- **Executor**: Solves specific tasks from `desk/tasks/`.

See [WORKFLOW.md](WORKFLOW.md) for details.

## Status

- Rebuild in progress.
- Current suite: `545` passing tests, `1` skipped (Vitest run on 2026-03-11).
- Active implementation references:
  - `plan/implementation-status.json`
  - `plan/I-3-category/phases/README.md`
  - `docs/plans/2026-03-11-vistas-design-map.md`

## Quick Start

```bash
# Run dev server (http://localhost:8090)
npm run serve:sandbox

# Build GAS bundle + workspace
npm run build

# Preview GAS app locally (http://localhost:8082)
npm run dev:gas

# Run all tests
npm test

# Watch mode for tests
npm run test:watch
```

Visit:
- `http://localhost:8090/` — Landing page
- `http://localhost:8090/step-I1-database` — Database browser playground
- `http://localhost:8090/step-03b` — Item playground
- `http://localhost:8090/step-I3-category-01` — Category playground
- `http://localhost:8090/step-04-quotation` — Quotation playground

## Documentation

- **[docs/README.md](./docs/README.md)** — Documentation index
- **[changelog.md](./changelog.md)** — Version history and major updates
- **[docs/DEPLOYMENT/gas-bundling.md](./docs/DEPLOYMENT/gas-bundling.md)** — GAS bundling and local preview flow
- **[plan/implementation-status.json](./plan/implementation-status.json)** — Current implementation state by phase
- **[docs/plans/2026-03-11-vistas-design-map.md](./docs/plans/2026-03-11-vistas-design-map.md)** — Vistas-to-rebuild capability mapping

## Test Suite

Run all tests:

```bash
npm test
```

Main tested areas include:

- item domain + machine behavior,
- category/catalog/basket orchestration,
- quotation modal/view classes,
- database seed + resolver adapters,
- common base/mixins contracts.
