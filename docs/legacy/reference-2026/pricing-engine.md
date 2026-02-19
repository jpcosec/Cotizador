# Motor de Cotizaciones — SF Lodge

Guía de referencia para entender cómo el sistema calcula precios.

---

## 1. Conceptos Clave

### La Cotización

Una cotización es un carrito de compra para un evento. Tiene tres datos globales:

- **Cliente** — datos del cliente (nombre, contacto, RUT)
- **Pax Global** — cantidad de personas del evento (ej: 80)
- **Fecha del Evento** — cuándo ocurre
- **Duración (días)** — cuántos días dura

A medida que se agregan ítems al carrito, el sistema calcula automáticamente los precios y el total con impuestos.

### Ítems y Categorías

Cada ítem vendible pertenece a una **categoría**. La categoría define *qué dimensiones afectan el precio*:

| Categoría    | Ejemplo                                              | ¿Pax?  | ¿Cantidad? | ¿Tiempo?            |
| ------------ | ---------------------------------------------------- | ------ | ---------- | ------------------- |
| Salones      | Chinook, Coho                                        | No     | No         | **Sí** (8h default) |
| Coffee       | Básico, Full                                         | **Sí** | No         | No                  |
| Alimentación | Almuerzo, Cena                                       | **Sí** | No         | No                  |
| Fiestas/DJ   | DJ, Iluminación                                      | No     | No         | No                  |
| Bebidas      | Ticket cerveza, Ticket trago                         | **Sí** | **Sí**     | No                  |
| Actividades  | Caminata, Paintball                                  | **Sí** | No         | No                  |
| Audio        | Técnica salones                                      | No     | No         | No                  |

### Las Tres Dimensiones (P, Q, T)

Cada línea del carrito puede depender de hasta tres dimensiones de entrada:

- **P (Pax)** — cantidad de personas. Se hereda del pax global, salvo que el usuario lo sobrescriba por línea.
- **Q (Cantidad)** — unidades. Se calcula automáticamente a partir de pax (ej: 0.5 unidades/pax → 40 cervezas para 80 personas), o el usuario lo sobrescribe.
- **T (Duración)** — minutos. Viene del default de la categoría (ej: salón = 480 min = 8 horas), o el usuario lo sobrescribe.

Si una dimensión no aplica a la categoría, su valor es 0 y no afecta el precio. 

---

## 2. Fórmula de Precio

Todos los ítems usan la misma fórmula universal:

```
Neto = Base + (P × Cp) + (T × Ct) + (Q × Cq)
```

Donde:
- **Base** = costo fijo del ítem (ej: $385.000 para Salon Chinook)
- **Cp** = costo por persona (ej: $6.380 para Coffee Básico)
- **Ct** = costo por minuto/hora
- **Cq** = costo por unidad (ej: $3.529 por ticket de cerveza)

Estos cuatro valores vienen del **Perfil de Precio** del ítem.

### Ejemplos

| Ítem | Fórmula | Resultado (80 pax) |
|------|---------|-------------------|
| Salon Chinook | $385.000 + 0 + 0 + 0 | **$385.000** |
| Coffee Básico | 0 + (80 × $6.380) + 0 + 0 | **$510.400** |
| Ticket Cerveza | 0 + 0 + 0 + (40 × $3.529) | **$141.160** |
| Caminata | $300.000 + (80 × $10.000) + 0 + 0 | **$1.100.000** |

Para las bebidas, la cantidad se calcula automáticamente: 80 pax × 0.5 unidades/pax = 40 tickets. Este cálculo se resuelve mediante **reglas** aplicables por ítem o categoría (ver sección 5).

---

## 3. Herencia y Sobrescrituras

El sistema resuelve cada dimensión siguiendo una cadena de prioridad:

```
Sobrescritura del usuario  →  Override del ítem  →  Default de la categoría  →  Valor global
```

### Pax (P)

```
¿El usuario puso Override_Pax?  → Sí: usar ese valor
                                → No: usar Pax Global de la cotización
```

Solo se calcula si la categoría tiene `Requiere_Pax = true`.

### Cantidad (Q)

