# Primitiva: Area

## Idea

`Area` representa el dominio del negocio al que pertenece la oferta.

A diferencia de `OP_CLASS`, no define como opera el item, sino desde que contexto semantico y operativo se interpreta.

## Pregunta que responde

**De que mundo del negocio viene esta oferta?**

## Ejemplos iniciales

- `cocina`
- `bebidas_bar`
- `alojamiento`
- `spa_wellness`
- `teambuilding`
- `infraestructura`
- `operacional`

## Que define `Area`

`Area` define principalmente:

- lenguaje del dominio
- restricciones generales del dominio
- semantica de los items
- posibles subareas o taxonomia comercial asociada

## Lo que no define

`Area` no define por si sola:

- todas las propiedades requeridas
- la cuantificacion exacta
- la forma operacional del item

Eso lo define `OP_CLASS`.

## Relacion con Categoria

Una `Categoria` comercial cuelga de un `Area`.

Ejemplo:

- `Sandwiches` -> area `cocina`
- `Masajes` -> area `spa_wellness`
- `Teambuilding guiado` -> area `teambuilding`

## Relacion con ruling

`Area` aporta `ruling` de dominio.

Ejemplos:

- cocina: ventanas desayuno/almuerzo/cena
- alojamiento: check-in/check-out, ocupacion
- spa: cupo, anticipacion, disponibilidad
- teambuilding: seguridad, ratio de guiado
