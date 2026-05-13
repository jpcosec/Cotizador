# Politica de CategoriaCatalogo y CategoriaOperacional

## Pregunta

`CategoriaCatalogo` debe referenciar una sola `CategoriaOperacional` o varias?

## Recomendacion

- por defecto: una sola `CategoriaOperacional` dominante
- excepcionalmente: varias permitidas si la categoria comercial es mixta

## Regla recomendada

`CategoriaCatalogo` deberia tener:

- `CategoriaOperacional_Dominante`
- `CategoriasOperacionales_Compatibles[]` opcional

## Por que

### Ventaja de una dominante

- simplifica catalogo
- simplifica UI
- simplifica mapeo de propiedades
- simplifica defaults y naming

### Por que permitir varias

Hay categorias comerciales que naturalmente mezclan formas operacionales, por ejemplo:

- `Desayunos`
  - puede incluir `servicio`
  - puede incluir `producto`
- `Salones`
  - puede incluir `recurso`
  - puede incluir `servicio`
- `Spa`
  - puede incluir `servicio`
  - puede incluir `producto`

## Regla operativa

- una `CategoriaCatalogo` puede agrupar varios tipos operacionales
- pero cada `ItemCatalogo` debe instanciar exactamente una sola `CategoriaOperacional`

## Formula

- `CategoriaCatalogo -> 1 dominante + N compatibles`
- `ItemCatalogo -> 1 CategoriaOperacional`

## Ejemplo

### CategoriaCatalogo: Desayunos

- dominante: `servicio`
- compatibles: `producto`

Items:

- `Buffet desayuno premium` -> `servicio`
- `Box desayuno individual` -> `producto`

## Decision propuesta

Tomar esta politica como base:

- categoria comercial puede ser mixta
- item concreto nunca es mixto a nivel operacional
