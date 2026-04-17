# Git Workflow Policy

> **The only rule that matters: No task is complete without testing.**

---

## The Execution Ritual

When a phase/task is **done**, follow these steps **in order**:

```
1. INVALIDATE  → Check if existing tests are broken. Delete or update them.
2. VERIFY     → Add new tests where necessary.
3. TEST       → Run npm test. ALL tests must pass.
4. CHANGELOG  → Update changelog.md with what changed.
5. BOARD      → Update the Tasks Board (status, progress).
6. COMMIT     → Make one atomic commit with the phase's commit message.
```

**STOP** at step 3 if tests fail. Fix first, then continue.

---

## Failure Path

If `npm test` fails:

1. **Do not commit.** Fix the failing tests first.
2. **Do not skip tests.** Tests exist to catch regressions.
3. **Do not force-push** to cover up failures.
4. After fixing, re-run `npm test` until green.
5. Then continue with steps 4–6.

---

## Commit Triggers

Commits are made **only** when the Execution Ritual completes.

| Situation | Commit? | Message |
|-----------|---------|---------|
| Phase objectives fully checked | ✅ Yes | Use the phase's specified message |
| Critical bug fix mid-phase | ✅ Yes | `fix(<scope>): <description>` |
| Chores (deps, config) | ✅ Yes | `chore(<scope>): <description>` |
| Phase not done | ❌ No | Work-in-progress is not a commit |

---

## Commit Message Format

```
<type>(<scope>): <description>

Types:   feat, fix, docs, refactor, chore, test, perf
Scopes:  plan, database, persistence, runtime, quotation, item, etc.
```

Examples:
- `feat(persistence): add local save adapter`
- `fix(runtime): correct loading state transition`
- `test(quotation): add confirm-save integration test`

---

## The Tasks Board

The Tasks Board is the **single entry point** for all active work.

**Location:** `desk/tasks/Board.md`

```
# Tasks Board

## Active (status=open|in_progress)
| ID | Domain | Task | Priority | Depends On |
|----|--------|------|----------|------------|

## Blocked (status=blocked)
| ID | Domain | Blocker | Gate |
|----|--------|--------|------|
```

**Rule:** Read the Board before starting any task.

---

## What NOT to Do (Anti-Patterns)

- [ ] Commit with a dirty tree (uncommitted changes from prior work)
- [ ] Skip tests to "get it done"
- [ ] Force-push to hide failures
- [ ] Commit WIP as "it'll be fine"
- [ ] Leave `dist/` changes uncommitted when intentional (bundle updates should be explicit)
- [ ] Edit `implementation-status.json` without a corresponding commit

---

## Branch Strategy

| Branch | Purpose | Policy |
|--------|---------|--------|
| `dev` | Active development | Commit freely when Execution Ritual completes |
| `master` | Production | PR required; CI must pass |
| `legacy` | Archived reference | Never commit |

---

## CI Gate

E2E tests run automatically on PRs and pushes to `master`.
- **PRs to master require passing CI.**
- Do not merge with failing tests.

---

## Quick Reference

| Command | What |
|---------|------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Watch mode |
| `npm run test:e2e` | Run E2E tests |

---

## Git Hygiene

- **Never edit with dirty tree.** Commit clean state first.
- A plan that survives its own completion is drift.
