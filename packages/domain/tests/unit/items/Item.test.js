import { describe, it, expect, beforeEach } from 'vitest';
import { Item } from '../../../src/items/Item.js';

// ── Fixtures ───────────────────────────────────────────────────────────────

const BASE_ROW = {
  ID_Item:               'item-1',
  Nombre:                'Canapés',
  ID_Categoria:          'cat-appetizers',
  Activo:                true,
  Costo_Base:            500,
  Costo_Unitario_Pax:    20,
  Costo_Unitario_Tiempo: 10,
  Costo_Unitario_Item:   5,
  Pax_Default:           30,
  Cantidad_Default:      2,
  Duracion_Min_Default:  60,
  ID_Perfil:             'perfil-1',
  Es_Kit:                false,
};

const MOCK_PROFILE = { ID_Perfil: 'perfil-1', Nombre: 'Standard' };

function makeItem(rowOverrides = {}, opts = {}) {
  return new Item({ ...BASE_ROW, ...rowOverrides }, { profile: MOCK_PROFILE, ...opts });
}

// ── Construction ────────────────────────────────────────────────────────────

describe('Item — construction from DB row', () => {
  it('maps ID_Item', () => {
    const item = makeItem();
    expect(item.ID_Item).toBe('item-1');
  });

  it('maps Nombre', () => {
    const item = makeItem();
    expect(item.Nombre).toBe('Canapés');
  });

  it('maps ID_Categoria', () => {
    const item = makeItem();
    expect(item.ID_Categoria).toBe('cat-appetizers');
  });

  it('maps Activo = true when row.Activo = true', () => {
    const item = makeItem({ Activo: true });
    expect(item.Activo).toBe(true);
  });

  it('maps Activo = false when row.Activo = false', () => {
    const item = makeItem({ Activo: false });
    expect(item.Activo).toBe(false);
  });

  it('defaults Activo to true when missing from row', () => {
    const row = { ...BASE_ROW };
    delete row.Activo;
    const item = new Item(row);
    expect(item.Activo).toBe(true);
  });

  it('maps pricing coefficients', () => {
    const item = makeItem();
    expect(item.Costo_Base).toBe(500);
    expect(item.Costo_Unitario_Pax).toBe(20);
    expect(item.Costo_Unitario_Tiempo).toBe(10);
    expect(item.Costo_Unitario_Item).toBe(5);
  });

  it('maps default quantities to private fields', () => {
    const item = makeItem();
    expect(item._defaultPax).toBe(30);
    expect(item._defaultCantidad).toBe(2);
    expect(item._defaultDuracion).toBe(60);
  });

  it('sets _profile from options', () => {
    const item = makeItem();
    expect(item._profile).toBe(MOCK_PROFILE);
  });

  it('sets isKit = false for regular item', () => {
    const item = makeItem({ Es_Kit: false });
    expect(item.isKit).toBe(false);
  });

  it('sets isKit = true for kit item', () => {
    const item = makeItem({ Es_Kit: true });
    expect(item.isKit).toBe(true);
  });
});

// ── Getters ─────────────────────────────────────────────────────────────────

describe('Item — getters', () => {
  it('id getter returns ID_Item', () => {
    expect(makeItem().id).toBe('item-1');
  });

  it('name getter returns Nombre', () => {
    expect(makeItem().name).toBe('Canapés');
  });

  it('inBasket is false when ID_Linea is null (catalog state)', () => {
    expect(makeItem().inBasket).toBe(false);
  });

  it('inBasket is true after instantiate()', () => {
    const basket = makeItem().instantiate('linea-99');
    expect(basket.inBasket).toBe(true);
  });

  it('humanizedRules returns empty array when no rules applied', () => {
    expect(makeItem().humanizedRules).toEqual([]);
  });
});

// ── Default quantity resolution ──────────────────────────────────────────────

describe('Item — quantity resolution', () => {
  it('resolves pax from _defaultPax when no context', () => {
    const item = makeItem();
    item.calculate();
    expect(item.pax).toBe(30);
  });

  it('resolves cantidad from _defaultCantidad when no context', () => {
    const item = makeItem();
    item.calculate();
    expect(item.cantidad).toBe(2);
  });

  it('resolves duracion from _defaultDuracion when no context', () => {
    const item = makeItem();
    item.calculate();
    expect(item.duracion).toBe(60);
  });
});

