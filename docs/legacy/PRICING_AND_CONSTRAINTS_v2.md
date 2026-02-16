# Lógica de Precios y Excepciones: SF Lodge v2

**Versión:** 2.0
**Estado:** Definición Técnica
**Dependencia:** Requiere `DATA_DICTIONARY_v2.md`
**Propósito:** Especificar los algoritmos para el cálculo de costos (`PricingEngine`) y la validación de reglas de negocio (`ConstraintValidator`).

> Nota: este documento está en baseline v2. Para el flujo operativo actual usar `docs/quotation-pipeline-flow-v3.md` y para campos vigentes usar `src/Config/Config_Schema.js`.

---

## PARTE 1: MOTOR DE PRECIOS (Pricing Engine)

El objetivo es desacoplar el *precio* del *producto*. Un producto no "tiene un precio", sino que "apunta a una regla" que calcula el precio en base al contexto (Pax, Tiempo, Cantidad).

### 1.1. Modelo Matemático Unificado

Todas las reglas de precio en SF Lodge se pueden resolver con una única fórmula lineal universal. Esto simplifica enormemente el código.

$$PrecioTotal = Base + (P \cdot C_p) + (T \cdot C_t) + (Q \cdot C_q)$$

Donde:
* **Base**: Costo Fijo (`Costo_Base_Fijo`).
* **P (Pax)**: Cantidad de personas aplicables.
* **Cp**: Costo unitario por persona.
* **T (Tiempo)**: Duración del evento (días u horas).
* **Ct**: Costo unitario por tiempo.
* **Q (Cantidad)**: Cantidad de ítems (ej: 2 parlantes).
* **Cq**: Costo unitario por ítem.

### 1.2. Tipos de Reglas (`REGLA_PRECIO`)

Configurando los coeficientes de la fórmula anterior, logramos todos los comportamientos necesarios:

| Tipo de Regla | Ejemplo | Configuración de Coeficientes |
| :--- | :--- | :--- |
| **Costo Fijo** | Arriendo Salón ($500k) | Base=$500k, Cp=0, Ct=0, Cq=0 |
| **Por Persona** | Menú ($30k p/p) | Base=0, Cp=$30k, Ct=0, Cq=0 |
| **Por Cantidad** | Sillas ($2k c/u) | Base=0, Cp=0, Ct=0, Cq=$2k |
| **Por Tiempo** | Generador ($10k x hora) | Base=0, Cp=0, Ct=$10k, Cq=0 |
| **Mixto** | DJ ($100k base + $5k p/p) | Base=$100k, Cp=$5k, Ct=0, Cq=0 |
| **Complejo** | Arriendo ($1M por día) | Base=0, Cp=0, Ct=$1M (donde T=días), Cq=0 |

### 1.3. Algoritmo de Cálculo (`Srv_Pricing.js`)

El servicio debe construir el **Contexto de Cálculo** antes de aplicar la fórmula.

```javascript
class PricingService {
  calculate(item, cotizacionContext) {
    // 1. Obtener la Regla desde el Repo (Caché)
    const regla = this.repoReglas.findById(item.ID_Regla);

    // 2. Definir variables del contexto (Resolución de Prioridades)

    // PAX: ¿El ítem tiene un override manual? Si no, usa el global.
    const P = item.Input_Pax || cotizacionContext.Pax_Global;

    // TIEMPO: ¿El ítem tiene duración propia? Si no, usa la del evento.
    const T = item.Input_Duracion || cotizacionContext.Duracion_Dias;

    // CANTIDAD: Input directo del usuario (default 1)
    const Q = item.Input_Cantidad || 1;

    // 3. Aplicar Fórmula Universal
    const total = (regla.Costo_Base_Fijo || 0) +
                  (P * (regla.Costo_Unitario_Pax || 0)) +
                  (T * (regla.Costo_Unitario_Tiempo || 0)) +
                  (Q * (regla.Costo_Unitario_Item || 0));

    return Math.round(total); // Siempre enteros
  }
}
```

---

## PARTE 2: SISTEMA DE EXCEPCIONES (Constraint Validator)

Las "Excepciones" o "Restricciones" son reglas que validan si una combinación de ítems y parámetros es válida para el negocio.

### 2.1. Modelo de Restricción (RESTRICCION)

Cada fila en esta tabla es una regla que el sistema debe verificar antes de guardar o finalizar una cotización.

