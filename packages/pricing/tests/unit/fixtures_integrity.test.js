import { describe, it, expect } from 'vitest';
import { createSeededStore } from '../helpers/store_factory.js';

describe('Fixtures Integrity', () => {
  const store = createSeededStore();

  it('store has expected items in ITEM_CATALOGO', () => {
    const items = store.all('ITEM_CATALOGO');
    expect(items.length).toBeGreaterThanOrEqual(15);
  });

  it('every item ID_Categoria exists in CATEGORIAS', () => {
    for (const item of store.all('ITEM_CATALOGO')) {
      const cat = store.findById('CATEGORIAS', 'ID_Categoria', item.ID_Categoria);
      expect(cat, `Missing category ${item.ID_Categoria} for item ${item.ID_Item}`).not.toBeNull();
    }
  });

  it('every item with ID_Perfil_Precio_Override has valid profile', () => {
    for (const item of store.all('ITEM_CATALOGO')) {
      if (!item.ID_Perfil_Precio_Override) continue;
      const profile = store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', item.ID_Perfil_Precio_Override);
      expect(profile, `Missing profile ${item.ID_Perfil_Precio_Override} for item ${item.ID_Item}`).not.toBeNull();
    }
  });

  it('every category with ID_Perfil_Precio_Default has valid profile', () => {
    for (const cat of store.all('CATEGORIAS')) {
      if (!cat.ID_Perfil_Precio_Default) continue;
      const profile = store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', cat.ID_Perfil_Precio_Default);
      expect(profile, `Missing profile ${cat.ID_Perfil_Precio_Default} for category ${cat.ID_Categoria}`).not.toBeNull();
    }
  });

  it('every composition parent and child items exist', () => {
    for (const comp of store.all('COMPOSICION_KIT')) {
      const parent = store.findById('ITEM_CATALOGO', 'ID_Item', comp.ID_Item_Padre);
      expect(parent, `Missing parent ${comp.ID_Item_Padre}`).not.toBeNull();
      const child = store.findById('ITEM_CATALOGO', 'ID_Item', comp.ID_Item_Hijo);
      expect(child, `Missing child ${comp.ID_Item_Hijo}`).not.toBeNull();
    }
  });

  it('every client referenced in scenarios exists', () => {
    expect(store.findById('CLIENTES', 'ID_Cliente', 'CLI_CORP')).not.toBeNull();
    expect(store.findById('CLIENTES', 'ID_Cliente', 'CLI_WEDDING')).not.toBeNull();
  });
});
