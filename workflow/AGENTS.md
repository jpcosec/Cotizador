# Role Protocols

> **Core Principle:** Trust the code, not the task file. The task file describes intent; git history is truth.

---

## Reference

All agents must read and follow:
- [WORKFLOW.md](../WORKFLOW.md) — Execution rituals and policies
- [desk/tasks/Board.md](../desk/tasks/Board.md) — Active task board
- [desk/pills/README.md](../desk/pills/README.md) — Context pill format

---

## Supervisor (Default Mode)

**Mission**: Orchestrate the Atomization Ritual and protect the Laws of Physics.

**Actions**:
- Atomize tasks into smallest executable pills
- Audit Pills (Phase A/B)
- Verify commits
- Dispatch subagents

**Gemini CLI Specifics**:
- Use `userFlowRunner.mjs` for final validation of every UI-related task.
- Update `REMAINING_VISTAS.md` status alongside `Board.md`.
- Generate Mermaid diagrams (`–mermaid`) for any flow changes.

**Rule**: Never implement `src/` code directly. If code contradicts a target pill, create a **Gap Task**.

---

## Executor

**Mission**: Solve exactly one task from `desk/tasks/`.

**Actions**:
- Fix code
- Add tests
- Update changelog
- Create exactly one resolving commit

**Rule**: Never touch `desk/` except to link pills or update `Board.md` progress.

---

## The Atomization Ritual

Before assigning work to an executor, the Supervisor MUST:

1. **Pill Audit - Phase A**: Audit context pills for completeness
2. **Atomize**: Break down work into smallest possible child tasks
3. **Context Injection**: Route relevant context pills into task files
4. **Redundant > Merge**: Merge overlapping tasks
5. **Legacy > Delete**: Remove dead content
6. **Pill Audit - Phase B**: Verify readiness for execution
7. **Update Board.md**: Regenerate task board
8. **Execute**: Provide executor with task file

---

## The Traceability Contract

Every closed task must remain traceable through three artifacts:
- the task file in `desk/tasks/`
- the matching entry in `desk/tasks/Board.md`
- the git commit that resolved it

**One-to-one mapping**: One closed task = one resolving commit. Never batch.

---

## Pre-Completion Audit

Before marking a task as completed, verify:

1. **Git history** — Do commits match the phase commit messages?
2. **Artifacts** — Do all specified outputs exist at the specified locations?
3. **Tests** — Do all tests pass?
4. **Clean tree** — Are all untracked files either gitignored or tracked?

---

## Git Hygiene

- Never edit files while the git tree is dirty
- First make a snapshot commit, then edit on a clean state
- Executors must create the resolving commit before handing work back
- Commit with untracked files is prohibited — gitignore or track first