| Campo | Descripción |
| :--- | :--- |
| Tipo | QUÉ validamos (MIN_PAX, REQUIERE, EXCLUYE). |
| Item_Trigger | El ítem que activa la revisión (o * para todos). |
| Item_Target | El ítem requerido o excluido (si aplica). |
| Valor | El número límite (ej: 50 para pax, 12:00 para hora). |
| Severidad | ERROR (Bloquea) o WARNING (Avisa pero deja pasar). |

### 2.2. Tipos de Restricciones Soportadas

#### A. Restricciones de Cantidad/Capacidad

**MIN_PAX:** "El 'Menú Premium' requiere mínimo 50 personas".
- Lógica: `if (Item == Trigger && Context.Pax < Valor) return Error`

**MAX_PAX:** "El 'Salón Pequeño' aguanta máximo 40 personas".
- Lógica: `if (Item == Trigger && Context.Pax > Valor) return Error`

#### B. Restricciones de Dependencia (Combos)

**REQUIERE:** "Si llevas 'Proyector', debes llevar 'Telón'".
- Lógica: `if (Cart.has(Trigger) && !Cart.has(Target)) return Error`

**EXCLUYE:** "No puedes llevar 'DJ A' y 'DJ B' al mismo tiempo".
- Lógica: `if (Cart.has(Trigger) && Cart.has(Target)) return Error`

#### C. Restricciones de Tiempo

**HORA_LIMITE:** "El 'Servicio de Día' no puede terminar después de las 18:00".
- Lógica: `if (Item == Trigger && Item.HoraFin > Valor) return Error`

### 2.3. Algoritmo de Validación (`Srv_Constraint.js`)

Este servicio corre después de calcular precios y antes de guardar.

```javascript
class ConstraintService {
  validate(cotizacion) {
    const errores = [];
    const itemsEnCarrito = cotizacion.lineas.map(l => l.ID_Item);
    const reglas = this.repoRestricciones.getAll(); // Desde Caché

    // Recorrer todas las reglas activas
    reglas.forEach(regla => {

      // 1. ¿Aplica esta regla a esta cotización?
      const itemsAfectados = cotizacion.lineas.filter(l =>
        l.ID_Item === regla.Item_Trigger || regla.Item_Trigger === '*'
      );

      if (itemsAfectados.length === 0) return; // La regla no aplica aquí

      // 2. Validar según tipo
      itemsAfectados.forEach(linea => {
        if (regla.Tipo === 'MIN_PAX') {
          const paxReal = linea.Input_Pax || cotizacion.Pax_Global;
          if (paxReal < regla.Valor) {
            errores.push({
              nivel: regla.Severidad,
              msg: `El ítem ${linea.Nombre} requiere mínimo ${regla.Valor} pax.`
            });
          }
        }

        if (regla.Tipo === 'REQUIERE') {
          if (!itemsEnCarrito.includes(regla.Item_Target)) {
             errores.push({
               nivel: regla.Severidad,
               msg: `Si llevas ${linea.Nombre}, debes agregar ${regla.Nombre_Target}.`
             });
          }
        }

        // ... otros tipos ...
      });
    });

    return errores;
  }
}
```

---

## 3. Integración en el Flujo de Guardado

El controlador principal (Controller_Main.js) orquesta ambos servicios:

1. Recibe el carrito del Frontend.
2. Calcula los precios usando PricingService (actualiza los montos).
3. Valida las reglas usando ConstraintService.
4. Decisión:
   - Si hay errores **ERROR**: Devuelve error al usuario, NO guarda.
   - Si hay errores **WARNING**: Guarda, pero devuelve las alertas al usuario.
   - Si está limpio: Guarda y devuelve éxito.

---

## 4. Ejemplo Práctico Integrado

**Escenario:** Cotización de Matrimonio.

**Datos de Entrada:**
- Pax Global: 40 personas.
- Item Seleccionado: "Menú Gold" (ID: MENU-GOLD).

**Datos Maestros:**
- REGLA_PRECIO para Menú Gold: Base=0, Pax=50.000.
- RESTRICCION para Menú Gold: Tipo=MIN_PAX, Valor=50, Severidad=ERROR.

**Ejecución:**

1. **Pricing:** Calcula $50.000 * 40 = $2.000.000. (El cálculo matemático no juzga, solo calcula).
2. **Constraint:** Revisa la regla MIN_PAX.
   - Compara: ¿40 < 50? Sí.
   - Genera Error: "El ítem Menú Gold requiere mínimo 50 pax".
3. **Resultado:** El usuario recibe una alerta roja y no puede guardar hasta que suba los pax o cambie el ítem.
