import { describe, expect, it, vi } from 'vitest';
import { ItemPlaygroundController } from './ItemPlaygroundController.js';

describe('ItemPlaygroundController', () => {
  it('ships a catalog entry back into basket runtime', () => {
    const controller = new ItemPlaygroundController({ db: { items: [] }, resolveItemDefinition: vi.fn() });
    controller.catalogEntries = [{ id: 'cat-1', state: { definition: { ID_Item: 'ITEM-1', Nombre: 'Item 1' } } }];
    const spy = vi.spyOn(controller, 'createRuntimeEntry').mockImplementation(() => {});
    controller.shipCatalogEntry('cat-1');
    expect(spy).toHaveBeenCalledWith('basket', controller.catalogEntries[0].state.definition, 'basket', 'cat-1');
  });

  it('updates global context and broadcasts the patch', () => {
    const controller = new ItemPlaygroundController({ db: { items: [] }, resolveItemDefinition: vi.fn() });
    const spy = vi.spyOn(controller, 'broadcastContext').mockImplementation(() => {});
    controller.setGlobalField('paxGlobal', '42');
    expect(controller.globalContext.paxGlobal).toBe(42);
    expect(spy).toHaveBeenCalled();
  });
});
