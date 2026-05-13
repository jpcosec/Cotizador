# Draft: Commit Current Work + Fix Open Integration Issues

## Requirements (confirmed)
- Commit the 34 uncommitted files (U-1 save + U-3 GAS wiring implementation)
- Fix data source mismatch: GAS bundle uses seeded store, sidebar uses real GAS backend
- Fix field name casing: `catalogoPorCategoria` uses lowercase, GAS returns capitalized
- Enforce database package usage: "ALL DATABASE USAGE SHOULD COME FROM PACKAGE"
- Fix UI styling drift: make quotation UI closer to legacy `claps_codelab` look

## Technical Decisions
- Tests currently pass (563 passing, 1 skipped) — baseline for regression
- Build pipeline clean — no circular dependency warnings
- U-1 + U-3 work is complete and should be committed as-is before changes

## Scope Boundaries
- INCLUDE: Commit, data source fix, field casing fix, DB package enforcement, UI styling alignment
- EXCLUDE: U-4 PDF, U-2 Editor, new features, kit/group logic

## Research Findings

### Issue 1: Data Source Mismatch
- `createQuotationRuntime.js` creates store via `seedToResolverDb(LOCAL_INIT_TABLES)` — hardcoded seeded data
- `Code.gs` has NO `getCatalogo()` — only persistence (save/load quotations)
- `Local_GAS_Shim.html` also has NO catalog functions — only save/load mocks
- Catalog layer is **permanently seeded at init**, never fetched from GAS
- In production GAS, seeded data won't match real sheet content → crashes
- Fix: either hydrate from GAS at init, or accept seed-only for MVP and add guards

### Issue 2: Field Name Casing
- `categoryMachine.js:21-38` reads `db.items` with uppercase (`ID_Categoria`, `Nombre`)
- `toCategoryOptions()` normalizes categories to camelCase (`id`, `nombre`, `icono`)
- BUT items in `category.state?.items` keep uppercase DB fields
- `createQuotationInternalRuntime.js:42` groups by category → fails because `ID_Categoria` ≠ `categoria`
- Views have defensive fallbacks (`item?.category ?? item?.categoria`) but items have `ID_Categoria` — neither matches
- Result: all items fall to "Varios"
- Fix: normalize item fields at category machine level (Option A from research)

### Issue 3: DB Package Enforcement
- `createQuotationRuntime.js` already uses `seedToResolverDb()` from database package ✅
- `Code.gs` has standalone persistence logic (not generated from package patterns) ⚠️
- `tools/generate_gas_code.mjs` generates Code.gs — should align with package contracts
- Fix: ensure Code.gs uses database package patterns, add catalog data serving

### Issue 4: UI Styling
- Rebuild: settings in collapsible sidebar, 8px padding, DM Sans, compact
- Legacy: settings at top of main area (always visible), 15px padding, system fonts, spacious
- User specifically asked: move settings-actions above basket cards, legacy control bar style
- Same color scheme (#2d5a27 green) — no color changes needed
- Fix: restructure settings-actions placement, increase spacing to match legacy feel

## Open Questions
- (none — all research complete)
