# Primitiva: LineaCotizada

## Idea

`LineaCotizada` es la unidad concreta de compra dentro de una cotizacion.

Todo lo que el cliente compra termina representado como una linea cotizada, independiente de si es producto, servicio, recurso o compuesto.

## Pregunta que responde

**Que cosa exacta se compro, para cuantas personas y en que momento?**

## Definicion

Una `LineaCotizada` referencia un `ItemCatalogo` y materializa valores concretos en el contexto de una cotizacion.

## Contenido minimo

- `ID_ItemCatalogo`
- `fecha`
- `hora` o bloque horario
- `cantidad`
- `pax_aplicable` cuando corresponda
- `duracion` cuando corresponda
- `valores de propiedades`
- `precio_resuelto`
- `reglas_aplicadas`

## Rol en el modelo

La `LineaCotizada`:

- aterriza un item del catalogo al contexto real de la cotizacion
- fija valores para las propiedades heredadas desde `OP_CLASS`
- dispara pricing y ruling
- participa en la suma total de la cotizacion

## Ejemplos

### Buffet desayuno premium

- item: `Buffet desayuno premium`
- fecha: `2026-11-14`
- hora: `09:00`
- pax_aplicable: `80`
- duracion: `90 min`

### Sandwich ave mayo

- item: `Sandwich ave mayo`
- fecha: `2026-11-14`
- cantidad: `80`
- pax_aplicable: opcional o derivado

### Salon Chinook uso diurno

- item: `Salon Chinook uso diurno`
- fecha: `2026-11-14`
- bloque: `08:30-19:30`
- pax_aplicable: `80`

## Regla importante

El `ItemCatalogo` no es todavia una compra.
La compra real existe cuando el item se instancia como `LineaCotizada` dentro de una `Cotizacion`.
