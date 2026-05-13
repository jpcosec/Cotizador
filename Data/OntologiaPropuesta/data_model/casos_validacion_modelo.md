# Casos de validacion del modelo

## Metodo

Este documento valida el `data_model` vigente contra casos reales extraidos desde `Data/processed_data/`.

Regla usada para leer cada caso:
- `CategoriaCatalogo` encapsula `Area`, `CategoriaOperacional`, `PropiedadesBase`, `PricingOp` y `RulingOp`.
- `ItemCatalogo` hereda todo solo a traves de `CategoriaCatalogo`.
- `LineaCotizada` contiene `ItemCatalogo` + overrides runtime.
- `Pricing` opera sobre `PropiedadesEfectivas`.
- `Ruling` opera sobre `PropiedadesEfectivas` + `QuoteContext`.

## Caso 1 - Desayuno

### Fuente real
- item_id: `DESAYUNO`
- year: `2025`
- category: `precios_alimentacion_y_banqueteria`
- subcategory: `Gastronomia`
- pricing_id(s): `PRICE_DESAYUNO_0011`
- rule_id(s): ninguno
- source_file: `precios_alimentacion_y_banqueteria.csv`

### Lectura del dato actual
- item real: `Desayuno`
- raw:
  - `Hora = 8:30-10:00`
  - `Uds = 1`
  - `Nº Pax = 1`
  - `Valor neto = 12500`
- pricing actual:
  - `expression_type = per_person`
  - `variable_value = 12500 CLP`
- reglas actuales: ninguna explicita

### Traduccion al modelo nuevo
- `CategoriaCatalogo`:
  - nombre comercial: `Desayunos`
  - area encapsulada: `cocina`
  - categoria operacional encapsulada: `servicio`
  - pricing op: `per_person`
  - ruling op: validaciones basicas de horario/servicio si existieran
- `ItemCatalogo`:
  - item: `Desayuno`
  - defaults de item: ninguno fuerte fuera de glosa y precio por persona
- `PropiedadBase`:
  - `bloque_horario_default = desayuno`
  - `hora_referencia = 8:30-10:00`
  - `formato_servicio = desayuno buffet/servicio alimentacion`
- `PropiedadRuntime`:
  - `pax`
  - `fecha`
  - `hora_inicio`
  - `duracion` opcional
  - `locacion_id` opcional
- `PropiedadEfectiva`:
  - resuelve `pax` real de la linea + bloque desayuno + hora efectiva
- `Pricing`:
  - `12500 * pax`
- `Ruling`:
  - hoy no viene explicito, pero podria colgar de hora/bloque si el negocio lo exige

### Test de consistencia
- calza bien que el item herede una estructura `cocina + servicio` desde la categoria catalogo
- pricing solo necesita `pax` runtime para funcionar
- la hora del CSV parece mas bien default/base que valor runtime definitivo
- no rompe la encapsulacion del modelo

### Veredicto
- `OK`

## Caso 2 - Gorros de piscinas lycra

### Fuente real
- item_id: `GORRO_PISCINA_LYCRA`
- year: `2025`
- category: `precios_spa`
- subcategory: `Wellness`
- pricing_id(s): ninguno
- rule_id(s): ninguno
- source_file: `precios_spa.csv`

### Lectura del dato actual
- item real: `Gorros de piscinas lycra`
- raw:
  - `Uds = 1`
  - `Nº Pax = 1`
  - `Valor neto = 3782`
  - detalle: `Gorro lycra`
- pricing actual:
  - no existe fila en `pricing.csv`, aunque el raw si tiene valor
- reglas actuales: ninguna

### Traduccion al modelo nuevo
- `CategoriaCatalogo`:
  - nombre comercial: `Accesorios Piscina`
  - area encapsulada: `spa_wellness`
  - categoria operacional encapsulada: `producto`
  - pricing op esperado: `per_unit`
  - ruling op esperado: minimo o stock si existiera
- `ItemCatalogo`:
  - item: `Gorro piscina lycra`
  - defaults de item: `material = lycra`, glosa comercial
- `PropiedadBase`:
  - `unidad = und`
  - `sku` opcional
  - `detalle_material = lycra`
- `PropiedadRuntime`:
  - `cantidad`
  - `fecha` opcional
- `PropiedadEfectiva`:
  - resuelve cantidad real a cobrar
- `Pricing`:
  - deberia ser `3782 * cantidad`
- `Ruling`:
  - por ahora ninguno; en futuro podria depender de stock

### Test de consistencia
- el modelo lo representa bien como `producto`
- aparece una tension importante del dataset: hay valor monetario pero no hay `pricing_id`
- eso confirma que el modelo sirve, pero la extraccion actual esta incompleta
- no rompe encapsulacion; la falla esta en los datos fuente

