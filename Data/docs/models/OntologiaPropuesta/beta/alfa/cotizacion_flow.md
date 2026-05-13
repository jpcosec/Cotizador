# Flujo base del cotizador

## Objetivo

Describir el flujo minimo del cotizador desde el punto de vista del negocio.

## Resumen

1. se define una `Cotizacion`
2. se fija el contexto global del evento
3. se agregan `LineasCotizadas`
4. cada linea resuelve propiedades, pricing y ruling
5. se consolida el total

## Flujo

### 1. Crear cotizacion

Se registra el contexto general del evento:

- cantidad de personas
- fechas
- horarios principales

### 2. Elegir cosas compradas

El usuario selecciona items del catalogo.

Todavia no son compra final; solo son candidatos a instanciarse como lineas.

### 3. Instanciar linea cotizada

Por cada compra concreta, el sistema crea una `LineaCotizada` a partir de un `ItemCatalogo`.

### 4. Resolver contrato del item

Para el item elegido se resuelve:

- `Area`
- `OP_CLASS`
- `Categoria`
- `ContratoItem`

### 5. Instanciar propiedades

La linea fija los valores que exige `OP_CLASS`, por ejemplo:

- `pax`
- `cantidad`
- `duracion`
- `hora_inicio`
- `locacion_id`

### 6. Aplicar pricing y ruling

El sistema calcula:

- precio base
- variable por pax/unidad/tiempo
- restricciones
- warnings
- dependencias

### 7. Consolidar cotizacion

Finalmente la cotizacion puede responder:

- total general
- total por linea
- conflictos o restricciones
- cobertura del evento

## Formula operativa

`Cotizacion -> LineaCotizada -> ItemCatalogo -> ContratoItem -> Propiedades + Pricing + Ruling`
