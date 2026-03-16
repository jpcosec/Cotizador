# Vistas to Rebuild Design Map
<!-- This was craeted without considering the info of claps_codelab, there are definitions and implementations that might be already made there. -->
Date: 2026-03-11

## Purpose

Turn `Vistas.md` into an implementation-ready map:

- what is already running,
- what is close (foundation exists but not complete),
- what is still missing,
- and whether each item should be treated as a component or not.

## Evidence Used

- Product intent source: `/home/jp/CotizadorLodge/Vistas.md`.
- Runtime validation (not code-only): GAS preview app at `http://localhost:8082` tested with Playwright.
  - Verified flow: start quotation -> select client -> basket/day editor -> copy/duplicate/remove -> validation preview.
- Workspace contracts reviewed for traceability:
  - `apps/quotation/playground/QuotationFlowInternal.html`
  - `apps/quotation/state/createQuotationInternalRuntime.js`
  - `packages/components/basket/machine/basketMachine.js`
  - `apps/sandbox/playground/database/DatabasePlayground.html`
  - `packages/database/src/machine/databaseMachine.js`

## Status Legend

- `DONE`: implemented and observed in runtime (or fully shipped in workspace route).
- `NEAR`: core runtime exists, but integration/UX parity is incomplete.
- `MISSING`: no usable implementation yet.

## What Is A Component (for this plan)

Use these planning tags to avoid ambiguity.

- `COMPONENT`: reusable runtime unit (own state/machine/API), e.g. `item`, `catalog`, `basket-day`, `basket`.
- `SCREEN`: app-level composition of components (home, quotation editor, validation).
- `WORKFLOW`: state/navigation orchestration (AppFlow stage machine).
- `SERVICE`: persistence/export adapters (save/load/PDF/Excel).
- `TOOL`: admin/editor tooling (DB browser, rule builder, category/price builders).

Rule of thumb:

- If it can be mounted and reused in multiple screens with a stable API, treat it as `COMPONENT`.
- If it mostly routes, coordinates, or persists, it is not a component (`SCREEN`, `WORKFLOW`, `SERVICE`, `TOOL`).

## Mapping Matrix (from `Vistas.md`)

