# CotizadorLodge - Data

Datos y especificaciones para construir el motor del cotizador.

## Estructura

```text
docs/                  Documentacion y specs del modelo
scripting/             Espacio reservado para scripts/utilidades del pipeline
data/raw/              Fuentes crudas e historicas
data/processed/        Salidas procesadas para modelado y motor
```

## Data cruda

- `data/raw/source/`
  - excels fuente y dumps de apoyo
- `data/raw/repo_cotizaciones/`
  - archivo historico de cotizaciones reales
- `data/raw/2025/`, `data/raw/2026/`
  - CSVs crudos por ano extraidos desde las planillas
- `data/raw/Data_Historica.csv`
  - historico tabular adicional

## Data procesada

- `data/processed/items_enriched.json`
- `data/processed/pricing.csv`
- `data/processed/rules.csv`
- `data/processed/categories.csv`
- `data/processed/2025/extracted/`
- `data/processed/2026/extracted/`

## Docs

- `docs/README.md`
- `docs/models/OntologiaPropuesta/`
- `docs/models/Ortogonalizacion.mup`

## Scripting

Hoy no hay scripts activos en esta carpeta. Se deja separada para futuras utilidades de pipeline o conversion.
