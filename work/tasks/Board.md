# Tasks Board

> Single entry point for all active work. Read this before starting any task.

## Active (status=open|in_progress)

| ID | Domain | Task | Priority | Depends On | Pills |
|----|--------|------|----------|------------|-------|
| U-2 | editor | Editor Basic | p1 | [] | pill-editor-gesture-matrix,pill-legacy-editor-semantics |

## Completed

| ID | Domain | Task | Completed |
|----|--------|------|----------|
| U-5 | quality | Source Code Quality Check | 2026-04-15 |
| U-1 | persistence | Save Vertical Slice | 2026-04-15 |

## Blocked (status=blocked)

No blocked items.

## Ready to Promote (from drawers/)

No items pending promotion.

---

## Current Priority

1. **U-2-editor** — (U-1 must be committed first)

## Dependency Graph

```
U-1 (save contract + local adapter) → U-2 (editor UX)
```

## Execution Order

1. Complete Ritual and reorganize tasks
2. Start U-2 (Editor UI)
