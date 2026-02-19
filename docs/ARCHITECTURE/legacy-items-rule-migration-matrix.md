# Legacy Items Rule Migration Matrix

Source analyzed: `data/Cotizador - Items.csv`.

This matrix maps business logic embedded in free text (`Item`, `Horario`, `Detalle de servicios.` and mixed price strings) into the v3 schema and engines (`ITEM_CATALOGO`, `CATEGORIAS`, `PERFILES_PRECIO`, `REGLAS_NEGOCIO`, `RESTRICCION_UI`).

## 1) What the legacy CSV contains

- 189 rows, 12 categories.
- 41 rows with hybrid pricing signal (`fixed + per person`).
- 32 rows with explicit schedule windows.
- High presence of rule text in names/descriptions: capacity limits, minimum pax, overtime, included/excluded scope.

## 2) Migration matrix (pattern -> destination)

| Legacy pattern (regex/shape) | Example | Target model | Field/Rule mapping | Engine stage |
|---|---|---|---|---|
| `hasta\s+\d+\s+personas` | "Salon Chinook ..., hasta 320 personas" | `ITEM_CATALOGO` + `REGLAS_NEGOCIO` | Persist extracted limit in item metadata and create `RESTRICCION_UI` warning/error when `_pax` exceeds limit | `RESTRICCION_UI` |
| `minimo\s+\d+\s+personas` | "Cambio de horario ..., minimo 30 personas" | `REGLAS_NEGOCIO` | Rule condition `_pax < min` with blocking/error behavior by item/category | `RESTRICCION_UI` |
| `mas de N` vs `menos de N` variants | buffet/carta rows by pax threshold | `REGLAS_NEGOCIO` (+ optional split items) | Conditional rule branch by pax threshold; either auto-adjust price profile or enforce item variant selection | `AJUSTE_LINEA` / `RESTRICCION_UI` |
| `Hora extra` / `Extension media hora` | "Hora extra Bar abierto..." | `REGLAS_NEGOCIO` | Multiply/add surcharge when duration exceeds base window | `AJUSTE_LINEA` |
| Schedule window in `Horario` | `8:30-19:30`, `21:00-1:00` | `ITEM_CATALOGO` (metadata) + `REGLAS_NEGOCIO` | Parse allowed window; validate selected line time (`Hora_Inicio`) against range | `RESTRICCION_UI` |
| `Incluye ...` text | "Incluye fogata..." | `ITEM_CATALOGO.Default_Glosa` + optional `COMPOSICION_KIT` | Keep narrative in glosa; if operationally billable subitems exist, model explicit parent/child composition | N/A + `EXPAND` |
| `No incluye ...` text | "No incluye bebidas ni aperitivos" | `REGLAS_NEGOCIO` + `Default_Glosa` | Keep as UI message and optional warning rule when dependent items missing | `RESTRICCION_UI` |
| Composite price string `X + Y por persona` | `500.000 + 15.000 por persona` | `PERFILES_PRECIO` | `Costo_Base_Fijo = X`, `Costo_Unitario_Pax = Y` | `pricing` |
| Fixed-only price rows | `250.000` fixed | `PERFILES_PRECIO` | `Costo_Base_Fijo > 0`, unitary coefficients in zero | `pricing` |
| Per-person-only rows | `Valor por persona > 0`, fixed zero | `PERFILES_PRECIO` | `Costo_Unitario_Pax > 0`, base in zero | `pricing` |
| "adicional" upsells | "Microfono ... adicional" | `ITEM_CATALOGO` + optional `REGLAS_NEGOCIO` | Treat as additive independent item; optionally auto-suggest by trigger item/category | `AJUSTE_GLOBAL` / recommendation |

## 3) Canonical extraction targets

### ITEM_CATALOGO
- Keep commercial name in `Nombre`.
- Keep human narrative in `Default_Glosa` (already restored).
- Add optional extracted metadata fields in future (if needed): `Capacidad_Max`, `Horario_Desde`, `Horario_Hasta`, `Duracion_Base_Min`.

### PERFILES_PRECIO
- Parse composite expressions into linear coefficients:
  - `Costo_Base_Fijo`
  - `Costo_Unitario_Pax`
  - `Costo_Unitario_Tiempo` (if recoverable from explicit time surcharge rows)
  - `Costo_Unitario_Item`

### REGLAS_NEGOCIO
- Materialize textual constraints as executable JSON rules:
  - min/max pax
  - time window restrictions
  - overtime/extension surcharges
  - compatibility hints (`incluye/no incluye`) as warning/info messages.

## 4) Suggested rule templates

Capacity max warning:

```json
{
  "ID_Regla": "R_CAP_ITEM_XXX",
  "Etapa": "RESTRICCION_UI",
  "Scope": "ITEM",
  "Tipo_Accion": "WARNING",
  "Condicion_JSON": { ">": [{ "var": "_pax" }, 320] },
  "Payload_JSON": { "message": "Excede capacidad maxima del item" }
}
```

Minimum pax blocking:

```json
{
  "ID_Regla": "R_MINPAX_ITEM_XXX",
  "Etapa": "RESTRICCION_UI",
  "Scope": "ITEM",
  "Tipo_Accion": "ERROR",
  "Condicion_JSON": { "<": [{ "var": "_pax" }, 30] },
  "Payload_JSON": { "message": "Este servicio requiere minimo 30 personas" }
}
```

Overtime surcharge:

```json
{
  "ID_Regla": "R_OVERTIME_ITEM_XXX",
  "Etapa": "AJUSTE_LINEA",
  "Scope": "ITEM",
  "Tipo_Accion": "MULTIPLY",
  "Condicion_JSON": { ">": [{ "var": "_duracionMin" }, 240] },
  "Payload_JSON": { "factor": 1.25 }
}
```

## 5) Prioritized migration backlog

1. Parse and normalize hybrid price expressions (`X + Y por persona`) into `PERFILES_PRECIO`.
2. Extract and apply min/max pax constraints into `REGLAS_NEGOCIO`.
3. Normalize `Horario` windows and enforce via `RESTRICCION_UI`.
4. Convert explicit overtime/extension products into reusable rule-driven adjustments where possible.
5. Keep long narratives in `Default_Glosa`; only convert to executable rules when deterministic.

## 6) Data quality flags to handle before full automation

- Empty item names detected in a few rows.
- Non-numeric text values in price columns (for example `ver listado de bar`).
- Mixed formatting in schedule strings (`19:00.1:00`, `21:00- 1:00`).
- Duplicate semantic items split by wording (day/night variants) requiring canonicalization policy.

---

This document is intended as the bridge between legacy commercial text and executable v3 pricing/constraint logic.
