/**
 * Integration: Rule inheritance flows Basket → DayCategory → Item.
 *
 * Context pushed from Basket is available in items via _inheritedContext.
 * Basket-level rules (IMPUESTO, AJUSTE_GLOBAL) are evaluated at totals time.
 * Item-level rules (AJUSTE_LINEA, RESTRICCION_UI) are assigned and evaluated per item.
 */

import { describe, it, expect, vi } from 'vitest';
import { Catalog } from '../../src/containers/Catalog.js';
import { Basket } from '../../src/containers/Basket.js';
import { createPricingTestStore, createStoreWithRules } from '../helpers/store_factory.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSetup(store, opts = {}) {
  const catalog = new Catalog();
  catalog.load(store);

  const header = { ID_Cotizacion: 'COT_001', ID_Cliente: 'CLI_TEST', Fecha_Evento: '2026-06-01', Duracion_Dias: 1, paxGlobal: 20 };

  const basket = new Basket(header, catalog, {
    rules: catalog.getBasketRules(),
    ...opts,
  });

  return { catalog, basket };
}

// ── Context inheritance ───────────────────────────────────────────────────────

describe('Rule inheritance: context propagation', () => {
  it('item receives basket pax via _inheritedContext after add()', () => {
    const { basket } = makeSetup(createPricingTestStore());
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    // pax should resolve from context (20) since no user override
    expect(item.pax).toBe(20);
  });

  it('item _inheritedContext has pax set from basket', () => {
    const { basket } = makeSetup(createPricingTestStore());
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    expect(item._inheritedContext).toMatchObject({ pax: 20 });
  });

  it('user-set pax on item is not overwritten by basket context', () => {
    const { basket } = makeSetup(createPricingTestStore());
    const [item] = basket.add('ITEM_COFFEE_BASIC', { pax: 5 });
    expect(item.pax).toBe(5);
    expect(item.paxIsUserSet).toBe(true);
  });

  it('reprice() updates context and recalculates item prices', () => {
    const { basket } = makeSetup(createPricingTestStore());
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    const priceBefore = item.total;  // 20 × 6380
    basket.reprice(10);
    expect(item.total).toBeLessThan(priceBefore);  // 10 × 6380
    expect(item.pax).toBe(10);
  });
});

// ── Basket-level rules (IMPUESTO) ─────────────────────────────────────────────

describe('Rule inheritance: basket-level rules (IMPUESTO)', () => {
  it('catalog.getBasketRules() returns IMPUESTO rules from store', () => {
    const catalog = new Catalog();
    catalog.load(createStoreWithRules());
    const rules = catalog.getBasketRules();
    expect(rules.some(r => r.Etapa === 'IMPUESTO')).toBe(true);
  });

  it('basket _rules receives basket-level rules from catalog', () => {
    const catalog = new Catalog();
    catalog.load(createStoreWithRules());
    const basket = new Basket(
      { ID_Cotizacion: 'C1', paxGlobal: 10 },
      catalog,
      { rules: catalog.getBasketRules() }
    );
    expect(basket._rules.some(r => r.Etapa === 'IMPUESTO')).toBe(true);
  });

  it('evaluator is called for IMPUESTO rules when computing totals', () => {
    const catalog = new Catalog();
    catalog.load(createStoreWithRules());

    const evaluator = vi.fn().mockReturnValue({ amount: 100, name: 'IVA' });
    const basket = new Basket(
      { ID_Cotizacion: 'C1', paxGlobal: 10 },
      catalog,
      { rules: catalog.getBasketRules(), evaluator }
    );

    basket.add('ITEM_CHINOOK');
    const { taxes } = basket.totals;

    const taxRuleCalls = evaluator.mock.calls.filter(([rule]) => rule.Etapa === 'IMPUESTO');
    expect(taxRuleCalls.length).toBeGreaterThan(0);
    expect(taxes).toHaveLength(1);
    expect(taxes[0].amount).toBe(100);
  });

  it('total = subtotal + tax amount when IMPUESTO rule fires', () => {
    const catalog = new Catalog();
    catalog.load(createStoreWithRules());

    const taxAmount = 50000;
    const evaluator = vi.fn((rule) => {
      if (rule.Etapa === 'IMPUESTO') return { amount: taxAmount, name: 'IVA' };
      return null;
    });

    const basket = new Basket(
      { ID_Cotizacion: 'C1', paxGlobal: 10 },
      catalog,
      { rules: catalog.getBasketRules(), evaluator }
    );

    basket.add('ITEM_CHINOOK');
    const { subtotal, total } = basket.totals;
    expect(total).toBe(subtotal + taxAmount);
  });
});

// ── Item-level rules (AJUSTE_LINEA) ──────────────────────────────────────────

describe('Rule inheritance: item-level rules (AJUSTE_LINEA)', () => {
  it('items receive AJUSTE_LINEA rules from catalog', () => {
    const catalog = new Catalog();
    catalog.load(createStoreWithRules());
    const item = catalog.getItem('ITEM_CHINOOK');
    expect(item._rules.some(r => r.Etapa === 'AJUSTE_LINEA')).toBe(true);
  });

  it('evaluator is called for item rules when item.calculate() runs', () => {
    const catalog = new Catalog();
    catalog.load(createStoreWithRules());

    const evaluator = vi.fn().mockReturnValue(null);
    const basket = new Basket(
      { ID_Cotizacion: 'C1', paxGlobal: 10 },
      catalog,
      { evaluator }
    );

    basket.add('ITEM_CHINOOK');
    const itemEvalCalls = evaluator.mock.calls.filter(([rule]) => rule.Etapa === 'AJUSTE_LINEA');
    expect(itemEvalCalls.length).toBeGreaterThan(0);
  });

  it('RESTRICCION_UI rule that fires sets _available to false', () => {
    const catalog = new Catalog();
    // Inject a blocking rule
    catalog.load(createPricingTestStore());
    const chinook = catalog.getItem('ITEM_CHINOOK');
    chinook._rules.push({ ID_Regla: 'R_BLOCK', Etapa: 'RESTRICCION_UI', Activo: true, Acumulable: true });

    const evaluator = vi.fn((rule) => {
      if (rule.ID_Regla === 'R_BLOCK') return { blocking: true, description: 'blocked' };
      return null;
    });

    const basket = new Basket(
      { ID_Cotizacion: 'C1', paxGlobal: 10 },
      catalog,
      { evaluator }
    );

    const [item] = basket.add('ITEM_CHINOOK');
    expect(item._available).toBe(false);
  });
});
