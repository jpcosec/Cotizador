import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class SidebarController extends UIContainerBase {
  constructor(runtime) {
    super();
    this.runtime = runtime;
    this.draggingCatalogItemId = null;
  }

  openClientModal() { this.runtime.openClientModal(); }
  setSetting(key, value) { this.runtime.setQuotationSettings({ [key]: value }); }
  setCatalogSearch(term) { this.runtime.setCatalogSearch(term); }
  toggleCategory(categoryId) { this.runtime.toggleCategory(categoryId); }
  shipCatalogEntry(itemId, overrides = {}) { this.runtime.shipItemToSelectedDay(itemId, overrides); }

  startCatalogDrag(itemId, event) {
    if (!itemId) return;
    this.draggingCatalogItemId = itemId;
    if (event?.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(itemId));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  endCatalogDrag() {
    this.draggingCatalogItemId = null;
  }

  toDisplayObject() {
    const snapshot = this.runtime.getSnapshot();
    return {
      selectedClient: snapshot.selectedClient,
      settings: snapshot.settings,
      catalog: snapshot.catalog,
      draggingCatalogItemId: this.draggingCatalogItemId,
      // Methods
      openClientModal: () => this.openClientModal(),
      setSetting: (k, v) => this.setSetting(k, v),
      setCatalogSearch: (t) => this.setCatalogSearch(t),
      toggleCategory: (id) => this.toggleCategory(id),
      shipCatalogEntry: (id, o) => this.shipCatalogEntry(id, o),
      startCatalogDrag: (id, e) => this.startCatalogDrag(id, e),
      endCatalogDrag: () => this.endCatalogDrag(),
    };
  }
}

export function createSidebar(runtime) {
  return new SidebarController(runtime);
}
