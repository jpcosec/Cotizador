
import { describe, it, expect } from 'vitest';
import { createItemProjections } from './ItemProjections.js';
import { PricingKind } from '../domain/pricing.js';

describe('createItemProjections', () => {
  const mockItem = {
    mode: 'basket',
    definition: {
      id: 'test-item',
      name: 'Test Item',
      description: 'A test item',
      category: 'TEST',
      rules: [{id: 'rule1'}],
      children: [{id: 'child1'}],
      defaultQuantities: { requierePax: true }
    },
    externalContext: { paxGlobal: 10 },
    overrides: { comentarios: 'a comment' },
    userSetFields: new Set(['pax']),
    derived: {
      pricingKind: PricingKind.PAX,
      total: 100,
      isOverridden: true,
      quantities: { pax: 10, cantidad: 0, duracionMin: 0 },
      schedule: { dia: 1, hora: '10:00', horaMin: 600 },
      catalogDisaggregated: 'Some disaggregated text',
      policyHintText: 'A policy hint',
      basketLegendText: 'A basket legend',
      pricingHumanText: 'A pricing text',
      lineRateLabel: 'Rate label',
      lineRateSubtotal: 90,
      base: 10,
      rate: 9,
      comentarios: 'a comment',
      showPaxControl: true,
      showUnitsControl: false,
      showTimeControl: false,
      userSetFields: ['pax'],
      isUserSetPax: true,
      isUserSetCantidad: false,
      isUserSetDuracion: false,
      unitDisplay: 10,
      isAbsorbido: false,
    },
    ruleResult: {
      appliedRules: [],
      errors: [],
      warnings: [],
      available: true,
    },
  };

  const itemProjections = createItemProjections(mockItem);

  it('should return basic getters', () => {
    expect(itemProjections.mode).toBe('basket');
    expect(itemProjections.definition).toEqual(mockItem.definition);
    expect(itemProjections.externalContext).toEqual(mockItem.externalContext);
    expect(itemProjections.overrides).toEqual(mockItem.overrides);
    expect(itemProjections.pricingKind).toBe(PricingKind.PAX);
    expect(itemProjections.total).toBe(100);
    expect(itemProjections.isOverridden).toBe(true);
    expect(itemProjections.quantities).toEqual(mockItem.derived.quantities);
    expect(itemProjections.schedule).toEqual(mockItem.derived.schedule);
    expect(itemProjections.rules).toEqual(mockItem.definition.rules);
    expect(itemProjections.children).toEqual(mockItem.definition.children);
  });

  it('should return catalogCard projection', () => {
    const card = itemProjections.catalogCard;
    expect(card.ID_Item).toBe('test-item');
    expect(card.Nombre).toBe('Test Item');
    expect(card.Precio_Calculado_Default).toBe('Some disaggregated text');
  });

  it('should return basketLine projection', () => {
    const line = itemProjections.basketLine;
    expect(line.id).toBe('test-item');
    expect(line.nombre).toBe('Test Item');
    expect(line.total).toBe(100);
  });

  it('should return a display object for UI', () => {
    const displayObj = itemProjections.toDisplayObject();
    expect(displayObj.mode).toBe('basket');
    expect(displayObj.total).toBe(100);
    expect(displayObj.catalogCard.ID_Item).toBe('test-item');
    expect(displayObj.basketLine.id).toBe('test-item');
  });

  it('should return a seed object for persistence', () => {
    const seed = itemProjections.toSeed();
    expect(seed.mode).toBe('basket');
    expect(seed.definition).toEqual(mockItem.definition);
    expect(seed.overrides).toEqual(mockItem.overrides);
    expect(seed.userSetFields).toEqual(['pax']);
  });
});