### Veredicto
- `Tension`

## Caso 3 - Salon Chinook

### Fuente real
- item_id: `SALON_CHINOOK`
- year: `2025`
- category: `capacidades_maximas_salones_y__chinook`
- subcategory: `Infraestructura`
- pricing_id(s): ninguno
- rule_id(s): `RULE_SALON_CHINOOK_0001 ... 0005`
- source_file: `capacidades_maximas_salones_y__chinook.csv`

### Lectura del dato actual
- item real: `Salon Chinook`
- raw mezclado con capacidades por montaje y dato de tarima
- reglas actuales:
  - `320-350 pax` auditorio
  - `168 pax` mesas redondas
  - `216 pax` escuela
  - `95 pax` U con mesas
  - una regla `unknown` por tarima
- pricing actual: no existe en este bloque; este archivo parece de capacidad, no de arriendo

### Traduccion al modelo nuevo
- `CategoriaCatalogo`:
  - nombre comercial: `Salones`
  - area encapsulada: `infraestructura`
  - categoria operacional encapsulada: `recurso`
  - pricing op: no viene de este dataset; deberia venir de otra categoria catalogo de arriendo/uso
  - ruling op: capacidad por configuracion de montaje
- `ItemCatalogo`:
  - item: `Salon Chinook`
  - defaults de item: glosa, identificador de locacion, metadata de tarima
- `PropiedadBase`:
  - `subtipo_recurso = locacion`
  - `capacidades_por_montaje`
  - `tarima_dimensiones`
- `PropiedadRuntime`:
  - `pax`
  - `locacion_id = SALON_CHINOOK`
  - `configuracion_montaje`
  - `fecha`, `hora_inicio`, `duracion`
- `PropiedadEfectiva`:
  - resuelve pax real + montaje real
- `Pricing`:
  - no se puede resolver desde esta sola fuente; requiere otra categoria catalogo o pricing base adicional
- `Ruling`:
  - valida `pax` contra `configuracion_montaje`

### Test de consistencia
- el modelo representa bien la parte de reglas/capacidad
- aparece una tension real del dominio: el mismo nombre comercial `Salon Chinook` participa en mas de una categoria fuente
- eso sugiere que `CategoriaCatalogo` y `ItemCatalogo` no pueden depender solo del archivo fuente; deben consolidar vistas parciales
- no rompe encapsulacion, pero exige una fase de unificacion de master data

### Veredicto
- `Tension`

## Caso 4 - Naufrago para 12 personas

### Fuente real
- item_id: `NAUFRAGO_ACTIVITY`
- year: `2025`
- category: `cotizacion_tipo_dia_1`
- subcategory: `Politica`
- pricing_id(s): `PRICE_NAUFRAGO_ACTIVITY_0005`
- rule_id(s): ninguno
- source_file: `cotizacion_tipo_dia_1.csv`

### Lectura del dato actual
- item real: `Naufrago para 12 personas`
- raw:
  - `Hora = 10:00-12:00`
  - `Uds = 1`
  - `Nº Pax = 12`
  - `Total = 1144000`
  - detalle: `Segun PDF enviado`
- pricing actual:
  - `expression_type = flat`
  - `base_value = 1144000 CLP`
- reglas actuales: ninguna explicita

### Traduccion al modelo nuevo
- `CategoriaCatalogo`:
  - nombre comercial: `Teambuilding guiado`
  - area encapsulada: `teambuilding`
  - categoria operacional encapsulada: `compuesto` o `servicio`, segun definicion final
  - pricing op: flat por experiencia cerrada o compuesto por componentes
  - ruling op: min pax, duracion, compatibilidad de locacion, ratio de guias
- `ItemCatalogo`:
  - item: `Naufrago 12 pax`
  - defaults de item: `pax_base = 12`, `bloque = 10:00-12:00`
- `PropiedadBase`:
  - `duracion_default = 120`
  - `pax_base = 12`
  - `componentes_default` posibles, aunque hoy no estan declarados
- `PropiedadRuntime`:
  - `pax`
  - `fecha`
  - `hora_inicio`
  - `duracion`
  - `locacion_id`
  - `componentes` si termina siendo compuesto
- `PropiedadEfectiva`:
  - resuelve si se usa exactamente el pack cerrado o se overridea
- `Pricing`:
  - hoy viene como `flat`
  - en modelo futuro podria refinarse a `compuesto`
- `Ruling`:
  - hoy no esta extraido, pero operacionalmente deberia existir

