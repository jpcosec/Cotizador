/**
 * Default business definition for the standalone demo item.
 */
export const defaultItemDefinition = {
  name: 'Coffee Break Intermedio',
  category: 'Coffee',
  description: 'Servicio de coffee break para eventos corporativos.',
  pricingProfile: {
    baseFijo: 400,
    porPersona: 0,
    porUnidad: 1,
    porMinuto: 0
  },
  defaultQuantities: {
    unidadesPorUsuario: 3,
    unidadesPorHora: 0,
    minutosPorUsuario: 0
  },
  rules: [
    { id: 'R1', type: 'MAX_PAX', value: 500, label: 'Maximo 500 pax', active: true, blocking: true },
    {
      id: 'R2',
      type: 'ONLY_HOUR_RANGE',
      min: '07:00',
      max: '22:00',
      label: 'Disponible entre 07:00 y 22:00',
      active: true,
      blocking: true
    }
  ]
};

/**
 * Default item seed for standalone sandbox initialization.
 * @returns {{ mode: string, definition: Object, externalContext: Object, overrides: Object }}
 */
export function createDefaultItemSeed() {
  return {
    mode: 'catalog',
    definition: defaultItemDefinition,
    externalContext: {
      paxGlobal: 20,
      duracionMin: 120,
      dia: 1,
      hora: '09:00'
    },
    overrides: {}
  };
}
