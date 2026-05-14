# Ontologia Propuesta

## Estructura

- `legacy_v0/`
  - exploraciones antiguas ya deprecadas
- `beta/`
  - iteracion anterior completa del data model
- `data_model/`
  - redefinicion actual desde cero

## Regla actual

La version vigente parte desde una encapsulacion mas estricta:

- `CategoriaCatalogo` encapsula `Area`, `CategoriaOperacional`, `Propiedades`, `PricingOp` y `RulingOp`
- `ItemCatalogo` hereda todo solo a traves de `CategoriaCatalogo`
- `LineaCotizada` contiene `ItemCatalogo` y overrides runtime
- `Pricing` y `Ruling` son operaciones de `CategoriaCatalogo`
