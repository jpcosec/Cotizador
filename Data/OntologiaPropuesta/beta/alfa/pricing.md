# Primitiva: Pricing

## Idea

`Pricing` es la capa que define como se calcula economicamente un item.

No es solo el precio final, sino el patron de calculo que el sistema debe aplicar.

## Pregunta que responde

**Como se transforma la cantidad operacional del item en valor monetario?**

## Inputs tipicos

- `pax`
- `cantidad`
- `duracion`
- `bloque_horario`
- `locacion`
- `temporada` opcional

## Patrones iniciales

- `flat`
- `per_person`
- `per_unit`
- `per_time`
- `base_plus_variable`
- `compuesto`

## Origen del pricing

El pricing base nace desde `OP_CLASS` y puede ser modulado por `Categoria`.

## Regla de composicion

`Pricing_Final = resolve(Pricing_OP_CLASS, Pricing_Categoria, Pricing_ItemOverride)`

## Ejemplos

- `producto` suele tender a `per_unit`
- `servicio` suele tender a `per_person`, `per_time` o `base_plus_variable`
- `recurso|locacion` suele tender a `flat` o `per_time`
- `compuesto|evento` puede combinar varios pricing internos

## Relacion con item

`ITEM_CATALOGO` no deberia inventar un pricing arbitrario desde cero.
Idealmente hereda un patron desde la composicion `Area + OP_CLASS + Categoria` y solo overridea parametros puntuales.
