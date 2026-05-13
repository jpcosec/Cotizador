# Data Model Map

## Objetivo

Definir el mapa vigente del sistema partiendo desde cero.

## Capas abstractas

1. `modelo base`
2. `cotizacion_time`
3. `operaciones logicas`

## 1. Modelo base

### Entidades

- `CategoriaCatalogo`
- `ItemCatalogo`
- `Propiedad`

### Encapsulados dentro de `CategoriaCatalogo`

- `Area`
- `CategoriaOperacional`
- `PropiedadesBase`
- `PricingOp`
- `RulingOp`

### Regla

`CategoriaCatalogo` es el verdadero contenedor estructural del catalogo.

No se modela `ItemCatalogo` como entidad conversando directo con `Area`, `CategoriaOperacional` o `Propiedad`.
Todo eso llega encapsulado desde `CategoriaCatalogo`.

## 2. Cotizacion time

### Entidades

- `Cotizacion`
- `LineaCotizada`
- `PropiedadRuntime`

### Regla

`LineaCotizada` contiene solo un `ItemCatalogo` mas overrides runtime.

No interactua directo con `Area`, `CategoriaOperacional` ni `Propiedad`; lo hace solo a traves del item heredado.

## 3. Operaciones logicas

### Operaciones

- `Pricing`
- `Ruling`

### Regla

Ambas son operaciones de `CategoriaCatalogo`.

No viven en `ItemCatalogo`.
No viven en `LineaCotizada`.

## Formulas base

- `CategoriaCatalogo = { Area, CategoriaOperacional, PropiedadesBase, PricingOp, RulingOp }`
- `ItemCatalogo = instancia(CategoriaCatalogo, ItemDefaults, ItemMetadata)`
- `LineaCotizada = instancia(ItemCatalogo, RuntimeOverrides)`
- `PropiedadesEfectivas = resolve(CategoriaDefaults, ItemDefaults, RuntimeOverrides)`
- `Pricing = CategoriaCatalogo.pricing(PropiedadesEfectivas)`
- `Ruling = CategoriaCatalogo.ruling(PropiedadesEfectivas, QuoteContext)`

## Consecuencias

### Sobre items

- `CategoriaCatalogo` e `ItemCatalogo` son entidades tontas
- contienen datos, referencias y defaults
- no contienen logica de calculo o validacion

### Sobre pricing

- `Pricing` se alimenta de propiedades efectivas runtime
- conceptualmente es una operacion definida por la categoria catalogo

### Sobre ruling

- `Ruling` puede usar propiedades efectivas y contexto de cotizacion
- conceptualmente es una operacion definida por la categoria catalogo

## Regla de trabajo

Toda pieza nueva debe responder primero a una de estas preguntas:

- es contenedor estructural de catalogo?
- es dato runtime de cotizacion?
- es operacion logica?
