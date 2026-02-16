# Current State & Next Tasks (v3.1 Planning)

**Fecha:** 2026-02-16  
**Estado:** En planificación activa de unificación de reglas.

---

## Estado Actual

Actualmente conviven dos capas:

1. **Capa implementada de transición (v3.0.1):**
- Fuente actual: `src/Config/Config_Schema.js`
- Diccionario actual: `docs/db_docs_v3.md`
- Pipeline de transición: `docs/quotation-pipeline-flow-v3.md` (actualizado a visión v3.1)

2. **Capa objetivo de diseño (v3.1):**
- Modelo objetivo: `docs/db_docs_v3_1.md`
- Motor unificado por etapas con `REGLAS_NEGOCIO`

---

## Decisiones de Diseño Confirmadas

- Entidades base: `ITEM_CATALOGO` y `CLIENTES`.
- Un ítem puede pertenecer a categoría y/o componer packs.
- Fórmula base sobre `P` (pax), `Q` (cantidad), `T` (tiempo).
- Cada selección genera `LINEA_DETALLE` con snapshot final (permite override de usuario).
- Restricciones se evalúan en UI y en validación final.
- Ajustes (descuentos/sobrecargos) se ejecutan en etapa de cálculo.
- Impuestos se aplican al final del cálculo.
- Reglas pueden:
  - Agregar ítems automáticamente.
  - Invalidar canasta.
  - Modificar precios de línea/global.

---

## Orden de Herencia y Override

- Fuentes: `CATEGORIA -> COMPOSICION -> ITEM -> USUARIO`
- Override efectivo: `USUARIO > ITEM > COMPOSICION > CATEGORIA`

---

## Próximos Pasos Inmediatos

1. Formalizar tabla `REGLAS_NEGOCIO` en schema.
2. Definir contrato JSON de `Condicion_JSON` y `Payload_JSON`.
3. Asegurar snapshots de impuesto en `LINEA_DETALLE`.
4. Definir tratamiento de líneas de ajuste con `ID_Item` nullable.
5. Implementar primer evaluador por etapas con 2-3 reglas reales.

---

## Nota

La documentación histórica v2 se mantiene en `docs/legacy/` para referencia.