```
¿El usuario puso Override_Cantidad?  → Sí: usar ese valor
                                     → No: calcular automáticamente
                                           = redondear(unidades_por_pax × P)
                                           donde unidades_por_pax viene del ítem (si tiene override)
                                           o de la categoría (si no)
```

Solo se calcula si la categoría tiene `Requiere_Cantidad = true`.

### Duración (T)

```
¿El usuario puso Override_Duracion?  → Sí: usar ese valor (en minutos)
                                     → No: usar Def_Duracion_Min de la categoría
```

Solo se calcula si la categoría tiene `Requiere_Tiempo = true`.

### Perfil de Precio

```
¿El ítem tiene ID_Perfil_Precio_Override?  → Sí: usar ese perfil
                                           → No: usar ID_Perfil_Precio_Default de la categoría
```

> **Nota:** Algunos defaults se computan a partir de otras dimensiones (ej: Q derivada de P, T derivada del tipo de evento). Esta lógica se implementa mediante **reglas** (ver sección 5), no como herencia estática.

---

## 4. Packs y Composiciones

Un ítem puede ser un **pack** (composición de varios ítems hijos). Ejemplo:

> **Coffee Break Completo** = Coffee Básico + Coffee Intermedio + Coffee Full

Cuando se agrega un pack al carrito:

1. El ítem padre se **elimina** de la lista
2. Se **insertan los hijos** como líneas individuales
3. Cada hijo se precio **independientemente** con la fórmula universal
4. Las líneas hijas mantienen una referencia al padre (`parentLineId`) para representar la jerarquía de forma anidada

Si un pack contiene otro pack, la expansión es **recursiva**.

> **Pendiente por definir:**
> 1. **Herencia padre→hijo:** Si el usuario modifica un valor en una línea hija (ej: override de pax), ese override queda fijo. Si luego cambia algo en el padre, las líneas hijas sin override se recalculan, pero las que tienen override manual se mantienen.
> 2. **Extras en packs:** Permitir agregar ítems ad-hoc anidados bajo un pack aunque no sean parte de la composición original, marcados con origen `EXTRA`.

---

## 5. Reglas de Negocio

Las reglas son condiciones automáticas que modifican precios. Cada regla tiene:

