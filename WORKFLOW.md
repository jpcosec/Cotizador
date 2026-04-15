# Workflow Policy

> **No task is complete without testing.**

---

## The 4-Zone Model

```
plan/           # Initial planning. Ephemeral — deleted when U-* completes.
│               # Context pills are drafted here during planification.
work/
  tasks/       # Active work surface. Tasks deleted when resolved.
  drawers/     # Deferred work. Ideas waiting for prioritization.
  pills/       # Context pills bound to tasks. Audited after each step.
```

**Rule:** No surface may reference below it. `work/` may reference `plan/` (rationale), never reverse.

---

## Context Pills

### What They Are

Pre-drafted rationale that makes tasks unambiguous. Subagents should **not create** anything — context was already drafted during planification.

Each pill captures:
- **Why** this approach over alternatives
- **What** constraints/guardrails drive the decision
- **Where** in the codebase changes apply
- **How** the pattern/model informs implementation
- **Language** — terminology conventions, naming rules
- **Scope** — context vs. implementation artifact

### Dimensions

| Dimension | Values |
|-----------|--------|
| Type | `guardrail`, `decision`, `pattern`, `model` |
| Scope | `global`, `domain`, `component` |
| Language | `en`, `es`, or terminology conventions |
| Nature | `context` (rationale) or `implementation` (artifact to create) |

### Pill Lifecycle

```
Drafted (plan/) → Bound to task (work/pills/) → Audited after step → 
  → Still needed? Keep.
  → Redundant with code/docs? Delete.
  → Complete. Knowledge flows to code/docs. Delete.
```

**Non-redundancy rule:** Code is truth. Docs is index. Context is reasoning (subset of subset). Context pills must not repeat what is already in code or docs.

---

## Context Audit Ritual

After each step/execution:

```
1. CHECK  → Is every task aspect covered by a pill?
2. AUDIT  → Are pills still accurate or stale?
3. UPDATE → Update stale pills or delete them.
4. BIND   → Link new pills to tasks as needed.
```

---

## Pre-Execution Gate

Before starting any task, subagent must ask:

> **"Is there any ambiguous or unclear aspect not covered by the context machine?"**

- **If no:** Proceed with execution.
- **If yes:** Call context composer agent to create additional pills. Do not proceed until task is unambiguous.

---

## The Rituals

### 1. Initialization Ritual

Before starting any work:

```
1. ATOMIZE   → Break into smallest possible child tasks
2. DEDUPE    → Merge overlapping items
3. CLEAN     → Delete legacy content
4. RESOLVE   → Resolve contradictory end states
5. BIND      → Link context pills to tasks
6. INDEX     → Regenerate work/tasks/Board.md
7. EXECUTE   → Begin work with explicit boundaries
```

### 2. Execution Ritual

When a task is **done**:

```
1. INVALIDATE → Check if existing tests are broken. Update/delete.
2. VERIFY    → Add new tests where necessary.
3. TEST      → Run npm test. ALL tests must pass.
4. CHANGELOG → Update changelog.md.
5. AUDIT     → Run Context Audit Ritual (check pills, delete stale).
6. DELETE    → Remove task file.
7. BOARD     → Update work/tasks/Board.md.
8. COMMIT    → Make atomic commit.
```

### 3. Phase Completion Ritual

When all tasks in a phase are done:

```
1. COMPILE   → Rebuild if applicable (bundles, dist).
2. AUDIT     → Run npm test + any quality checks.
3. REGRESS   → Fix any test failures.
4. FLOW      → Knowledge flows: pills → code/docs. Delete redundant pills.
5. ADVANCE   → Move to next phase.
```

---

## The Tasks Board

**Location:** `work/tasks/Board.md`

```
# Tasks Board

> Single entry point for all active work. Read this before starting any task.

## Active (status=open|in_progress)
| ID | Domain | Task | Priority | Depends On | Pills |
|----|--------|------|----------|------------|-------|

## Blocked (status=blocked)
| ID | Domain | Blocker | Gate |
|----|--------|--------|------|

## Ready to Promote (from drawers/)
| ID | Domain | Item |
|----|--------|------|
```

---

## The Deferred Board

**Location:** `work/drawers/Board.md`

```
# Drawers — Deferred Work

> Items waiting for prioritization. Stale after 6 months.

## Deferred Items
| ID | Topic | Stale After | Last Reviewed |
|----|-------|-------------|---------------|
```

**Stale rule:** Review at 6 months → promote, delete, or re-date. No graveyard.

---

## Commit Triggers

Commits are made **only** when the Execution Ritual completes.

| Situation | Commit? | Message |
|-----------|---------|---------|
| Phase objectives fully checked | ✅ Yes | Use phase's specified message |
| Critical bug fix mid-phase | ✅ Yes | `fix(<scope>): <description>` |
| Chores (deps, config) | ✅ Yes | `chore(<scope>): <description>` |
| Phase not done | ❌ No | Work-in-progress is not a commit |

**Separate commits:** Phase completion and `implementation-status.json` update are separate commits.

---

## Commit Message Format

```
<type>(<scope>): <description>

Types:   feat, fix, docs, refactor, chore, test, perf
Scopes:  plan, database, persistence, runtime, quotation, item, etc.
```

---

## Branch Strategy

| Branch | Purpose | Policy |
|--------|---------|--------|
| `dev` | Active development | Commit when Execution Ritual completes |
| `master` | Production | PR required; CI must pass |
| `legacy` | Archived reference | Never commit |

---

## CI Gate

E2E tests run automatically on PRs and pushes to `master`.
- **PRs to master require passing CI.**
- Do not merge with failing tests.

---

## What NOT to Do (Anti-Patterns)

- [ ] Proceed with ambiguous task without calling context composer
- [ ] Create implementation artifacts instead of referencing existing pills
- [ ] Let pills drift from code/docs (redundant or stale)
- [ ] Keep pills after plan completion (knowledge should flow to code/docs)
- [ ] Commit with a dirty tree
- [ ] Skip tests to "get it done"
- [ ] Force-push to hide failures
- [ ] Keep drawers/ items >6 months without review
- [ ] Reference surfaces below current layer

---

## Quick Reference

| Command | What |
|---------|------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Watch mode |
| `npm run test:e2e` | Run E2E tests |
