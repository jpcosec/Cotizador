# Rebuild Roadmap

From-scratch sequence agreed for the new worktree.

## Steps

1. [x] `counter-basic` standalone (XState + Alpine)
2. [x] `counter-composed` (global counter + 2 local counters)
3. [x] `item` standalone (no DB)
4. [ ] `db-viewer` standalone
5. [ ] `item + db` integration
6. [ ] `category` container component
7. [ ] `catalog` component
8. [ ] `basket` component
9. [ ] `environment + item`
10. [ ] `environment + all`

## Current focus

- Pricing/initialization abstraction is now class-based (`ItemLogic` + XState interaction adapter).
- Next implementation target: Step 4 (`db-viewer` standalone), then Step 5 (`item + db`).