- **Condición** — cuándo se activa (expresión [JsonLogic](https://jsonlogic.com))
- **Acción** — qué hace cuando se activa
- **Prioridad** — orden de ejecución (menor = primero)
- **Acumulable** — si puede combinarse con otras reglas

### Tipos de Acción

| Acción | Efecto | Ejemplo |
|--------|--------|---------|
| `MULTIPLY` | Multiplicar el precio por un factor | Sobreturno: ×1.25 (+25%) |
| `ADD_FIXED` | Sumar/restar un monto fijo | Descuento: -$50.000 |
| `SET_VALUE` | Reemplazar el precio completamente | Precio especial: $500.000 |
| `SET_TAX` | Aplicar impuesto al total | IVA 19% |
| `SET_DEFAULT` | Computar un valor por defecto para una dimensión | Q = P × 0.5 (bebidas) |
| `REQUIRE_ITEM` | Exigir o agregar automáticamente otro ítem | Salón requiere Técnica Audio |

> El motor de reglas debe ser lo más general posible para cubrir lógica de defaults, restricciones y dependencias entre ítems.

### Condiciones (JsonLogic)

Las condiciones se escriben en formato [JsonLogic](https://jsonlogic.com), un estándar abierto para expresar lógica en JSON:

```js
// "Duración mayor a 480 minutos"
{ ">": [{ "var": "_duracionMin" }, 480] }

// "Es un salón Y duración mayor a 480 minutos"
{ "and": [
  { "===": [{ "var": "_categoriaId" }, "CAT_SALON"] },
  { ">":   [{ "var": "_duracionMin" }, 480] }
]}

// "Siempre aplicar" (ej: IVA)
true
```

Operadores disponibles: `>`, `<`, `>=`, `<=`, `==`, `===`, `!=`, `!==`, `and`, `or`, `!`, `in`, `if`, y [muchos más](https://jsonlogic.com/operations.html).

### Reglas de Ejemplo

| Regla | Etapa | Condición | Acción |
|-------|-------|-----------|--------|
| Sobreturno salón | AJUSTE_LINEA | Categoría = Salón **y** duración > 480 min | ×1.25 |
| IVA 19% | IMPUESTO | Siempre | 19% sobre total neto |

---

## 6. Ajustes Manuales

Después de los ajustes automáticos, el usuario puede intervenir manualmente:

| Tipo | Alcance | Efecto |
|------|---------|--------|
| `OVERRIDE_PRECIO` | Línea | Reemplaza el precio calculado |
| `DESCUENTO_LINEA` | Línea | Resta un monto del precio |
| `DESCUENTO_GLOBAL` | Cotización | Descuento sobre el total |
| `RECARGO` | Cotización | Recargo sobre el total |

El sistema guarda siempre el **valor original** (lo que calculó) y el **valor nuevo** (lo que el usuario puso), creando una pista de auditoría.

---

## 7. Pipeline Completo

Cuando se agrega un ítem o cambian los pax, el motor ejecuta estas etapas en orden:

```
┌─────────────────────────────────────────────────┐
│ 1. Expansión de Composiciones                   │
│    Pack → hijos individuales                    │
├─────────────────────────────────────────────────┤
│ 2. Resolución de Defaults (P, Q, T)             │
│    Herencia: override → ítem → categoría → glob │
├─────────────────────────────────────────────────┤
│ 3. Precio Base                                  │
│    Neto = Base + P×Cp + T×Ct + Q×Cq             │
├─────────────────────────────────────────────────┤
│ 4. Ajustes Automáticos                          │
│    Reglas de negocio (sobreturno, descuentos)    │
├─────────────────────────────────────────────────┤
│ 5. Ajustes Manuales                             │
│    Overrides del usuario                        │
├─────────────────────────────────────────────────┤
│ 6. Impuestos                                    │
│    IVA 19% sobre el total neto                  │
├─────────────────────────────────────────────────┤
│ → Resultado: subtotal, impuestos, total final   │
└─────────────────────────────────────────────────┘
```

### Evolución del precio por línea

```
_netoBase       ← fórmula universal
    ↓
_netoAjustado   ← después de reglas automáticas (ej: sobreturno +25%)
    ↓
_netoFinal      ← después de ajustes manuales del usuario
```

### Recálculo al cambiar Pax

Cuando el usuario cambia el Pax Global:

- Líneas de **precio fijo** (salones, DJ) → **no cambian**
- Líneas **por persona** (coffee, almuerzo) → **recalculan** con el nuevo pax
- Líneas **por cantidad** (bebidas) → **recalculan** cantidad y precio
- Líneas con **override de pax** → **no cambian** (el usuario fijó su valor)

---

## 8. Tablas de Datos

| Tabla | Contenido | Registros |
|-------|-----------|-----------|
| `CLIENTES` | Base de clientes | 2 |
| `CATEGORIAS` | Tipos de ítems y sus dimensiones | 7 |
| `ITEM_CATALOGO` | Ítems vendibles | 20 |
| `PERFILES_PRECIO` | Componentes de la fórmula (Base, Cp, Ct, Cq) | 21 |
| `COMPOSICION_KIT` | Estructura padre-hijo de packs | 3 |
| `REGLAS_NEGOCIO` | Condiciones y acciones automáticas | 2 |
| `AJUSTES_COTIZACION` | Intervenciones manuales del usuario | (por cotización) |

---

## 9. Referencia Rápida de Comandos (CLI Interactivo)

```bash
npm run interactive
```

| Comando | Descripción |
|---------|-------------|
| `tables` | Listar tablas con cantidad de registros |
| `show TABLA` | Ver todos los registros de una tabla |
| `describe TABLA` | Ver columnas de una tabla |
| `find TABLA campo=valor` | Filtrar registros |
| `items` | Catálogo por categoría con precios |
| `new 80` | Crear cotización con 80 pax |
| `add ITEM_CHINOOK` | Agregar ítem al carrito |
| `add ITEM_CHINOOK dur=600` | Agregar con override de duración |
| `add ITEM_CERVEZA pax=50` | Agregar con override de pax |
| `pax 120` | Cambiar pax global y recalcular |
| `cart` | Ver cotización actual |
| `clear` | Limpiar cotización |
