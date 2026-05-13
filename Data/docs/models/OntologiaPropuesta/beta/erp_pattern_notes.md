# ERP Pattern Notes

## Objetivo

Dejar explicito que patron de arquitectura estamos tomando como referencia.

## Inspiraciones

### Odoo

Aporta:

- buena separacion entre catalogo y documentos comerciales
- nocion fuerte de master data reutilizable
- variantes y configuracion comercial sobre un catalogo estable

### Apache OFBiz

Aporta:

- entidades declarativas y relativamente tontas
- servicios duenos de la logica
- separacion clara entre data estructural y operaciones de negocio

### ERPNext / Frappe

Aporta:

- documentos transaccionales faciles de entender
- cotizacion y linea como snapshot de compra
- validaciones cercanas al boundary del documento

## Patron adoptado

Para este sistema se adopta principalmente:

- `modelo base` como master data
- `cotizacion_time` como documento transaccional
- `motor logico` como capa de servicios

## Regla sintetica

- datos persistidos del catalogo: en `modelo base`
- compra concreta: en `cotizacion_time`
- calculo y validacion: en `motor logico`
