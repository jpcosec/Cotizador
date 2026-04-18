import { describe, it, expect } from 'vitest';
import { ItemLogic } from './ItemLogic.js';
import { PricingKind } from './Enums.js';

describe('ItemLogic', () => {
  it('should initialize correctly and calculate totals', () => {
    const seed = {
      definition: {
        name: 'Test Item',
        pricingProfile: { baseFijo: 100, porUnidad: 5 },
        defaultQuantities: { cantidad: 10 }
      }
    };
    const item = new ItemLogic(seed);
    expect(item.pricingKind).toBe(PricingKind.UNITS);
    expect(item.total).toBe(150); // 100 + 10*5
  });

  it('should update total when overrides change', () => {
    const item = new ItemLogic({
      definition: {
        pricingProfile: { porPersona: 10 }
      },
      externalContext: { paxGlobal: 20 }
    });
    expect(item.total).toBe(200);
    
    item.setOverride('pax', 30);
    expect(item.total).toBe(300);
  });
});
