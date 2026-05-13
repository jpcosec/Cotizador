# PropiedadBase vs PropiedadRuntime

## Objetivo

Separar con claridad los datos persistidos del catalogo de los valores efectivos usados al cotizar.

## Regla principal

- `PropiedadBase` vive en el modelo base
- `PropiedadRuntime` vive en `cotizacion_time`

## PropiedadBase

### Idea

Es un dato persistido asociado al catalogo.
No representa una compra concreta, sino configuracion, default o metadata del item.

### Pregunta que responde

**Que dato viene predefinido en el catalogo antes de cotizar?**

### Ejemplos

- `unidad = und`
- `sku = SND-AVE-MAYO`
- `nivel_servicio = premium`
- `bloque_horario_default = desayuno`
- `capacidad_max = 320`
- `subtipo_recurso = locacion`

### Uso

- describe el item
- aporta defaults
- aporta configuracion persistida al `Ruling`
- no basta por si sola para calcular una compra concreta

## PropiedadRuntime

### Idea

Es el valor efectivo que toma una propiedad cuando el item se instancia dentro de una cotizacion.

### Pregunta que responde

**Que valor concreto usa esta linea cotizada ahora?**

### Ejemplos

- `pax = 80`
- `cantidad = 80`
- `fecha = 2026-11-14`
- `hora_inicio = 09:00`
- `duracion = 90`
- `locacion_id = SALON_CHINOOK`

### Uso

- alimenta pricing
- alimenta ruling
- representa el estado efectivo de la linea

## Relacion entre ambas

`PropiedadRuntime` puede:

- heredar un default desde `PropiedadBase`
- reemplazarlo
- complementarlo
- materializar una propiedad que en base estaba solo declarada

## Regla de resolucion

`PropiedadEfectiva = resolve(PropiedadBase, PropiedadRuntime)`

## Ejemplos rapidos

### Caso 1

- base: `bloque_horario_default = desayuno`
- runtime: no informado
- efectiva: `desayuno`

### Caso 2

- base: `duracion_default = 90`
- runtime: `duracion = 120`
- efectiva: `120`

### Caso 3

- base: `capacidad_max = 320`
- runtime: `pax = 350`
- efectiva:
  - pricing usa `pax = 350`
  - ruling detecta violacion de capacidad
