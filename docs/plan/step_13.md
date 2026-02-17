# Step 13: Pipeline Orchestrator

**What:** Wire all stages together. `recalculate()` reruns full pipeline.

**File:** `src/Pipeline/pipeline.js`

**Functions:**
- `recalculate(ctx, store)` — reruns stages 2→3→4→5→6→7 on all lines
- Called by `addItem()` and `updatePax()`

**Test file:** `tests/unit/pipeline.test.js`
- recalculate on unchanged ctx → same results
- updatePax(100) → pax-dependent lines recalculated, fixed lines unchanged

**Depends on:** All stages.