| ID  | Vistas capability                                         | Type               | Status         | Current evidence                                               | Gap to close                                          |
| --- | --------------------------------------------------------- | ------------------ | -------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| H1  | Home -> Nueva cotizacion                                  | SCREEN + WORKFLOW  | DONE           | GAS app root has `Start Quotation`                             | Keep as main entry path                               |
| H2  | Home -> Buscar cotizacion                                 | SCREEN + WORKFLOW  | NEAR           | `PreviousQuotationsModal` exists in package layer              | Wire into GAS flow and real data adapter              |
| H3  | Home -> Editores                                          | SCREEN             | NEAR           | DB browser exists in sandbox route, not in GAS home            | Add GAS home navigation to editor tools               |
| N1  | Nueva cotizacion -> Buscar/editar cliente                 | COMPONENT + SCREEN | NEAR           | Client search/select modal works in GAS app                    | Missing client edit/create in same flow               |
| N2  | Nueva cotizacion -> Campos globales (pax, dias)           | COMPONENT          | DONE           | Sidebar settings in GAS app (`Pax Global`, `Days`)             | Add full validation and persistence linkage           |
| N3  | Nueva cotizacion -> Siguiente                             | WORKFLOW           | DONE           | Stage transitions to basket editor are active                  | Keep transition guards explicit in AppFlow            |
| E1  | Editor -> Sidebar boton editar globales                   | COMPONENT          | DONE           | Collapsible global context panel in GAS app                    | Optionally split to dedicated component               |
| E2  | Editor -> Sidebar catalogo                                | COMPONENT          | DONE           | Category list + item shipping visible in GAS app               | Keep category lazy lifecycle contracts                |
| E3  | Editor -> Selector dia                                    | COMPONENT          | DONE           | Day tabs (`Dia 1..n`) working                                  | Add richer day metadata if needed                     |
| E4  | Editor -> Copiar dia                                      | COMPONENT          | DONE           | `Copy Day` action works in GAS app                             | Add explicit user feedback/toast                      |
| E5  | Editor en tiempo -> items sin detalle                     | COMPONENT          | NEAR           | Item cards and basket lines exist                              | Missing timeline-grade abstraction                    |
| E6  | Editor en tiempo -> mover para ajustar horario            | COMPONENT          | MISSING        | Hour field edit exists, no drag/move timeline UX               | Build scheduler/timeline interaction layer            |
| E7  | Editor en tiempo -> logica grupos/packs                   | COMPONENT + DOMAIN | MISSING        | `COMPOSICION_KIT` schema table exists, no runtime kit behavior | Implement kit/group runtime + UI semantics            |
| E8  | Editor en tiempo -> arrastra para alargar                 | COMPONENT          | MISSING        | No duration drag-resize in GAS editor                          | Add drag-resize gesture over timeline blocks          |
| E9  | Editor canasta -> items                                   | COMPONENT          | DONE           | Basket cards render and update                                 | Keep entryId mutation boundary                        |
| E10 | Editor canasta -> comentarios                             | COMPONENT          | DONE           | Comment textarea per entry in GAS app                          | Persist comments in save adapter                      |
| E11 | Editor canasta -> override cantidades/hora/duracion       | COMPONENT          | DONE           | Override controls active in GAS app                            | Add stricter field-level validation                   |
| E12 | Copiar item/grupo a dia siguiente                         | COMPONENT          | NEAR           | Copy item action works; group copy does not exist              | Add group-aware copy semantics                        |
| E13 | Duplicar item                                             | COMPONENT          | DONE           | Duplicate action works in GAS app                              | Add UX confirmation for large sets                    |
| E14 | Eliminar item                                             | COMPONENT          | DONE           | Remove action works in GAS app                                 | Add undo or soft-delete UX                            |
| V1  | Validador tabla (dia/hora/pack)                           | SCREEN + REPORT    | NEAR           | Validation table stage exists (day/item/hour/totals)           | Add pack/group columns + ordering controls            |
| V2  | Validador detalles en hover                               | SCREEN             | MISSING        | No hover detail panel in validation stage                      | Add row detail popover/expander                       |
| V3  | Exportar a PDF                                            | SERVICE            | MISSING        | Validation `Confirm` is deferred/disabled                      | Implement PDF adapter and command wiring              |
| V4  | Exportar a Excel (con calculos)                           | SERVICE            | MISSING        | No Excel export path                                           | Implement export service + output contract            |
| G1  | Formulario generico DB -> tabla                           | TOOL               | DONE (sandbox) | DB browser route renders all tables                            | Bring into GAS app navigation if required             |
| G2  | Filtrar por columna                                       | TOOL               | NEAR           | Tag filters exist; not generic per-column filter               | Add per-column filter inputs and operators            |
| G3  | Ordenar por columna                                       | TOOL               | DONE (sandbox) | Column header sorting works                                    | Persist sort state per table                          |
| G4  | Doble click para editar row                               | TOOL               | DONE (sandbox) | Inline edit + Enter/Escape works                               | Add keyboard nav between cells                        |
| G5  | Nuevo row                                                 | TOOL               | DONE (sandbox) | `+ Add row` flow works                                         | Add required-field guidance/autofocus strategy        |
| S1  | Formulario especifico -> Buscar/editar cliente estilizado | TOOL + COMPONENT   | NEAR           | Styled selector exists; edit/create not complete               | Add client editor component + save flow               |
| S2  | Buscar/editar pack estilizado                             | TOOL + COMPONENT   | MISSING        | No pack editor screen                                          | Build pack editor on top of kit model                 |
| S3  | Item/categoria/pack resolver                              | TOOL               | NEAR           | Item resolver/debug panel exists in item workspace             | Promote to first-class admin tool and include pack    |
| S4  | Graficos precios/reglas                                   | TOOL               | MISSING        | No chart layer implemented                                     | Add visualization module for profiles/rules           |
| S5  | Creador de reglas (tipos)                                 | TOOL + DOMAIN      | MISSING        | Rule engine evaluates rules, but no rule builder UI            | Build rule authoring flow + validation                |
| S6  | Reglas por categoria                                      | TOOL + DOMAIN      | MISSING        | No category-scoped rule editor UX                              | Add scope-aware rule assignment UI                    |
| S7  | Simulador de reglas                                       | TOOL + DOMAIN      | MISSING        | No simulation workspace                                        | Add scenario runner using existing evaluator          |
| S8  | Creador de categorias (arbol)                             | TOOL               | MISSING        | No category tree management UI                                 | Add hierarchical category editor (if needed by model) |
| S9  | Creador de precios (defaults)                             | TOOL               | MISSING        | No dedicated profile editor UI                                 | Add profile CRUD screen                               |
| S10 | Visualizador grafico de precios                           | TOOL               | MISSING        | No pricing chart tool                                          | Add chart/report component                            |
| S11 | Buscador de cotizaciones pasadas (filtros + preview)      | TOOL + SCREEN      | NEAR           | Previous quotations modal class exists with basic search       | Add date/company/price filters + preview + open flow  |
| X1  | Logica grupo/kit (nota final)                             | COMPONENT + DOMAIN | MISSING        | Data schema has `COMPOSICION_KIT`, runtime not implemented     | Define kit runtime contract and interactions          |

## Current Coverage Snapshot

- DONE: strong coverage on quotation editor core (client select, catalog, basket, day partition, overrides, validation preview).
- NEAR: several capabilities already have technical foundations, but are not fully wired into GAS app UX.
- MISSING: export layer, kit/group logic, timeline drag-resize UX, and most specialized admin tooling.

## Suggested Implementation Path (from today)

1. **Close AppFlow parity first** (`HOME` actions + load previous + client create/edit), so navigation matches `Vistas.md`.
2. **Implement kit/group domain and component contracts** before advanced timeline UX (drag/move/resize).
3. **Upgrade validation stage** with richer row details and explicit export commands.
4. **Add persistence/export services** (`save/load/PDF/Excel`) and wire to GAS app actions.
5. **Promote sandbox DB/editor tools into admin screens** and then build specialized creators (rules/categories/prices).

## Planning Use

Use each matrix row as backlog item with:

- `id` = matrix ID,
- `type` = ownership (component vs non-component),
- `status` = migration priority,
- `gap` = concrete definition of done.

This allows creating a phase plan from current runtime reality toward full `Vistas.md` scope without mixing architecture concerns.
