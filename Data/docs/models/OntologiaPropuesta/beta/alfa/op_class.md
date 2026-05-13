# Primitiva: CategoriaOperacional

## Nota de nombre

Este documento reemplaza conceptualmente a `OP_CLASS`.

`OP_CLASS` queda como nombre legacy tecnico.
El nombre que describe mejor la idea es `CategoriaOperacional`.

## Idea

`CategoriaOperacional` describe la forma operacional del item dentro del sistema.

No describe el dominio comercial ni el area de negocio, sino la categoria funcional de la cosa que se esta cotizando.

## Pregunta que responde

**Que tipo operacional de item es esto?**

## Categorias operacionales iniciales

- `servicio`
- `producto`
- `recurso`
- `compuesto`

## Definiciones

### `servicio`

Item cuantificable que implica atencion, ejecucion o prestacion.

### `producto`

Item cuantificable de consumo o inventario.

### `recurso`

Item operacional reusable, por ejemplo personal, equipamiento o locacion.

### `compuesto`

Item orquestador que agrupa otros items.

## Regla central

La `CategoriaOperacional` define las propiedades estructurales del item.

En particular define:

- que propiedades existen
- cuales son activas
- cuales son descriptivas
- que combinaciones de propiedades alimentan pricing
- como esas propiedades pueden disparar ruling

## Relacion con pricing

`Pricing` no nace directamente desde la categoria operacional.

`Pricing` nace desde combinaciones de propiedades.
La `CategoriaOperacional` solo define el espacio estructural de propiedades sobre el cual ese pricing puede operar.

## Relacion con ruling

`Ruling` puede nacer desde cualquier propiedad relevante del item o de la linea cotizada.

## Ejemplos

- `buffet` -> area `cocina`, categoria_operacional `servicio`
- `sandwich` -> area `cocina`, categoria_operacional `producto`
- `salon` -> area `infraestructura`, categoria_operacional `recurso`
- `naufrago` -> area `teambuilding`, categoria_operacional `compuesto`
