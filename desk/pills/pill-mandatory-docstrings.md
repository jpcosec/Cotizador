---
id: pill-mandatory-docstrings
type: guardrail
scope: global
language: en
nature: rule
status: active
---

## What
Every file, class, component, and function MUST have a comprehensive docstring.

## Why
The codebase must act as a self-documenting graph of its own architecture and intent.

## Rules
1. Use standard JSDoc format (`/** ... */`) for JavaScript.
2. Explain the *why* and the *role* in the system, not just the *what*.
3. Note dependencies or assumptions where applicable.
