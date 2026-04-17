# Executor Instructions

Detailed guidance for the Executor role.

---

## Core Responsibilities

Solve **exactly one task** from `desk/tasks/`.

---

## The Executor Contract

1. **Read the task file completely**
2. **Read linked context pills**
3. **Understand the current state**
4. **Implement the fix**
5. **Add/update tests**
6. **Create one resolving commit**
7. **Update Board.md progress**

---

## What NOT to Do

- Never touch `desk/` except to link pills or update Board.md
- Never implement more than the assigned task
- Never batch multiple tasks into one commit
- Never leave git tree dirty after committing

---

## Commit Message Format

```
<type>(<scope>): <description>

<optional body>
```

Types: `fix`, `feat`, `refactor`, `test`, `docs`, `chore`

Example:
```
feat(labyrinth): add URLNode cache for identify()

Reduces latency on repeated calls to the same URL.
```

---

## Before Finishing

1. Run tests: `pytest tests/ -v`
2. Run linter: `ruff check src/`
3. Run typecheck: `mypy src/`
4. Update `desk/tasks/Board.md` (mark done, add commit SHA)
