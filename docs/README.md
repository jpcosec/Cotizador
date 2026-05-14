# Docs Index

## Data Pipeline

- [`extraction.md`](extraction.md) — project goal, extraction strategy, 4-table data model, and current progress.
- [`pricing_engine.md`](pricing_engine.md) — pricing calculation flow, PricingKind, InitializationMode, formula, rule engines.

## Analysis

- [`notebook.md`](notebook.md) — how to use `cotizaciones_analysis.ipynb` with `Data_Historica.csv`.

## Migration (dev worktree)

Guides for porting legacy GAS logic to the new schema:

- [`migration/migrate_gas_server_functions.md`](migration/migrate_gas_server_functions.md) — V2 GAS server function stubs, persistence layer diagram, `getSheetDB()` gap.
- [`migration/migrate_pdf_generation.md`](migration/migrate_pdf_generation.md) — PDF export migration path.
- [`migration/migrate_rules_engine.md`](migration/migrate_rules_engine.md) — rules engine migration path.
- [`migration/migrate_rut_validation.md`](migration/migrate_rut_validation.md) — RUT validation migration path.

## Dev Architecture

- [`dev-architecture.md`](dev-architecture.md) — index of architecture and deployment docs in the `dev` worktree (including docs still in `legacy/`).

## Diagrams & Specs

- [`diagrams/`](diagrams/) — Mermaid component and activity diagrams.
- [`specs/`](specs/) — YAML specs for the same diagrams.


## Modelado

- `models/OntologiaPropuesta/`
- `models/Ortogonalizacion.mup`
