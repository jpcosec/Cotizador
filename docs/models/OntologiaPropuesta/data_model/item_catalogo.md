# Entidad: ItemCatalogo

## Idea

`ItemCatalogo` es una instancia tonta de `CategoriaCatalogo`.

## Contiene

- referencia a `CategoriaCatalogo`
- defaults propios del item
- metadata propia del item
- valores descriptivos persistidos

## No contiene

- logica de pricing
- logica de ruling
- acceso estructural directo a `Area` o `CategoriaOperacional`

## Formula

`ItemCatalogo = instancia(CategoriaCatalogo, ItemDefaults, ItemMetadata)`
