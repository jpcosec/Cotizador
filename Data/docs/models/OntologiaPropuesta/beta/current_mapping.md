# Mapeo actual al patron objetivo

## Objetivo

Mapear las piezas actuales del proyecto al patron `master data / transaction / services`.

## Master Data

### Actual

- `Data/processed_data/items_enriched.json`
- `Data/processed_data/categories.csv`
- `Data/processed_data/pricing.csv`
- `Data/processed_data/rules.csv`
- `dev/data/db.json` en sus tablas de catalogo/configuracion

### Lectura

- `items_enriched.json` se parece a `ItemCatalogo` bruto
- `categories.csv` se parece a `CategoriaCatalogo`
- `pricing.csv` y `rules.csv` son configuraciones de motor, no compras
- `PERFILES_INICIALIZACION` es master/config, no transaction

## Transaction

### Actual

- hoy esta mucho menos explicito en `Data/`
- el runtime de `dev/` ya apunta a una instancia de item en canasta/cotizacion
- el equivalente conceptual es lo que hemos llamado `LineaCotizada`

### Lectura

- falta una tabla/documento transaccional limpio que snapshottee:
  - item
  - fecha
  - hora
  - pax
  - cantidad
  - duracion
  - precio resuelto
  - reglas aplicadas

## Services

### Actual

- `dev/src/services/pricing/**`
- `dev/src/services/pricing/rules/**`
- `Item`, `ItemCalculator`, `RulesCoordinator`

### Lectura

- aqui ya vive una parte importante del patron correcto
- la logica real ya esta mas cerca de OFBiz que de un modelo activo en la entidad

## Mapeo resumido

| Patron objetivo | Piezas actuales |
|---|---|
| `Master Data` | `items_enriched.json`, `categories.csv`, `pricing.csv`, `rules.csv`, `PERFILES_*` |
| `Transaction` | runtime de item/cesta/cotizacion aun no formalizado en `Data/` |
| `Services` | `dev/src/services/pricing/**`, reglas y calculadoras |

## Conclusion

El proyecto ya tiene embriones de las tres capas, pero:

- `master data` esta mas avanzado en `Data/`
- `services` esta mas avanzado en `dev/`
- `transaction` aun no esta formalizado como modelo limpio intermedio
