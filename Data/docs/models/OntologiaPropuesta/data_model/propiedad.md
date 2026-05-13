# Entidad: Propiedad

## Idea

`Propiedad` describe un dato que puede participar en la estructura del item o en su instanciacion runtime.

## Tipos utiles

- `PropiedadBase`
  - default o configuracion persistida en `CategoriaCatalogo` o `ItemCatalogo`
- `PropiedadRuntime`
  - valor efectivo en `LineaCotizada`
- `PropiedadEfectiva`
  - resultado de resolver base + item + runtime

## Regla

Las propiedades llegan al item a traves de `CategoriaCatalogo`.
Luego pueden ser refinadas por defaults del item y finalmente overrideadas en cotizacion.

## Formula

`PropiedadEfectiva = resolve(CategoriaDefaults, ItemDefaults, RuntimeOverrides)`
