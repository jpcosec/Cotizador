# Changelog

## [Unreleased] - v2 Design Phase

### 2026-02-18
- **XState upgraded from v4.38 to v5.x** across all documentation:
  - Updated version references in README.md, TECHNICAL_DEPENDENCIES_AND_MOCKING.md, worktrees.md
  - Fixed state machine definition in worktrees.md: replaced non-standard `regions: [...]` array with correct v5 `type: 'parallel', states: {...}` syntax
  - Updated bundle size estimates (v5 is smaller: ~14-15KB gzipped vs v4's ~16.4KB)
  - Updated all package.json templates from `"xstate": "^4.38.0"` to `"xstate": "^5.0.0"`
  - Added "Why XState v5?" section to README.md
  - Verified all code examples already use v5 API (`createActor()`, `createMachine()`)

### 2026-02-16
- **db_docs.md updated to v2.3**: Flexible tax system
  - New table 1.7 REGLAS_IMPUESTO (IVA, ILA, Exento, etc.)
  - ITEM_CATALOGO: added `ID_Impuesto` FK
  - COTIZACIONES: added `Total_Impuestos_Adic`, `Desglose_Impuestos` JSON
  - LINEA_DETALLE: added `Impuesto_Monto`, `Impuesto_Tasa_Snapshot`, `Es_Descuento`, `ID_Regla_Descuento`
  - REGLAS_DESCUENTO: added `Origen`, `Permite_Editar_Valor`, `Requiere_Aprobacion`
  - RESTRICCION: field renames (`ID_Item_A` → `ID_Item_Trigger`, `ID_Item_B` → `ID_Item_Target`)
  - COMPOSICION renamed to COMPOSICION_KIT
  - COTIZACIONES Estado: added `Pendiente_Aprobacion`
  - Relationships updated (now 9 relationships across 10 entities)
- Added discount and bundles engine design document (v2.1)
- Added quotation pipeline flow document (4-phase assembly line)
- Created README.md with documentation guide and known gaps
- Created changelog.md
- Removed duplicate `docs/data` file (was identical to `docs/db_docs.md`)
- Fixed broken references in IMPLEMENTATION_ROADMAP.md (removed nonexistent mermaid/plan files, linked actual docs)

### 2026-02-14
- Added data dictionary (db_docs.md) - v2 schema with 7 entities
- Added composition logic document - recursive kit/bundle system
- Added pricing and constraints document - universal formula + constraint validator
- Added technical design document - modular architecture with repository pattern

### 2026-02-12
- Added implementation roadmap - 4-phase execution plan
- Added TODO list - granular feature checklist
- Added current state assessment - gap analysis between v1 and v2
- Moved v1 source code to `old/` directory
