# Primitiva: Propiedad

## Idea

`Propiedad` es la unidad minima de dato que un item necesita instanciar para existir o cotizarse correctamente.

Es la primitiva que reemplaza a lo que antes estabamos llamando de forma muy amplia `dimension`.

## Definicion

Una `Propiedad` describe:

- un dato esperado por el sistema
- su tipo
- si es obligatorio u opcional
- quien lo exige
- como se valida

## Pregunta que responde

**Que valor concreto necesito pedir, inferir o guardar para poder materializar un item?**

## Ejemplos

- `pax`
- `cantidad`
- `duracion`
- `hora_inicio`
- `locacion_id`
- `checkin_date`
- `tipo_habitacion`
- `temperatura_servicio`
- `inventario_sku`

## Campos sugeridos

- `ID_Propiedad`
- `Nombre`
- `Tipo_Dato`
- `Unidad` opcional
- `Es_Obligatoria`
- `Valor_Default` opcional
- `Source` (`manual`, `derivado`, `contexto`, `catalogo`)
- `Descripcion`

## Rol en el modelo

La `Propiedad` no define comportamiento por si sola.
La `Propiedad` es consumida por una `OP_CLASS`.

Es decir:

- `OP_CLASS` define que propiedades necesita
- `ITEM_CATALOGO` instancia valores para esas propiedades

## Ejemplo conceptual

- `servicio|cocina` puede exigir:
  - `pax`
  - `hora_inicio`
  - `duracion`
  - `locacion_id`
- `producto|cocina` puede exigir:
  - `cantidad`
  - `sku`
  - `unidad`
