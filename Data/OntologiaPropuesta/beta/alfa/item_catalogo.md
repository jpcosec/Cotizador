# Primitiva: ItemCatalogo

## Idea

`ItemCatalogo` es una instancia catalogable de una combinacion operacional.

## Formula base

`ItemCatalogo = instancia(Area, CategoriaOperacional, Defaults, MetadataComercial)`

## Regla central

Un item no se define primero por categoria comercial.
Un item se define primero por una combinacion de:

- `Area`
- `CategoriaOperacional`

Luego la categoria comercial lo agrupa y presenta.

## Que hereda un item

El `ItemCatalogo` hereda:

- estructura de propiedades desde `CategoriaOperacional`
- contexto de dominio desde `Area`
- contexto comercial desde `Categoria`

## Pricing y ruling

- `Pricing` se resuelve a partir de combinaciones sobre propiedades
- `Ruling` puede activarse desde cualquier propiedad relevante

## Rol del item

El item:

- fija defaults
- fija metadata comercial
- fija valores descriptivos propios
- queda disponible para ser instanciado como `LineaCotizada`

## Ejemplos

- `Sandwich ave mayo` = instancia de `cocina + producto`
- `Buffet desayuno premium` = instancia de `cocina + servicio`
- `Salon Chinook uso diurno` = instancia de `infraestructura + recurso`
- `Naufrago` = instancia de `teambuilding + compuesto`
