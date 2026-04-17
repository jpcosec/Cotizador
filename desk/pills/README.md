# Context Pills

Context pills capture rationale that makes tasks unambiguous.

## Pill Structure

```yaml
---
id: pill-<uuid-short>
type: decision | guardrail | pattern | model
scope: global | domain | component
language: en | es | terminology-conventions
nature: context | implementation
status: active | stale
depends_on: []
---

## What
Brief description of the pill content.

## Why
Why this decision/constraint/pattern exists.

## Where
What files/locations this affects.

## How
How this informs implementation (if applicable).
```

## Pill Types

| Type | Purpose | Stale Trigger |
|------|---------|---------------|
| `decision` | Why we chose approach X | Code changes make decision obsolete |
| `guardrail` | Constraint that must not be violated | Constraint no longer applies |
| `pattern` | Reusable implementation pattern | Pattern is refactored out |
| `model` | Domain model or data shape | Model schema changes |

## Scope

| Scope | Meaning |
|-------|---------|
| `global` | Affects entire codebase |
| `domain` | Affects specific domain (e.g., quotation, pricing) |
| `component` | Affects specific component (e.g., Item, Basket) |

## Lifecycle

1. **Drafted** during planification
2. **Bound** to task via `pills:` column in Board
3. **Audited** after each step (Context Audit Ritual)
4. **Flowed** to code/docs when task completes → deleted

## Non-Redundancy Rule

- Code is truth
- Docs is index
- Context is reasoning (subset of subset)

Context pills must NOT repeat what is already in code or docs. They capture the *why*, not the *what*.
