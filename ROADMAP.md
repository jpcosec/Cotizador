# Rebuild Roadmap

From-scratch sequence agreed for the new worktree.

## Steps

1. [x] `counter-basic` standalone (XState + Alpine)
2. [x] `counter-composed` (global counter + 2 local counters)
3. [x] `item` standalone (no DB)
   - 3.1 [x] Catalog card + basket line UI layout
   - 3.2 [x] User override protection (`isUserSet` tracking)
   - 3.3 [ ] JSON-Logic rules engine enhancement
   - 3.4 [ ] Category profile inheritance
4. [ ] `db-viewer` standalone
5. [ ] `item + db` integration
6. [ ] `category` container component
7. [ ] `catalog` component
8. [ ] `basket` component
9. [ ] `environment + item`
10. [ ] `environment + all`

## Current focus

- **Step 3.1 & 3.2 COMPLETE** ✅
  - Item refactored to one-actor-per-item architecture
  - Catalog card & basket line UI with proper visual hierarchy
  - User override protection with per-field tracking
  - 363 comprehensive tests (all passing)
- **Next:** Step 3.3 (JSON-Logic rules engine enhancement) or Step 4 (db-viewer standalone)
