/* eslint-disable max-lines-per-function */
/* eslint-disable jsdoc/require-jsdoc, max-lines-per-function */
import { describe, expect, it } from 'vitest';
import { GenericItemBase } from './GenericItemBase.js';
import { RuntimeSignal } from './signals.js';

function createSeed() {
  return {
    mode: 'catalog',
    definition: {
      id: 'ITEM-COFFEE',
      name: 'Coffee Break Intermedio',
      category: 'Coffee',
      description: 'Servicio de coffee break para eventos corporativos.',
      pricingProfile: {
        baseFijo: 400,
        porPersona: 0,
        porUnidad: 1,
        porMinuto: 0,
      },
      defaultQuantities: {
        unidadesPorUsuario: 3,
        unidadesPorHora: 0,
        minutosPorUsuario: 0,
      },
      rules: [],
      children: [],
    },
    externalContext: {
      paxGlobal: 20,
      duracionMin: 120,
      dia: 1,
      hora: '09:00',
    },
    overrides: {},
  };
}

function waitForAsyncWork() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('GenericItemBase', () => {
  it('initializes with item projections and pricing summary', async () => {
    const item = new GenericItemBase({ id: 'item-a', seed: createSeed() }).initialize();
    await waitForAsyncWork();

    expect(item.getProjection()).toMatchObject({
      id: 'item-a',
      type: 'item',
      ui: { title: 'Coffee Break Intermedio' },
      derived: {
        pricing: { subtotal: 460 },
        quantities: { cantidad: 60 },
      },
    });
  });

  it('applies context and override signals through the item actor', async () => {
    const item = new GenericItemBase({ id: 'item-a', seed: createSeed() }).initialize();

    item.receiveSignal({ type: RuntimeSignal.patchContext, patch: { paxGlobal: 30 } });
    item.receiveSignal({ type: RuntimeSignal.setOverride, key: 'cantidad', value: 100 });
    await waitForAsyncWork();

    expect(item.context.paxGlobal).toBe(30);
    expect(item.state.overrides.cantidad).toBe(100);
    expect(item.getProjection().derived.pricing.subtotal).toBe(500);
  });

  it('replaces external context on setContext signals', async () => {
    const item = new GenericItemBase({ id: 'item-a', seed: createSeed() }).initialize();

    item.receiveSignal({ type: RuntimeSignal.setContext, patch: { paxGlobal: 5 } });
    await waitForAsyncWork();

    expect(item.context).toEqual({ paxGlobal: 5 });
    expect(item.state.externalContext).toEqual({ paxGlobal: 5 });
  });

  it('switches between catalog and basket modes', async () => {
    const item = new GenericItemBase({ id: 'item-a', seed: createSeed() }).initialize();

    item.receiveSignal({ type: RuntimeSignal.setMode, value: 'basket' });
    await waitForAsyncWork();
    expect(item.state.mode).toBe('basket');

    item.receiveSignal({ type: RuntimeSignal.setMode, value: 'catalog' });
    await waitForAsyncWork();
    expect(item.state.mode).toBe('catalog');
  });
});
