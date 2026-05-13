# Primitiva: Ruling

## Idea

`Ruling` es la capa normativa del modelo.
Describe reglas, restricciones, dependencias y validaciones que gobiernan el comportamiento del item.

## Pregunta que responde

**Que condiciones debe cumplir este item para ser valido, disponible o coherente?**

## Tipos de ruling

- restricciones duras
- warnings
- dependencias
- compatibilidades
- minimos / maximos
- ventanas horarias
- ratios
- capacidad
- anticipacion

## Origen del ruling

El `ruling` puede venir de distintas capas:

- desde `OP_CLASS`
- desde `Area`
- desde `Categoria`
- desde `Item_Catalogo` como override excepcional

## Regla importante

El ruling no pertenece solo al item final.
Se compone.

## Composicion sugerida

`Ruling_Final = merge(Ruling_Area, Ruling_OP_CLASS, Ruling_Categoria, Ruling_ItemOverride)`

## Ejemplos

- `servicio` puede exigir horario y duracion
- `cocina` puede restringir desayuno a cierta franja
- `teambuilding` puede exigir minimo 10 pax
- `alojamiento` puede imponer check-in/out
- una categoria concreta puede definir min/max pax comercial
