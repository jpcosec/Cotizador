# Plan Design: Creating New Tasks

This document defines how to create new execution plans (tasks) in `work/tasks/`.

---

## When to Create a New Task

Create a new task when:
- A new feature/epic is identified
- A significant refactor is needed
- A bug requires multi-phase investigation/fix
- Work is blocked on something but can be planned ahead

Do NOT create a task for:
- Trivial one-liner fixes (commit directly)
- Work that can be done in a single session without planning
- Items that belong in drawers (deferred work)

---

## Task Lifecycle

```
DRAFT (in work/tasks/) → ACTIVE (in Board.md) → EXECUTING → COMPLETED → DELETED
                              ↓
                         DEFERRED → drawers/
```

---

## Task Template

Every task in `work/tasks/` follows this structure:

```markdown
---
id: <unique-id>
name: <short name>
domain: <domain>
status: draft | pending | in_progress | completed
priority: p0 | p1 | p2 | p3
depends_on: []
pills:
  - pill-<id>
commit_messages:
  - <conventional commit message>
---

# <ID>: <Name>

## Goal

What this task aims to achieve. Written as an end state.

## Legacy Decisions (if applicable)

What from existing code/behavior must be preserved.
References: `claps_codelab/...`

## Key Constraints

What must NOT change. What boundaries must be respected.

## What This Produces

| Artifact | Location |
|----------|----------|
| ... | ... |

---

## Phase 01: <Name>

**Commit:** `<conventional commit message>`

### Objectives

- [ ] Objective 1
- [ ] Objective 2

### Acceptance

What must be true for this phase to be complete.

### Status: ⏳ Pending

---

## Phase 02: <Name>

... (same structure)

---

## Completion Criteria

### Must Have

- [ ] Criterion 1
- [ ] Criterion 2

### Nice to Have

- [ ] Criterion A

---

## Testing

```bash
npm test
```

Manual verification steps if any.
```

---

## Frontmatter Fields

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `id` | Yes | `U-*`, `T-*`, `R-*` | U=Urgent, T=Task, R=Refactor |
| `name` | Yes | string | Short name for Board display |
| `domain` | Yes | `persistence`, `quotation`, `pricing`, etc. | Code domain |
| `status` | Yes | `draft`, `pending`, `in_progress`, `completed` | Lifecycle state |
| `priority` | Yes | `p0`, `p1`, `p2`, `p3` | p0=critical, p3=low |
| `depends_on` | No | `[]` or `["U-1", "T-5"]` | Other task IDs |
| `pills` | No | `[]` or `["pill-id"]` | Context pill IDs |
| `commit_messages` | Yes | `[]` | One message per phase |

---

## Pill Drafting

Before finalizing a task, draft context pills for complex decisions:

### Pill Template

```markdown
---
id: pill-<short-id>
type: decision | guardrail | pattern | model
scope: global | domain | component
language: en | es | terminology-conventions
nature: context | implementation
status: active
depends_on: []
---

## What
Brief description.

## Why
Why this decision/constraint exists.

## Where
What files/locations this affects.

## How
How this informs implementation.
```

### Pill Types

| Type | Purpose | Becomes stale when... |
|------|---------|----------------------|
| `decision` | Why we chose X over Y | Code contradicts decision |
| `guardrail` | Constraint not to violate | Constraint no longer applies |
| `pattern` | Reusable implementation pattern | Pattern is refactored out |
| `model` | Domain model or data shape | Schema changes |

### Pill Dimensions

Beyond `type`, consider:

| Dimension | Values | Description |
|-----------|--------|-------------|
| `scope` | `global`, `domain`, `component` | Where this applies |
| `language` | `en`, `es`, conventions | Terminology/naming rules |
| `nature` | `context`, `implementation` | Is this reasoning or an artifact? |

---

## Adding to Board

When a task is ready for execution:

1. Move task file from draft location to `work/tasks/`
2. Add entry to `work/tasks/Board.md` under "Active"
3. If blocked, add under "Blocked" with gate reference
4. Ensure all `pills:` referenced in frontmatter exist

---

## Executing a Task

1. **Pre-execution gate:** Ask "Is there any ambiguous aspect not covered by pills?"
   - If yes: call context composer to create more pills
   - If no: proceed

2. **Execution:** Follow Execution Ritual in WORKFLOW.md

3. **Phase completion:** Follow Phase Completion Ritual

4. **Task completion:**
   - All phases done
   - All completion criteria checked
   - All tests pass
   - Commit with final message
   - Update Board.md status to `completed`
   - Run Context Audit: delete stale pills, flow remaining knowledge to code/docs
   - Delete task file

---

## Plan-to-Pill Flow

```
PLAN phase doc (during planification)
    ↓
Draft pills in work/pills/
    ↓
Bind pills to task (pills: in frontmatter)
    ↓
Execute task (pills inform implementation)
    ↓
Context Audit Ritual (check pills after each phase)
    ↓
Task complete → pills stale or flowed to code/docs
    ↓
Delete redundant pills
```

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Task ID | `U-*`, `T-*`, `R-*` | `U-1`, `T-42`, `R-3` |
| Pill ID | `pill-<short>` | `pill-persist-boundary` |
| Phase | `<number>_<name>` | `01_save_contract` |
| Domain | lowercase, hyphenated | `persistence`, `quotation-flow` |

---

## Anti-Patterns

- [ ] Creating task without referencing legacy decisions
- [ ] Skipping pill drafting for complex decisions
- [ ] Binding pills that repeat what's in code/docs
- [ ] Keeping pills after task completion
- [ ] Creating task for work that fits in single commit
- [ ] Adding task to Board without dependencies resolved
