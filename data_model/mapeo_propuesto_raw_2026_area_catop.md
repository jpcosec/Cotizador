# Propuesta de mapeo raw 2026 a area/subarea y catop/subcatop

Fuente generada desde `Data/data/processed/items_enriched.json` filtrando `year=2026`, usando heuristicas semanticas por item y categoria fuente.

## Archivo canonico

- `Data/docs/models/OntologiaPropuesta/data_model/mapeo_propuesto_raw_2026_area_catop.csv`

## Resumen global area | catop

- `alojamiento | servicio`: 9 items
- `bebidas_bar | producto`: 12 items
- `bebidas_bar | servicio`: 9 items
- `cocina | compuesto`: 1 items
- `cocina | producto`: 2 items
- `cocina | servicio`: 17 items
- `infraestructura | recurso`: 26 items
- `infraestructura | servicio`: 1 items
- `operacional | servicio`: 3 items
- `spa_wellness | recurso`: 2 items
- `spa_wellness | servicio`: 1 items
- `teambuilding | compuesto`: 6 items
- `teambuilding | recurso`: 5 items
- `teambuilding | servicio`: 13 items

## Resumen global subarea | subcatop

- `alimentacion | meal_box`: 1 items
- `alimentacion | servicio_comida`: 14 items
- `alimentacion | snack_unitario`: 1 items
- `bar_abierto | servicio_bar`: 9 items
- `bebidas | barril`: 1 items
- `bebidas | bebida_unidad`: 2 items
- `bebidas | botella`: 3 items
- `bebidas | ticket`: 6 items
- `cabana | estadia`: 3 items
- `coffee_break | coffee_break`: 3 items
- `dinamicas_grupales | evento`: 6 items
- `espacios_experiencia | uso_espacio`: 1 items
- `experiencias_gastronomicas | experiencia`: 1 items
- `hotel | estadia`: 6 items
- `masajes | personal`: 1 items
- `masajes | tratamiento`: 1 items
- `montaje | ajuste_operativo`: 2 items
- `outdoor | actividad_guiada`: 13 items
- `outdoor | equipamiento`: 4 items
- `outdoor | personal`: 1 items
- `piscina | locacion`: 1 items
- `salones_arriendo | locacion`: 8 items
- `salones_capacidad | locacion`: 18 items
- `tecnica_eventos | soporte_tecnico`: 1 items

## Criterios usados

- `area` captura el dominio del negocio
- `subarea` captura la familia interna del dominio (`alimentacion`, `bar_abierto`, `salones_capacidad`, `hotel`, etc.)
- `catop` captura la categoria operacional principal (`servicio`, `producto`, `recurso`, `compuesto`)
- `subcatop` afina la operacion (`locacion`, `personal`, `equipamiento`, `servicio_bar`, `estadia`, `evento`, etc.)

## Tensiones abiertas

- Alojamiento sigue propuesto como `servicio | estadia`, pero podria requerir redefinicion posterior.
- `Cata de vinos` y `Naufrago` siguen como candidatos mas debatibles en `compuesto`.
- Algunos items de infraestructura con experiencia armada pueden oscilar entre `recurso|locacion` y `servicio|uso_espacio`.

## Exportes alternativos

- `mapeo_propuesto_raw_2026_area_catop.csv` usa coma `,` como separador estandar CSV.
- `mapeo_propuesto_raw_2026_area_catop.scsv` usa punto y coma `;` para LibreOffice en locales ES/CL.
- `mapeo_propuesto_raw_2026_area_catop.tsv` usa tabulacion por si quieres importacion robusta.


## Version traducida

- `mapeo_propuesto_raw_2026_area_catop_es.csv`
- `mapeo_propuesto_raw_2026_area_catop_es.scsv`
