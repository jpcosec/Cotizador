# Regla de composicion

## Objetivo

Definir como se arma un item desde la ontologia operacional.

## Regla base

La estructura de un item nace desde la combinacion de dos propiedades base:

- `Area`
- `CategoriaOperacional`

## Formula

`BaseItem = combine(Area, CategoriaOperacional)`

`ItemCatalogo = instantiate(BaseItem, Defaults, MetadataComercial)`

`LineaCotizada = instantiate(ItemCatalogo, RuntimeValues)`

## Consecuencias

### 1. Propiedades

Las propiedades estructurales del item vienen desde `CategoriaOperacional`.

`Area` y `CategoriaOperacional` son ellas mismas propiedades estructurales de alto nivel del item.

### 2. Pricing

`Pricing` viene solamente de combinaciones sobre propiedades.

No viene directamente desde `Area`, `Categoria` o `CategoriaOperacional` como etiquetas sueltas.

Ejemplos:

- `per_person` depende de `pax`
- `per_unit` depende de `cantidad`
- `per_time` depende de `duracion`
- `flat` puede depender de una seleccion de bloque, locacion o configuracion fija

### 3. Ruling

`Ruling` puede venir desde cualquier propiedad relevante.

Ejemplos:

- `pax` dispara capacidades
- `duracion` dispara limites de uso
- `hora_inicio` dispara ventanas horarias
- `locacion_id` dispara compatibilidades y restricciones
- `componentes` dispara dependencias

### 4. Categoria comercial

La `Categoria` comercial no crea estructura nueva.
Solo agrupa, contextualiza y presenta items derivados de `Area + CategoriaOperacional`.
