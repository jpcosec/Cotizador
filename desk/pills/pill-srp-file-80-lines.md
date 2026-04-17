---
id: pill-srp-file-80-lines
type: guardrail
scope: global
language: en
nature: rule
status: active
---

## What
Enforce strict file limits: Max 80 lines, and strictly ONE class/component/purpose per file.

## Why
Prevents "monster" files, ensures modularity, and makes the codebase a searchable, self-documenting graph.

## Rules
1. If a file exceeds 80 lines, it must be split.
2. If a file exports two classes or components, they must be split into separate files.
3. A file's name must exactly match its single export/purpose.
