# Context Compiler Instructions

Detailed guidance for the Context Compiler subagent.

---

## Purpose

Review task packages for context sufficiency before dispatch to Executor.

---

## Context Pill Types

| Type | Location | Purpose |
|------|----------|---------|
| Architecture | `desk/design/` | High-level structure |
| Domain | `desk/design/` | Key concepts and objects |
| API | `docs/` | Interface contracts |
| Testing | `docs/testing/` | Test patterns |
| Conventions | `STANDARDS.md` | Coding rules |

---

## Compiler Pass Checklist

For each executable task:

1. [ ] Read task file
2. [ ] Read all linked context pills
3. [ ] Verify context is sufficient to understand:
   - What the code currently does
   - What the task requires
   - Where the change belongs
4. [ ] If insufficient: Request supervisor to add context pills
5. [ ] If sufficient: Mark `READY FOR EXECUTION: YES`

---

## Zero-Context Sufficiency Test

An task has zero-context sufficiency if an Executor could:
1. Understand the current code from source only
2. Make the change without asking questions
3. Know if their change is correct

If any step requires asking the supervisor → insufficient context.
