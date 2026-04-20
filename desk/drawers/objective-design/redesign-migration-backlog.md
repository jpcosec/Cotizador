# Redesign Migration Backlog

## Highest Leverage First

1. Extract `Store` facade from current resolver + persistence behavior.
2. Create `AppShell` abstraction above current quotation flow.
3. Extract first concrete `View`: `QuotationEditorView`.
4. Normalize current quotation child surfaces into registered units.
5. Extract shared `Container` contract from catalog/basket recursion.
6. Normalize signal names across runtime boundaries.
7. Promote validator into a real `View` / `ValidationSummary` pair.
8. Expand same architecture to DB form views.

## Why This Order

- current lower layers are already closer to target than the shell
- shell/view/store formalization unlocks the rest
- recursive containers can be normalized after the outer contract is explicit

## Non-Goals For First Migration

- rewriting item-local pricing model
- replacing Alpine
- rewriting all machines from scratch
- inventing a heavy router
