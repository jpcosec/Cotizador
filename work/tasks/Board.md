# Tasks Board

> Single entry point for all active work. Read this before starting any task.

## Active (status=open|in_progress)

| ID | Domain | Task | Priority | Depends On | Pills |
|----|--------|------|----------|------------|-------|

## Completed

| ID | Domain | Task | Completed |
|----|--------|------|----------|
| U-1 | persistence | Save Vertical Slice | 2026-04-15 |

## Blocked (status=blocked)

No blocked items.

## Ready to Promote (from drawers/)

No items pending promotion.

---

## Current Priority

1. **U-2-editor** — parallel with U-3 (U-1 must be committed first)
2. **U-3-gas** — depends on U-1 commit

## Dependency Graph

```
U-1 (save contract + local adapter) → U-3 (GAS save/load) → U-4 (PDF)
                 |
                 +---- parallel ----> U-2 (editor UX)
```

## Execution Order

1. Commit U-1 remaining changes
2. Start U-2 and U-3 simultaneously
3. Start U-4 after U-3 phase 03 complete
