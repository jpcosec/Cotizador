# Primitiva derivada: BaseItem / ContratoItem

## Idea

El contrato del item nace desde la combinacion operacional base.

## Formula

`BaseItem = combine(Area, CategoriaOperacional)`

A partir de esa base se obtiene un `ContratoItem` cuando se agregan:

- defaults
- metadata comercial
- restricciones contextuales

## Pregunta que responde

**Que forma estructural tiene este item antes de ser comprado?**

## Que define la base

La combinacion `Area + CategoriaOperacional` define:

- el tipo de item
- el dominio donde opera
- el conjunto de propiedades relevantes
- el espacio de pricing posible
- el espacio de ruling posible

## Relacion con propiedades

Las propiedades estructurales se heredan desde `CategoriaOperacional`.

`Area` aporta semantica de dominio sobre esas propiedades.

## Relacion con pricing

`Pricing` se calcula desde combinaciones entre propiedades activas.

## Relacion con ruling

`Ruling` puede activarse desde cualquier propiedad activa relevante.

## Resultado esperado

El `ContratoItem` debe permitir saber:

- que propiedades existen
- cuales afectan pricing
- cuales pueden activar ruling
- que item concreto puede construirse encima
