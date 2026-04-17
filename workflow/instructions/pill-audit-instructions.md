# Pill Audit Instructions

Instructions for running Pill Audits (Phase A and Phase B).

---

## Phase A: Quality Check

**When**: Before atomization begins

**Goal**: Ensure task pool is healthy

### Steps

1. **Scan `desk/tasks/`**:
   - List all `.md` files
   - Check for orphaned tasks (not in Board.md)
   - Check for stale tasks (superseded or irrelevant)

2. **Validate each task file**:
   - Has all required sections (Explanation, Reference, What to Fix, How to Do It, Depends On)
   - Priority is set
   - Lifecycle is correct (`current` or `target`)

3. **Check dependencies**:
   - No circular dependencies
   - All dependencies exist
   - Board.md reflects actual files

4. **Resolve contradictions**:
   - Same task described in multiple places → merge
   - Code contradicts pill → create Gap Task (if `lifecycle: target`)

5. **Delete stale content**:
   - Remove tasks that no longer apply
   - Record significant deletions as ADRs in `docs/adrs/`

---

## Phase B: Execution Readiness

**When**: Before dispatching to Executor

**Goal**: Verify every task can be executed without supervisor intervention

### Steps

1. **Verify link integrity**:
   - All context pills exist
   - No broken internal links
   - References to `src/` files are accurate

2. **Check zero-context sufficiency**:
   - Executor can understand task from file alone
   - No missing background information
   - Implementation path is clear

3. **Validate technical accuracy**:
   - "How to Do It" section is realistic
   - Dependencies are available
   - No conflicting requirements

4. **Mark readiness**:
   ```
   READY FOR EXECUTION: YES
   
   Context pills verified:
   - [x] desk/design/architecture.md
   - [x] src/module/domain.py
   ```

---

## Output

After each audit, update `Board.md`:
- Remove closed/stale tasks
- Update priorities if needed
- Add dependency notes
