# Data Model

Este directorio define las primitivas base del modelo de datos antes de reconstruir diagramas o tablas derivadas.

## Primitivas activas

- `propiedad.md`
- `op_class.md`
- `area.md`
- `ruling.md`
- `pricing.md`
- `categoria.md`
- `item_catalogo.md`
- `cotizacion.md`
- `linea_cotizada.md`
- `cotizacion_flow.md`
- `composition_rule.md`
- `contrato_item.md`
- `inheritance_matrix.md`
- `property_catalog.md`
- `op_class_matrix.md`
- `override_rules.md`
- `composition_components.puml`
- `CompositionComponents.svg`
- `inheritance_components.puml`
- `InheritanceComponents.svg`
- `op_class_property_tables.puml`
- `OPClassPropertyTables.svg`
- `data_model_map.puml`
- `DataModelMap.svg`

## Regla de trabajo

Primero se estabilizan estas primitivas.
Luego se define como se componen en `CATEGORIA` y `ITEM_CATALOGO`.


## Siguiente capa

Con estas primitivas ya se puede definir formalmente como una `Categoria` hereda de `Area`, consume `OP_CLASS` y produce el contrato que instancia `ItemCatalogo`.


## Archivado

- `deprecated_v1/`: documentos reemplazados por versiones mas nuevas del modelo.
- `deprecated_v1/op_class_properties.md`: reemplazado por `property_catalog.md` y `op_class_matrix.md`.