// ── Price calculation ────────────────────────────────────────────────────────

describe('Item — calculate() pricing formula', () => {
  it('computes correct total from defaults', () => {
    // price = 500 + (30*20) + (60*10) + (2*5) = 500 + 600 + 600 + 10 = 1710
    const item = makeItem();
    item.calculate();
    expect(item.total).toBe(1710);
  });

  it('computes price = Costo_Base when all unit costs are 0 and quantities null', () => {
    const item = makeItem(
      {
        Costo_Base: 200,
        Costo_Unitario_Pax: 0,
        Costo_Unitario_Tiempo: 0,
        Costo_Unitario_Item: 0,
        Pax_Default: null,
        Cantidad_Default: null,
        Duracion_Min_Default: null,
      },
      { profile: MOCK_PROFILE }
    );
    item.calculate();
    expect(item.total).toBe(200);
  });

  it('uses user-set quantities when provided', () => {
    // price = 500 + (10*20) + (120*10) + (3*5) = 500 + 200 + 1200 + 15 = 1915
    const item = makeItem();
    item.updateQuantities({ pax: 10, cantidad: 3, duracion: 120 }, true);
    expect(item.total).toBe(1915);
  });

  it('uses injected pricingFn instead of default formula', () => {
    const customFn = (_profile, pax, _cantidad, _duracion) => pax * 999;
    const item = makeItem({}, { pricingFn: customFn });
    item.calculate();
    // pax defaults to 30 → 30 * 999 = 29970
    expect(item.total).toBe(29970);
  });

  it('displayPrice divides total by pax', () => {
    // total = 1710, pax = 30 → displayPrice = 57
    const item = makeItem();
    item.calculate();
    expect(item.displayPrice).toBe(57);
  });
});

// ── instantiate() ────────────────────────────────────────────────────────────

describe('Item — instantiate()', () => {
  it('returns a new instance, leaving the original unchanged', () => {
    const catalog = makeItem();
    const basket  = catalog.instantiate('linea-1');
    expect(basket).not.toBe(catalog);
    expect(catalog.ID_Linea).toBeNull();
  });

  it('new instance has ID_Linea set to the given lineId', () => {
    const basket = makeItem().instantiate('linea-42');
    expect(basket.ID_Linea).toBe('linea-42');
  });

  it('new instance shares the same prototype (has all methods)', () => {
    const basket = makeItem().instantiate('linea-1');
    expect(typeof basket.calculate).toBe('function');
    expect(typeof basket.toDisplayObject).toBe('function');
  });

  it('new instance resets computed state (_price, _appliedRules, _userAjustes)', () => {
    const catalog = makeItem();
    catalog.calculate();                    // sets _price
    const basket = catalog.instantiate('linea-1');
    expect(basket._price).toBeNull();
    expect(basket._appliedRules).toEqual([]);
    expect(basket._userAjustes).toEqual([]);
  });

  it('new instance resets user-set flags', () => {
    const catalog = makeItem();
    const basket  = catalog.instantiate('linea-1');
    expect(basket.paxIsUserSet).toBe(false);
    expect(basket.cantidadIsUserSet).toBe(false);
    expect(basket.duracionIsUserSet).toBe(false);
  });
});

// ── updateQuantities() ───────────────────────────────────────────────────────

describe('Item — updateQuantities()', () => {
  it('sets paxIsUserSet = true when isUserOverride = true', () => {
    const item = makeItem();
    item.updateQuantities({ pax: 25 }, true);
    expect(item.paxIsUserSet).toBe(true);
    expect(item.pax).toBe(25);
  });

  it('does NOT set paxIsUserSet when isUserOverride = false', () => {
    const item = makeItem();
    item.updateQuantities({ pax: 25 }, false);
    expect(item.paxIsUserSet).toBe(false);
    // calculate() resolves quantities from defaults since flag is false;
    // _defaultPax (30) wins over the passed value (25)
    expect(item.pax).toBe(30);
  });

  it('user-set pax is not overwritten by subsequent container context', () => {
    const item = makeItem();
    item.updateQuantities({ pax: 25 }, true);
    item.receiveContext({ pax: 100 });
    item.calculate();
    expect(item.pax).toBe(25);
  });
});

// ── toDisplayObject() ────────────────────────────────────────────────────────

