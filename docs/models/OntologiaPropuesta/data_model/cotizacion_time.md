# Cotizacion Time

## Entidades

- `Cotizacion`
- `LineaCotizada`
- `PropiedadRuntime`

## Regla

`LineaCotizada` contiene solo un `ItemCatalogo` y valores runtime.

No referencia de forma estructural directa a `Area`, `CategoriaOperacional` o `PropiedadBase`.
Todo eso llega indirectamente a traves del item heredado.

## Formula

- `LineaCotizada = instancia(ItemCatalogo, RuntimeOverrides)`
- `Cotizacion = ContextoGlobal + LineasCotizadas`
