# PLAN: Current Repository Priorities

## Status Snapshot

- Build/regeneration pipeline is active and consistent.
- Root merged integration tests are passing (`npm run test:integration`).
- Data-boundary refactor is partially complete:
  - pricing mocks moved under tests.
  - test in-memory table store centralized under database.
  - xstate `QuotationService` decoupled from local filesystem/test seed.

## Priority 1: GAS Runtime Data Parity

Goal: eliminate mismatch between sidebar-loaded catalog and pricing runtime store.

- Keep actor store hydrated from backend reference tables.
- Ensure `ADD_ITEM` IDs always resolve in pricing defaults stage.
- Validate category mapping consistency (`Nombre`, `_categoria.Nombre`, `ID_Categoria`).

## Priority 2: Documentation Convergence

Goal: remove stale worktree-era statements from operational docs.

- Keep `README.md`, `docs/README.md`, and `DEPLOYMENT_GUIDE.md` aligned.
- Mark archived/outdated docs as historical where needed.
- Record every major change in `changelog.md`.

## Priority 3: Dependency and Build Hygiene

Goal: keep bundle deterministic and explicit.

- Keep `json-logic-js` explicitly installed at root for bundling.
- Continue generating `gas/Bundle_Runtime.html` and `gas/Code.gs` only from package sources.
- Avoid manual edits in generated files.

## Priority 4: Finalize Phase 3 Hand-off

Goal: stable frontend + xstate behavior for GAS deployment.

- Verify full flow: browse → initialize → basket → validation → completed.
- Verify load/edit/save path in both local and GAS environments.
- Address remaining UX or state-edge issues in frontend components.

## Verification Commands

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
npm run test:integration
```

Optional local smoke run:

```bash
npm run dev
```
