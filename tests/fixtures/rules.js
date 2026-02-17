// Conditions use JsonLogic standard: https://jsonlogic.com
export const BUSINESS_RULES = [
  // ── Overtime surcharge: salon duration > 480 min (8h standard) ──
  {
    ID_Regla: 'R001_OVERTIME',
    Nombre: 'Sobreturno salón (>8h)',
    Etapa: 'AJUSTE_LINEA',
    Scope: 'CATEGORIA',
    Tipo_Accion: 'MULTIPLY',
    Condicion_JSON: { "and": [
      { "===": [{ "var": "_categoriaId" }, "CAT_SALON"] },
      { ">":   [{ "var": "_duracionMin" }, 480] },
    ]},
    Payload_JSON: { factor: 1.25 },
    Prioridad: 10,
    Acumulable: false,
    Activo: true,
  },

  // ── IVA 19% ──
  {
    ID_Regla: 'R002_IVA',
    Nombre: 'IVA 19%',
    Etapa: 'IMPUESTO',
    Scope: 'COTIZACION',
    Tipo_Accion: 'SET_TAX',
    Condicion_JSON: true,
    Payload_JSON: { name: 'IVA', rate: 0.19 },
    Prioridad: 100,
    Acumulable: true,
    Activo: true,
  },
];