describe('Item — toDisplayObject()', () => {
  it('returns an object with all expected keys', () => {
    const item = makeItem();
    item.calculate();
    const obj  = item.toDisplayObject();
    const EXPECTED_KEYS = [
      'id', 'lineId', 'itemId', 'nombre', 'dia', 'hora', 'comentarios',
      'pax', 'paxIsUserSet', 'cantidad', 'cantidadIsUserSet',
      'duracion', 'duracionIsUserSet', 'precio', 'total',
      'available', 'isKit', 'appliedRules', 'userAjustes',
    ];
    EXPECTED_KEYS.forEach(key => expect(obj).toHaveProperty(key));
  });

  it('id uses ID_Item in catalog state (no ID_Linea)', () => {
    const item = makeItem();
    expect(item.toDisplayObject().id).toBe('item-1');
  });

  it('id uses ID_Linea in basket state', () => {
    const basket = makeItem().instantiate('linea-7');
    expect(basket.toDisplayObject().id).toBe('linea-7');
  });

  it('nombre matches the item name', () => {
    expect(makeItem().toDisplayObject().nombre).toBe('Canapés');
  });

  it('isKit matches the item flag', () => {
    expect(makeItem({ Es_Kit: true }).toDisplayObject().isKit).toBe(true);
  });

  it('appliedRules is an empty array when no rules fired', () => {
    const obj = makeItem().toDisplayObject();
    expect(obj.appliedRules).toEqual([]);
  });
});

// ── toStorageObject() ────────────────────────────────────────────────────────

describe('Item — toStorageObject()', () => {
  it('Override_Pax is null when paxIsUserSet = false', () => {
    const basket = makeItem().instantiate('linea-1');
    expect(basket.toStorageObject().Override_Pax).toBeNull();
  });

  it('Override_Pax holds the value when paxIsUserSet = true', () => {
    const basket = makeItem().instantiate('linea-1');
    basket.updateQuantities({ pax: 40 }, true);
    expect(basket.toStorageObject().Override_Pax).toBe(40);
  });

  it('Override_Cantidad is null when cantidadIsUserSet = false', () => {
    const basket = makeItem().instantiate('linea-1');
    expect(basket.toStorageObject().Override_Cantidad).toBeNull();
  });

  it('Override_Duracion_Min is null when duracionIsUserSet = false', () => {
    const basket = makeItem().instantiate('linea-1');
    expect(basket.toStorageObject().Override_Duracion_Min).toBeNull();
  });

  it('includes ID_Item and ID_Linea', () => {
    const basket = makeItem().instantiate('linea-5');
    const obj    = basket.toStorageObject();
    expect(obj.ID_Item).toBe('item-1');
    expect(obj.ID_Linea).toBe('linea-5');
  });
});

// ── Context inheritance ───────────────────────────────────────────────────────

describe('Item — context inheritance (receiveContext)', () => {
  it('receiveContext pax overrides default pax in calculate()', () => {
    const item = makeItem();
    item.receiveContext({ pax: 50 });
    item.calculate();
    expect(item.pax).toBe(50);
  });

  it('user-set pax beats received context pax', () => {
    const item = makeItem();
    item.updateQuantities({ pax: 15 }, true);   // user sets 15
    item.receiveContext({ pax: 50 });             // container says 50
    item.calculate();
    expect(item.pax).toBe(15);                   // user wins
  });

  it('partial context only overrides matching quantities', () => {
    const item = makeItem();
    item.receiveContext({ pax: 50 });
    item.calculate();
    expect(item.pax).toBe(50);
    expect(item.cantidad).toBe(2);    // still default
    expect(item.duracion).toBe(60);   // still default
  });
});

// ── Rules ────────────────────────────────────────────────────────────────────

describe('Item — humanizedRules', () => {
  it('is empty array when _appliedRules is empty', () => {
    expect(makeItem().humanizedRules).toEqual([]);
  });

  it('returns description strings from applied rules', () => {
    const item = makeItem();
    item._appliedRules = [
      { ruleId: 'R1', description: 'Descuento 10%', delta: -10 },
    ];
    expect(item.humanizedRules).toEqual(['Descuento 10%']);
  });

  it('falls back to ruleId when description is missing', () => {
    const item = makeItem();
    item._appliedRules = [{ ruleId: 'R2', delta: 0 }];
    expect(item.humanizedRules).toEqual(['R2']);
  });
});
