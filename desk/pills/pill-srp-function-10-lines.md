---
id: pill-srp-function-10-lines
type: guardrail
scope: global
language: en
nature: rule
status: active
---

## What
Enforce strict function limits: Max 10 lines of code, and strictly ONE behavior/purpose per function.

## Why
Forces clear naming of behaviors, reduces cognitive load, and prevents tangled logic.

## Rules
1. No function body can exceed 10 lines of executable code.
2. If a function validates, fetches, and parses, it must be split into three separate functions.
3. Extract complex conditions into named boolean functions.
