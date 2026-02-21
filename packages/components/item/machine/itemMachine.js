import { assign, createActor, createMachine } from 'https://esm.sh/xstate@5.28.0';
import { ItemXStateInteraction } from '../../../xstate/src/interactions/ItemXStateInteraction.js';

const interaction = new ItemXStateInteraction();

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

const initialContext = interaction.project({
  mode: 'catalog',
  definition: defaultItemDefinition,
  externalContext: {
    paxGlobal: 20,
    duracionMin: 120,
    dia: 1,
    hora: '09:00'
  },
  overrides: {}
});

const reduceEvent = assign(({ context, event }) => interaction.reduce(context, event));

export const itemMachine = createMachine({
  id: 'itemStandalone',
  initial: 'ready',
  context: initialContext,
  states: {
    ready: {
      on: {
        SET_MODE: { actions: reduceEvent },
        SET_EXTERNAL_CONTEXT: { actions: reduceEvent },
        SET_PROFILE_VALUE: { actions: reduceEvent },
        SET_DEFAULT_QUANTITY_VALUE: { actions: reduceEvent },
        CLEAR_DEFAULT_QUANTITY_VALUE: { actions: reduceEvent },
        SET_OVERRIDE: { actions: reduceEvent },
        CLEAR_OVERRIDE: { actions: reduceEvent },
        RESET_OVERRIDES: { actions: reduceEvent }
      }
    }
  }
});

export function createItemActor() {
  const actor = createActor(itemMachine);
  actor.start();
  return actor;
}
