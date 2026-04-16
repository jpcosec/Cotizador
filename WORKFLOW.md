# Workflow Policy

> **Core Principle:** Trust the code, not the task file. The task file describes intent; git history is truth.

---

## The 3 Rituals

### 1. The Atomization Ritual (Supervisor)
Before assigning work to an executor, the Supervisor MUST:
1. **Pill Audit - Phase A**: Audit context pills for completeness.
2. **Atomize**: Break down work into smallest possible child issues.
3. **Context Injection**: Route relevant context pills into issue files.
4. **Pill Audit - Phase B**: Verify readiness for execution (Zero-context sufficiency).
5. **Update Board.md**: Regenerate task board.

### 2. The Traceability Contract
Every closed issue must remain traceable through three artifacts:
- The task file in `work/tasks/`.
- The matching entry in `work/tasks/Board.md`.
- The git commit that resolved it.
**Rule:** One closed issue = one resolving commit. Never batch multiple issues into one commit.

### 3. The Pre-Completion Audit
Before marking a task as completed, verify:
1. **Git history**: Do commits match the phase commit messages?
2. **Artifacts**: Do all specified outputs exist at the specified locations?
3. **Tests**: Do all tests pass? (`npm test` and `userFlowRunner.mjs`)
4. **Clean tree**: Are all untracked files either gitignored or tracked?

---

## Role Protocols

- **Supervisor**: Orchestrates rituals, audits pills, protects the Laws of Physics.
- **Executor**: Solves exactly one issue, creates exactly one commit.

See the [workflow/](./workflow/) directory for detailed role instructions and coding standards.
