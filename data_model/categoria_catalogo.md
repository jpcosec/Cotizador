# Entidad: CategoriaCatalogo

## Idea

`CategoriaCatalogo` es el contenedor estructural del catalogo.

## Contiene

- `Area`
- `CategoriaOperacional`
- `PropiedadesBase`
- `PricingOp`
- `RulingOp`
- metadata comercial

## Rol

- agrupa comercialmente
- define la estructura del item de forma encapsulada
- expone defaults y operaciones para sus items

## Regla

Todo `ItemCatalogo` hereda desde una `CategoriaCatalogo`.

No deberia tener interfaz estructural directa con `Area`, `CategoriaOperacional` o `Propiedad` por fuera de esa herencia.
