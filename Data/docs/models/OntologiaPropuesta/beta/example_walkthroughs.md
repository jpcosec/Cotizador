# Ejemplos completos sobre el mapa nuevo

## Ejemplo 1: Buffet desayuno premium

### Modelo base

- `Area = cocina`
- `CategoriaOperacional = servicio`
- `CategoriaCatalogo = Desayunos`
- `PropiedadBase`:
  - `bloque_horario_default = desayuno`
  - `duracion_default = 90`
  - `formato_servicio = buffet`
  - `nivel_servicio = premium`

### Cotizacion time

- `Cotizacion`:
  - `pax_total = 80`
  - `fecha = 2026-11-14`
- `LineaCotizada`:
  - `pax = 80`
  - `hora_inicio = 09:00`
  - `duracion = 90`
  - `locacion_id = COMEDOR_VIP`

### Motor logico

- `Pricing` usa runtime:
  - `per_person * pax`
- `Ruling` usa:
  - `Area = cocina`
  - `CategoriaOperacional = servicio`
  - `formato_servicio = buffet`
  - `pax = 80`

### Lectura

- item catalogo no calcula nada
- pricing sale de `pax`
- ruling cruza base + runtime

## Ejemplo 2: Sandwich ave mayo

### Modelo base

- `Area = cocina`
- `CategoriaOperacional = producto`
- `CategoriaCatalogo = Sandwiches`
- `PropiedadBase`:
  - `unidad = und`
  - `sku = SND-AVE-MAYO`
  - `temperatura_servicio = frio`

### Cotizacion time

- `Cotizacion`:
  - `pax_total = 80`
  - `fecha = 2026-11-14`
- `LineaCotizada`:
  - `cantidad = 80`

### Motor logico

- `Pricing` usa runtime:
  - `per_unit * cantidad`
- `Ruling` usa:
  - `Area = cocina`
  - `CategoriaOperacional = producto`
  - `cantidad = 80`
  - `sku`

### Lectura

- el item trae metadata de inventario
- la compra real nace en la linea
- el calculo usa `cantidad`, no la categoria

## Ejemplo 3: Salon Chinook uso diurno

### Modelo base

- `Area = infraestructura`
- `CategoriaOperacional = recurso`
- `CategoriaCatalogo = Salones`
- `PropiedadBase`:
  - `subtipo_recurso = locacion`
  - `capacidad_max = 320`
  - `bloque_horario_default = uso_diurno`

### Cotizacion time

- `Cotizacion`:
  - `pax_total = 280`
  - `fecha = 2026-11-14`
- `LineaCotizada`:
  - `pax = 280`
  - `hora_inicio = 08:30`
  - `duracion = 660`
  - `locacion_id = SALON_CHINOOK`

### Motor logico

- `Pricing` usa runtime:
  - bloque de uso + duracion efectiva
- `Ruling` usa:
  - `capacidad_max = 320`
  - `pax = 280`
  - `Area = infraestructura`
  - `CategoriaOperacional = recurso`

### Lectura

- `capacidad_max` vive en base
- `pax` vive en runtime
- la violacion o no se decide en ruling

## Ejemplo 4: Naufrago

### Modelo base

- `Area = teambuilding`
- `CategoriaOperacional = compuesto`
- `CategoriaCatalogo = Teambuilding guiado`
- `PropiedadBase`:
  - `duracion_default = 120`
  - `componentes_default = [guia, actividad, recarga]`

### Cotizacion time

- `Cotizacion`:
  - `pax_total = 24`
  - `fecha = 2026-11-14`
- `LineaCotizada`:
  - `pax = 24`
  - `hora_inicio = 15:00`
  - `duracion = 120`
  - `locacion_id = OUTDOOR_LAGUNA`
  - `componentes = [actividad_base, guia, recarga_1]`

### Motor logico

- `Pricing` usa runtime:
  - `componentes + pax + duracion`
- `Ruling` usa:
  - `Area = teambuilding`
  - `CategoriaOperacional = compuesto`
  - `componentes`
  - `pax`
  - `locacion_id`

### Lectura

- el compuesto no mezcla ontologias
- el item sigue siendo tonto
- la linea concreta activa todo el calculo
