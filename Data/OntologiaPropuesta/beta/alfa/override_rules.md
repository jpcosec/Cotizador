# Reglas de override de propiedades

## Idea

Las propiedades son overrideables, pero el override ocurre por capas y con restricciones.

## Regla general

Se overridea el **valor** de una propiedad, no su existencia estructural.

La existencia estructural nace en `OP_CLASS`.

## Capas de override

### 1. `OP_CLASS`

Define:

- que propiedades existen
- cuales son obligatorias
- cuales son activas o descriptivas
- como participan en pricing y ruling

No es una capa de override libre.
Es la capa estructural.

### 2. `Categoria`

Puede overridear o modular:

- defaults comerciales
- restricciones comerciales
- defaults contextuales

Ejemplos:

- `bloque_horario = desayuno`
- `duracion_default = 90`
- `locacion_preferida = comedor`

No deberia crear propiedades estructurales nuevas.

### 3. `ItemCatalogo`

Puede overridear:

- defaults concretos de la oferta
- metadata descriptiva
- parametros operativos preconfigurados

Ejemplos:

- `sku`
- `unidad`
- `nivel_servicio`
- `capacidad_max`

### 4. `LineaCotizada`

Puede fijar el valor efectivo runtime dentro de una cotizacion.

Ejemplos:

- `pax = 80`
- `fecha = 2026-11-14`
- `hora_inicio = 09:00`
- `duracion = 120`
- `locacion_id = SALON_CHINOOK`

## Propiedades no overrideables libremente

No deberia permitirse override de:

- tipo de dato
- existencia estructural
- clasificacion activa/descriptiva
- propiedades derivadas de solo lectura

## Propiedades derivadas

Algunas propiedades existen solo como resultado de resolucion:

- `precio_base_ref`
- `precio_variable_ref`

Estas se marcan como `derived_only`.
