# Data Model Map

## Objetivo

Fijar el mapa minimo del modelo antes de seguir detallando primitivas o tablas.

## Regla principal

El sistema se separa en tres capas abstractas:

1. `modelo base`
2. `cotizacion_time`
3. `motor logico`

## 1. Modelo base

El `modelo base` describe que cosas existen antes de ser cotizadas.

### Entidades abstractas

- `Area`
- `CategoriaOperacional`
- `CategoriaCatalogo`
- `ItemCatalogo`
- `PropiedadBase`

### Regla estructural

- `Area` y `CategoriaOperacional` son propiedades estructurales de alto nivel.
- `CategoriaCatalogo` e `ItemCatalogo` son **entidades tontas**.
- no contienen logica
- no calculan precio
- no disparan reglas
- solo contienen referencias, propiedades y metadata

### Funcion de cada pieza

- `Area`: dominio semantico del negocio
- `CategoriaOperacional`: tipo operacional del item
- `CategoriaCatalogo`: agrupador comercial tonto
- `ItemCatalogo`: item vendible tonto
- `PropiedadBase`: propiedades persistidas/configuradas en catalogo

## 2. Cotizacion time

`cotizacion_time` describe las entidades que existen cuando una cotizacion se esta armando.

### Entidades abstractas

- `Cotizacion`
- `LineaCotizada`
- `PropiedadRuntime`

### Regla estructural

- `LineaCotizada` instancia un `ItemCatalogo` en contexto real
- `Cotizacion` agrupa `LineasCotizadas`
- `PropiedadRuntime` fija valores efectivos para una linea

### Funcion de cada pieza

- `Cotizacion`: contenedor del evento cotizado
- `LineaCotizada`: compra concreta
- `PropiedadRuntime`: valor efectivo usado para calcular y validar

## 3. Motor logico

El `motor logico` es la unica capa que contiene comportamiento.

### Motores abstractos

- `Pricing`
- `Ruling`

### Regla estructural

- `Pricing` se alimenta **solo** de `PropiedadRuntime`
- `Ruling` puede depender de:
  - `Area`
  - `CategoriaOperacional`
  - `PropiedadBase`
  - `PropiedadRuntime`

## Dependencias entre capas

### Desde modelo base a cotizacion time

- `ItemCatalogo` se instancia como `LineaCotizada`
- `CategoriaCatalogo` organiza items del catalogo, no compras

### Desde cotizacion time a motor logico

- `Pricing` resuelve precio de una `LineaCotizada`
- `Ruling` evalua validez, restricciones y dependencias de una `LineaCotizada`

### Desde modelo base a motor logico

- `Area` aporta contexto semantico al `Ruling`
- `CategoriaOperacional` aporta contrato estructural al `Ruling`
- `PropiedadBase` aporta defaults o configuraciones persistidas al `Ruling`

## Formulas base

- `BaseItem = combine(Area, CategoriaOperacional)`
- `ItemCatalogo = data(BaseItem, CategoriaCatalogo, PropiedadBase[])`
- `LineaCotizada = instantiate(ItemCatalogo, PropiedadRuntime[])`
- `Pricing = f(PropiedadRuntime)`
- `Ruling = g(Area, CategoriaOperacional, PropiedadBase, PropiedadRuntime)`

## Regla de trabajo desde ahora

Si una pieza nueva contiene logica, no pertenece al `modelo base`.

Si una pieza nueva representa datos persistidos de catalogo, no pertenece a `cotizacion_time`.

Si una pieza nueva calcula o evalua, pertenece al `motor logico`.


## Refinamientos vigentes

### PropiedadBase vs PropiedadRuntime

- `PropiedadBase` = dato persistido del catalogo
- `PropiedadRuntime` = valor efectivo al cotizar

### CategoriaCatalogo vs CategoriaOperacional

- `CategoriaCatalogo` puede ser mixta
- `ItemCatalogo` debe instanciar exactamente una `CategoriaOperacional`
- se recomienda una `CategoriaOperacional` dominante por categoria catalogo


## Referencias de patron

Este mapa se alinea con una mezcla de patrones observables en ERPs grandes:

- `Odoo`: separacion entre catalogo/master data y documentos comerciales
- `OFBiz`: entidades declarativas + servicios duenos de la logica
- `ERPNext/Frappe`: cotizacion como documento transaccional con lineas concretas

### Traduccion a este modelo

- `modelo base` ~= master data
- `cotizacion_time` ~= documento transaccional
- `motor logico` ~= servicios de pricing/rules

### Decision de arquitectura

Se toma como referencia principal el patron de `OFBiz`:

- entidades tontas
- logica en motores/servicios
- runtime separado del catalogo
