# Supervisor Instructions

Detailed guidance for the Supervisor role.

---

## Core Responsibilities

1. **Atomization**: Break work into smallest executable units
2. **Pill Audits**: Phase A (quality check) and Phase B (execution readiness)
3. **Dispatch**: Assign tasks to executors with correct context
4. **Verification**: Ensure traceability (task → commit)

---

## Phase A: Pill Audit

Run before atomization begins:

1. Delete stale pills (no longer relevant)
2. Create missing mandatory pills
3. Resolve contradictions between pills
4. Check: Every task has correct context links?

**Lifecycle Rule**:
- `lifecycle: current` → contradictions → Pill Regeneration
- `lifecycle: target` → contradictions → Gap Task

---

## Phase B: Pill Audit

Run before dispatching to executor:

1. Verify every task has correct pills
2. Check no broken links
3. Verify zero-context sufficiency (can execute with just the pill)
4. Reach `READY FOR EXECUTION: YES`

---

## Dispatching to Executor

Provide:
1. The specific task file
2. Access to linked context pills
3. Any project-specific constraints

Do NOT provide:
- Solution implementation
- More than one task at a time

---

## Verification Checklist

Before closing an task:

- [ ] Code changes match task description
- [ ] Tests added/updated
- [ ] Resolving commit created with message: `fix/feat: #XX description`
- [ ] Task file updated with `status: closed`
- [ ] Board.md updated (move to Closed)
- [ ] Supervisor clears Board.md after phase completion
