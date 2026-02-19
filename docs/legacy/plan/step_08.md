# Step 08: Composition Expansion

**What:** When `addItem()` receives a parent/pack item, expand to child lines.

**File:** `src/Pipeline/02_expand.js`

**Function:** `expandCompositions(lineas, store)` → returns expanded lineas[]
- Lookup COMPOSICION_KIT by ID_Item_Padre
- If found: remove parent, create child lines with `_source: 'COMPOSITION'`
- Recursive for nested compositions
- ABSORBIDO vs SUMAR affects later rule application

**Test file:** `tests/unit/02_expand.test.js`
- Add "Coffee Break Completo" → 3 child lines, no parent
- Each child has _source='COMPOSITION', _parentItem set
- Each child priced individually via formula
- Add regular Salon → no expansion, 1 line
- All Step 07 tests still pass

**Depends on:** Step 07.
