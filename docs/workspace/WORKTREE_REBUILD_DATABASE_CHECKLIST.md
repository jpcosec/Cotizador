# Database Rebuild Execution Checklist

This checklist executes the first rebuild step: recreate `claps_codelab_database` from the canonical integrated source in `claps_codelab/packages/database`, while preserving branch history and test/mocking value.

## Objective

- Keep `claps_codelab` as source of truth.
- Preserve legacy database branch history.
- Rebuild database module branch from integrated package baseline.
- Retain/verify all useful tests and seed/mocking behavior.

## Current Baseline (Verified)

- Integrated branch: `claps_codelab` on `v2`.
- Database worktree branch: `claps_codelab_database` on `feature/database`.
- Package tree diff (`claps_codelab/packages/database` vs `claps_codelab_database/packages/database`): no structural/file drift detected.

## Step 0 - Preflight

Run and save outputs:

```bash
cd /home/jp/CotizadorLodge/claps_codelab_database/packages/database && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

Acceptance:
- Database tests pass.
- Integrated tests pass.

## Step 1 - Preserve Legacy Branch State

From `claps_codelab_database`:

```bash
git status
git add -A
git commit -m "docs: freeze pre-rebuild database worktree state"  # only if needed
git tag "archive/database-before-rebuild-YYYYMMDD"
```

If remote backup is desired:

```bash
git push origin feature/database
git push origin "archive/database-before-rebuild-YYYYMMDD"
```

Acceptance:
- Archive tag exists locally (and remotely if used).
- Legacy branch is restorable at a known commit.

## Step 2 - Create Rebuild Branch

From `claps_codelab_database`:

```bash
git checkout -b rebuild/database-from-v2
```

Acceptance:
- New rebuild branch created from preserved baseline.

## Step 3 - Sync Canonical Package Source

Sync only module code/test package from integrated workspace:

```bash
rsync -av --delete \
  /home/jp/CotizadorLodge/claps_codelab/packages/database/ \
  /home/jp/CotizadorLodge/claps_codelab_database/packages/database/
```

Then keep/update module-level docs in `claps_codelab_database` (README/changelog) to reference rebuild branch and canonical source.

Acceptance:
- `packages/database` matches integrated canonical package.
- No unrelated legacy files are reintroduced into module source path.

## Step 4 - Re-Apply Keep Items (If Any Divergence Appears)

Must retain:
- `IStore` contract and all adapters (`InMemoryStore`, `FileStore`, `GasSheetStore`).
- Seed utilities (`csvSeed`, v1 CSV seed support).
- Database tests validating model generation, CRUD, and seed initialization.

If a retained test/mocking utility exists only in legacy path, copy it intentionally and document the reason in commit message.

## Step 5 - Parity Validation

Run:

```bash
cd /home/jp/CotizadorLodge/claps_codelab_database/packages/database && npm test
cd /home/jp/CotizadorLodge/claps_codelab && npm run test:integration
```

Acceptance:
- Database tests pass in rebuilt branch.
- Integrated tests still pass with rebuilt database module available.
- No regression in seed workflows.

## Step 6 - Document and Commit

Required docs update on rebuild branch:
- `claps_codelab_database/README.md`
- `claps_codelab_database/changelog.md`

Commit guidance:
- One commit for source sync.
- One commit for docs/metadata updates.
- Mention archive tag reference in at least one commit body/message.

## Step 7 - Merge/Cutover Rule

Do not delete `feature/database` after rebuild.

Cutover when all are true:
- Rebuild branch passes database tests.
- Integration tests pass in `claps_codelab`.
- README/changelog reflect rebuilt status.
- Archive tag is preserved.

## Rollback Plan

If rebuild fails parity:

```bash
git checkout feature/database
git checkout -b recovery/database-from-archive "archive/database-before-rebuild-YYYYMMDD"
```

Use recovery branch restoration first; avoid destructive reset flows unless explicitly required.

## Done Definition

Database worktree is considered rebuilt when:
- branch `rebuild/database-from-v2` (or chosen equivalent) contains canonical package sync,
- preserved test/mocking value is confirmed,
- and branch history remains intact with archive tag.
