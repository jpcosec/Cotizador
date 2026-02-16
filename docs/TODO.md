# TODO v3.1: Motor de Reglas Unificado

**Estado:** Planificación activa  
**Modelo objetivo:** `docs/db_docs_v3_1.md`  
**Pipeline objetivo:** `docs/quotation-pipeline-flow-v3.md`

---

## 1. Diseño de Datos (Prioridad Alta)

- [ ] Definir tabla unificada `REGLAS_NEGOCIO` en schema
- [ ] Definir enums de `Etapa`, `Scope`, `Tipo_Accion`, `Severidad`
- [ ] Agregar snapshots de impuesto en línea:
  - `Impuesto_ID_Snapshot`
  - `Impuesto_Tasa_Snapshot`
  - `Impuesto_Monto`
- [ ] Revisar compatibilidad de `LINEA_DETALLE.ID_Item` para líneas de ajuste
- [ ] Definir precedencia de reglas formal:
  - Fuentes: `CATEGORIA -> COMPOSICION -> ITEM -> USUARIO`
  - Override efectivo: `USUARIO > ITEM > COMPOSICION > CATEGORIA`

---

## 2. Motor de Reglas (Prioridad Alta)

- [ ] Implementar evaluador por etapas:
  - `CANTIDAD_DEFAULT`
  - `RESTRICCION_UI`
  - `PRECIO_BASE`
  - `AJUSTE_LINEA`
  - `AJUSTE_GLOBAL`
  - `IMPUESTO`
- [ ] Implementar contrato de salida UI por regla ejecutada (`ruleId`, `stage`, `target`, `message`, `delta`)
- [ ] Soportar acciones mínimas:
  - `SET_VALUE`
  - `MULTIPLY`
  - `ADD_FIXED`
  - `ADD_ITEM`
  - `INVALIDATE_BASKET`
  - `WARNING` / `ERROR`

---

## 3. Migración Gradual (Prioridad Media)

- [ ] Mapear reglas actuales (`RESTRICCION`, `REGLAS_DESCUENTO`, impuestos) a `REGLAS_NEGOCIO`
- [ ] Definir estrategia de coexistencia temporal (v3.0.1 + v3.1)
- [ ] Crear fixtures de prueba para escenarios clave:
  - Capacidad máxima por salón
  - Descuento por pack
  - Sobrecargo por horario
  - Auto-add item por composición

---

## 4. UI y Observabilidad (Prioridad Media)

- [ ] Mostrar warnings/errors accionables al seleccionar ítem
- [ ] Mostrar trazabilidad por línea: qué reglas se aplicaron
- [ ] Mostrar ajustes automáticos agregados por el motor
- [ ] Agregar vista de auditoría de cálculo (debug panel opcional)

---

## 5. Criterios de Aceptación

- [ ] Toda modificación de precio/cantidad/tiempo debe estar trazada por `Regla_Origen_ID`
- [ ] Toda invalidación de canasta debe incluir mensaje UI accionable
- [ ] Los impuestos deben calcularse al final y persistirse como snapshot
- [ ] El recálculo completo debe ser determinista (mismos inputs => mismos outputs)
