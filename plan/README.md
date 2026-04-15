# Plan Index

> Active work is tracked in `work/tasks/Board.md`.

## U-Series (Urgent)

Priority-ordered. Hard dependency chain: U-1 → U-3 → U-4. U-2 runs parallel with U-1.

| ID | Name | Status | Location |
|----|------|--------|----------|
| U-1 | Save vertical slice | ✅ completed | `work/tasks/U-1-save.md` |
| U-2 | Editor basic | ⏳ pending | `work/tasks/U-2-editor.md` |
| U-3 | GAS persistence | ⏳ pending | `work/tasks/U-3-gas.md` |
| U-4 | PDF export | ⏳ pending | `work/tasks/U-4-pdf.md` |

## Dependency Graph

```
U-1 → U-3 → U-4
  |
  +---- parallel ----> U-2
```

## Legacy

Archived plans moved to `work/drawers/legacy/`.