### Test de consistencia
- este caso es muy bueno para tensionar el modelo porque viene desde subcategoria `Politica`, no desde `Actividades`
- aun asi el modelo lo puede reubicar como `CategoriaCatalogo` de teambuilding
- muestra que la ontologia final no puede depender de la taxonomia extractiva actual
- principal duda: si `Naufrago` es `servicio` cerrado o `compuesto`

### Veredicto
- `Tension`

## Caso 5 - Habitacion single hotel B&B

### Fuente real
- item_id: `HABITACION_SINGLE_HOTEL_BB`
- year: `2025`
- category: `precios_alojamiento`
- subcategory: `Hospedaje`
- pricing_id(s): `PRICE_HABITACION_SINGLE_HOTEL_BB_0021`
- rule_id(s): ninguno
- source_file: `precios_alojamiento.csv`

### Lectura del dato actual
- item real: `Habitacion single hotel B&B`
- raw:
  - `Uds = 1`
  - `Nº Pax = 1`
  - `Valor neto = 120630`
  - detalle incluye desayuno y actividades
- pricing actual:
  - `expression_type = per_unit`
  - `variable_value = 120630 CLP`
- reglas actuales: ninguna explicita

### Traduccion al modelo nuevo
- `CategoriaCatalogo`:
  - nombre comercial: `Habitaciones hotel`
  - area encapsulada: `alojamiento`
  - categoria operacional encapsulada: `recurso` o `servicio`, segun decision final del dominio
  - pricing op: por unidad/noche o por estadia
  - ruling op: ocupacion, check-in, check-out, minimo de noches si aplica
- `ItemCatalogo`:
  - item: `Habitacion single hotel B&B`
  - defaults de item: `ocupacion_base = 1`, `incluye_desayuno = true`
- `PropiedadBase`:
  - `unidad = room-night?`
  - `ocupacion_base = 1`
  - `incluye = desayuno + actividades`
- `PropiedadRuntime`:
  - `fecha`
  - `cantidad` o `noches`
  - `pax`
- `PropiedadEfectiva`:
  - resuelve noches efectivas y ocupacion efectiva
- `Pricing`:
  - hoy se parece a `per_unit`
  - semanticamente podria ser `per_room_night`
- `Ruling`:
  - hoy no esta explicito; operacionalmente deberia usar ocupacion y ventanas de check-in/out

### Test de consistencia
- el modelo aguanta el caso, pero aparece una tension semantica fuerte: alojamiento no calza perfecto ni como `producto` ni como `servicio` ni como `recurso`
- esto sugiere que `CategoriaOperacional` puede necesitar una especializacion mas fina o aceptar convenciones por area
- no rompe la encapsulacion de `CategoriaCatalogo`, pero si desafia la clasificacion operacional

### Veredicto
- `Tension`

## Hallazgos consolidados

### Patrones que si funcionan
- el split `CategoriaCatalogo -> ItemCatalogo -> LineaCotizada` aguanta bien los 5 casos
- `Pricing` como operacion externa sobre propiedades efectivas calza bien
- `Ruling` como operacion externa que consume contexto + propiedades tambien calza bien
- la idea de encapsular `Area` y `CategoriaOperacional` dentro de `CategoriaCatalogo` evita sobreexponer primitivas en runtime

### Tensiones reales del dataset
- hay items con valor monetario pero sin `pricing_id` (`GORRO_PISCINA_LYCRA`)
- hay items distribuidos en bloques fuente distintos que conceptualmente pertenecen al mismo master item (`SALON_CHINOOK`)
- la subcategoria extractiva `Politica` contiene items reales de negocio (`NAUFRAGO_ACTIVITY`)
- alojamiento sigue siendo la zona mas ambigua para `CategoriaOperacional`

### Ajustes sugeridos al modelo
- confirmar una fase explicita de consolidacion entre taxonomia extractiva y `CategoriaCatalogo`
- definir una politica clara para items multi-fuente del master data
- revisar si `CategoriaOperacional` necesita una extension para alojamiento o si basta una convencion por area
- distinguir formalmente `pricing extracted` vs `pricing resoluble canonico`

## Veredicto global

El modelo aguanta los casos reales mejor que la taxonomia actual del dataset.

No aparece una falla estructural grave en la encapsulacion propuesta. Las tensiones detectadas vienen sobre todo de:
- calidad/fragmentacion del dataset extraido
- ambiguedades semanticas del dominio (sobre todo alojamiento y items politicos)

Eso sugiere que el siguiente trabajo no es romper el modelo de nuevo, sino:
1. consolidar `CategoriaCatalogo` canonicas
2. definir mejor `CategoriaOperacional` para casos frontera
3. mapear la extraccion actual a ese master data canonico
