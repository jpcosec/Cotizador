# Diccionario de Datos y Entidades: SF Lodge v3.2 (Planning)

**Versión:** 3.2
**Fuente de verdad para tablas:** `src/Config/Config_Schema.js`

---

## 1. Principios del Modelo

1. **Input vs cálculo separados:** LINEA_DETALLE solo almacena inputs. Los cálculos viven en runtime y se cachean como JSON.
2. **No delete, solo rewrite:** toda modificación actualiza `Updated_At`. No se borra data histórica.
3. **Impuestos al total:** no por línea. Se aplican al neto consolidado.
4. **Herencia por dimensiones:** la categoría define qué dimensiones de pricing aplican (Pax, Cantidad, Tiempo). El ítem puede override el perfil de precio y el calculador de unidades.
5. **Intervenciones trazables:** todo ajuste manual del usuario queda en `AJUSTES_COTIZACION` con valor original vs nuevo.

---

## 2. Herencia y Resolución

**Cadena:** `CATEGORIA → ITEM → USUARIO`

**Perfil de precio:**
1) `ITEM_CATALOGO.ID_Perfil_Precio_Override` si existe.
2) Si no, `CATEGORIAS.ID_Perfil_Precio_Default`.

**Calculador de unidades por pax:**
1) `ITEM_CATALOGO.Def_Unidades_Por_Pax_Override` si existe.
2) Si no, `CATEGORIAS.Def_Unidades_Por_Pax`.

**Dimensiones activas:** se leen de `CATEGORIAS` (Requiere_Pax, Requiere_Cant, Requiere_Tiempo).

**Overrides de usuario:** se leen de `LINEA_DETALLE` (Override_Pax, Override_Cantidad, Override_Duracion_Min).

---

## 3. Tablas

### Master Data
- `CLIENTES` — base de clientes
- `CATEGORIAS` — configurador de dimensiones, UI defaults, herencia base
- `ITEM_CATALOGO` — inventario vendible con overrides opcionales
- `PERFILES_PRECIO` — componentes de fórmula (Base + Pax + Tiempo + Cantidad)
- `COMPOSICION_KIT` — packs/kits padre-hijo
- `REGLAS_NEGOCIO` — motor unificado (defaults, restricciones, ajustes, sobreturno, impuestos)

### Transactional
- `COTIZACIONES` — encabezados, sin campos calculados
- `LINEA_DETALLE` — inputs puros (ítem, día, hora, overrides, comentarios)
- `AJUSTES_COTIZACION` — intervenciones manuales del usuario sobre cálculos automáticos

### Cache y Auditoría
- `CACHE_COTIZACION` — JSON snapshot de resultados, regenerable, consumido por frontend
- `HISTORIAL_COTIZACION` — auditoría de cambios

---

## 4. Resultado de Reglas para UI

Cada regla ejecutada produce salida accionable:
- `type`: `ERROR`, `WARNING`, `INFO`, `APPLIED_ADJUSTMENT`, `AUTO_ADDED_ITEM`
- `ruleId`, `stage`, `target`, `message`, `delta`

---

## 5. Nota de Transición

Este documento (`v3.2`) reemplaza `v3.1`. Cambios principales:
- LINEA_DETALLE es input-only (sin cálculos).
- Impuestos al total, no por línea.
- Nueva tabla AJUSTES_COTIZACION para trazabilidad de intervenciones.
- Cache JSON para frontend.
- Updated_At en todas las tablas.
- Categoría define dimensiones de pricing (Pax/Cant/Tiempo) y calculador de unidades.
