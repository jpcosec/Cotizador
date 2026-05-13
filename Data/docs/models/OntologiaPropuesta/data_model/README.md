# Data Model

Nueva definicion base del modelo.

## Documentos activos

- `data_model_map.md`
- `data_model_map.puml`
- `DataModelMap.svg`
- `categoria_catalogo.md`
- `item_catalogo.md`
- `propiedad.md`
- `cotizacion_time.md`
- `pricing_ruling.md`

## Regla central

El nodo central del modelo base es `CategoriaCatalogo`.

Todo item hereda su estructura solo a traves de esa entidad.

- `spec/`
- `spec/data_model_map.component.yaml`
- `spec/quote_resolution.sequence.yaml`
- `spec/quotation_lifecycle.state.yaml`
- `spec/quotation_flow.activity.yaml`

- `casos_validacion_modelo.md`
