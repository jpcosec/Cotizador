---
id: pill-atom-testing-parity
type: guardrail
scope: global
language: en
nature: rule
status: active
---

## What
Every code atom (file) must have a corresponding test file.

## Why
Atomization without verification is just fragmentation. Smaller files must be easier to test, not harder to find.

## Rules
1. For every `LogicAtom.js`, there MUST be a `LogicAtom.test.js` in the same directory (or a nested `tests/` folder).
2. The test must cover the single responsibility of that atom.
3. Subagents cannot mark an atomization task as complete without passing tests for the new atoms.
