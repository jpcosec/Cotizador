
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createItemState } from './ItemState.js';

describe('createItemState', () => {
  const mockItem = {
    mode: 'catalog',
    definition: {
      pricingProfile: {},
      defaultQuantities: {},
    },
    externalContext: {},
    overrides: {},
    userSetFields: new Set(),
    calculate: vi.fn(function() { return this; }),
  };

  beforeEach(() => {
    // Reset mock before each test
    mockItem.mode = 'catalog';
    mockItem.definition = { pricingProfile: {}, defaultQuantities: {} };
    mockItem.externalContext = {};
    mockItem.overrides = {};
    mockItem.userSetFields = new Set();
    mockItem.calculate.mockClear();
  });

  const itemState = createItemState(mockItem);

  it('should set mode', () => {
    itemState.setMode('basket');
    expect(mockItem.mode).toBe('basket');
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });

  it('should receive context', () => {
    itemState.receiveContext({ paxGlobal: 10 });
    expect(mockItem.externalContext).toEqual({ paxGlobal: 10 });
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });

  it('should set an override', () => {
    itemState.setOverride('pax', 5);
    expect(mockItem.overrides).toEqual({ pax: 5 });
    expect(mockItem.userSetFields.has('pax')).toBe(true);
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });

  it('should clear an override', () => {
    itemState.setOverride('pax', 5);
    mockItem.calculate.mockClear();
    itemState.clearOverride('pax');
    expect(mockItem.overrides).toEqual({});
    expect(mockItem.userSetFields.has('pax')).toBe(false);
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });
    
  it('should reset overrides', () => {
    itemState.setOverride('pax', 5);
    mockItem.calculate.mockClear();
    itemState.resetOverrides();
    expect(mockItem.overrides).toEqual({});
    expect(mockItem.userSetFields.size).toBe(0);
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });

  it('should set profile value', () => {
    itemState.setProfileValue('baseFijo', 100);
    expect(mockItem.definition.pricingProfile).toEqual({ baseFijo: 100 });
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });
    
  it('should set default quantity', () => {
    itemState.setDefaultQuantity('cantidad', 10);
    expect(mockItem.definition.defaultQuantities.cantidad).toBe(10);
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });

  it('should clear default quantity', () => {
    itemState.setDefaultQuantity('cantidad', 10);
    mockItem.calculate.mockClear();
    itemState.clearDefaultQuantity('cantidad');
    expect(mockItem.definition.defaultQuantities.cantidad).toBeUndefined();
    expect(mockItem.calculate).toHaveBeenCalledTimes(1);
  });
});
