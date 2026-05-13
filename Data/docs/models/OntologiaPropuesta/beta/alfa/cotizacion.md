# Primitiva: Cotizacion

## Idea

`Cotizacion` es la entidad principal del negocio.

El sistema existe para construir cotizaciones de eventos de empresa.
Una cotizacion no se describe primero por categorias ni por tipos semanticos, sino por un contexto operativo comun y un conjunto de compras concretas.

## Definicion minima

Una cotizacion se describe por:

1. `cantidad de personas`
2. `cosas compradas`
3. `horarios y fechas`

## Formula simple

`Cotizacion = ContextoGlobal + LineasCotizadas`

## Contexto global

El contexto global de una cotizacion contiene al menos:

- `pax_total`
- `fechas`
- `horarios relevantes`
- `cliente` o `empresa` opcional
- metadata general del evento opcional

## Pregunta que responde

**Que evento de empresa estoy intentando cotizar?**

## Rol en el modelo

La `Cotizacion`:

- agrupa todas las lineas compradas
- provee contexto compartido a reglas y pricing
- permite resolver disponibilidad, capacidades y dependencias
- sirve como contenedor del evento cotizado

## Ejemplos de contexto global

- `pax_total = 80`
- `fecha = 2026-11-14`
- `horario_evento = 09:00-18:00`
- `cliente = empresa`

## Resultado esperado

Una `Cotizacion` debe poder responder:

- cuantas personas participan
- que se compra
- cuando ocurre cada cosa
- cuanto cuesta todo
- que restricciones aplican
