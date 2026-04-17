import { describe, it, expect, vi } from 'vitest';
import { createBasketDayActor } from '../machine/basketDayMachine.js';

// Mock resolveItemDefinition to return our test kit
vi.mock('../../../database/src/resolveItemDefinition.js', () => ({
  resolveItemDefinition: vi.fn((itemId) => {
    if (itemId === 'KIT_PARENT') {
      return {
        ID_Item: 'KIT_PARENT',
        Nombre: 'Test Kit',
        perfil: { Costo_Unitario_Pax: 100 },
        categoria: { id: 'CAT1' },
        children: [
          { ID_Item_Hijo: 'KIT_CHILD_1', Cantidad: 1, Tipo_Precio: 'ABSORBIDO' }
        ]
      };
    }
    if (itemId === 'KIT_CHILD_1') {
      return {
        ID_Item: 'KIT_CHILD_1',
        Nombre: 'Child Item',
        perfil: { Costo_Unitario_Pax: 50 },
        categoria: { id: 'CAT1' }
      };
    }
    return { ID_Item: itemId, Nombre: 'Item' };
  })
}));

describe('BasketDay Kit Expansion', () => {
  const db = {
    items: [
      { ID_Item: 'KIT_PARENT', Activo: true, ID_Categoria: 'CAT1', Nombre: 'Test Kit' },
      { ID_Item: 'KIT_CHILD_1', Activo: true, ID_Categoria: 'CAT1', Nombre: 'Child Item' }
    ],
    categorias: [{ ID_Categoria: 'CAT1', Nombre: 'Category 1' }],
    composicionKit: [
       { ID_Item_Padre: 'KIT_PARENT', ID_Item_Hijo: 'KIT_CHILD_1', Cantidad: 1, Tipo_Precio: 'ABSORBIDO' }
    ]
  };

  it('should expand kit children when shipping a kit parent', () => {
    const actor = createBasketDayActor({ db });
    
    actor.send({ type: 'SHIP_ITEM', itemId: 'KIT_PARENT' });
    
    const state = actor.getSnapshot().context.state;
    expect(state.entryCount).toBe(2);
    
    const parent = state.entries.find(e => e.itemId === 'KIT_PARENT');
    const child = state.entries.find(e => e.itemId === 'KIT_CHILD_1');
    
    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    expect(child.groupId).toBe(parent.groupId);
    expect(child.parentId).toBe(parent.entryId);
    expect(child.state.isAbsorbido).toBe(true);
    expect(child.total).toBe(0);
  });

  it('should remove all children when parent is removed', () => {
    const actor = createBasketDayActor({ db });
    actor.send({ type: 'SHIP_ITEM', itemId: 'KIT_PARENT' });
    
    let state = actor.getSnapshot().context.state;
    const parentId = state.entries.find(e => e.itemId === 'KIT_PARENT').entryId;
    
    actor.send({ type: 'REMOVE_ENTRY', entryId: parentId });
    
    state = actor.getSnapshot().context.state;
    expect(state.entryCount).toBe(0);
  });
});
