# Propiedades minimas por OP_CLASS

## Regla base

Las propiedades estructurales nacen en `OP_CLASS`.

Esto significa que si un item cambia de `OP_CLASS`, cambia su contrato de propiedades.

## `servicio`

### Propiedades minimas sugeridas

- `pax` o criterio equivalente de atencion
- `hora_inicio`
- `duracion`
- `locacion_id` cuando aplique

### Propiedades opcionales comunes

- `bloque_horario`
- `nivel_servicio`
- `requiere_montaje`
- `equipo_asignado`

### Ejemplos

- buffet
- desayuno
- masaje
- karaoke
- early checkin

## `producto`

### Propiedades minimas sugeridas

- `cantidad`
- `unidad`
- `sku` o identificador de inventario

### Propiedades opcionales comunes

- `peso`
- `volumen`
- `temperatura_servicio`
- `bodega_origen`

### Ejemplos

- sandwich
- torta
- vino
- gorro piscina
- papelografo

## `recurso`

### Propiedades minimas sugeridas

- `subtipo_recurso`
- `capacidad` o `unidad_capacidad`
- `disponibilidad_base`

### Propiedades opcionales comunes

- `locacion_fisica`
- `requiere_reserva`
- `operador_asociado`
- `exclusividad`

### Ejemplos

- salon
- microfono
- DJ
- masajista
- kayak

## `compuesto`

### Propiedades minimas sugeridas

- `componentes`
- `pax`
- `duracion`
- `locacion_id`

### Propiedades opcionales comunes

- `agenda_interna`
- `orden_ejecucion`
- `responsable_operativo`
- `regla_de_fallback`

### Ejemplos

- evento teambuilding
- pack alojamiento
- programa wellness
