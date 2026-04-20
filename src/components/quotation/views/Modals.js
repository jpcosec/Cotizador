import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class ModalsController extends UIContainerBase {
  constructor(runtime) {
    super();
    this.runtime = runtime;
    this.clientSearchTerm = '';
    this.quotationSearchTerm = '';
    this.quotationSearchResults = [];
    this.quotationSearchLoading = false;
    this.quotationSearchError = null;
    this.clientModalOpen = false;
    this.quotationSearchModalOpen = false;
  }

  onActorUpdate(snapshot) {
    this.clientModalOpen = snapshot.clientModalOpen;
    this.quotationSearchModalOpen = snapshot.quotationSearchModalOpen;
  }

  // Quotation Search Modal
  async openQuotationSearchModal() {
    this.quotationSearchError = null;
    this.quotationSearchLoading = true;
    try {
      const result = await this.runtime.listQuotations({ limit: 50 });
      if (!result?.ok) {
        this.quotationSearchResults = [];
        this.quotationSearchError = result?.error?.message || result?.error || 'Unable to load quotations';
        return;
      }
      this.quotationSearchResults = result.data?.items || [];
    } catch (err) {
      this.quotationSearchError = err.message || 'Error loading quotations';
    } finally {
      this.quotationSearchLoading = false;
    }
  }

  closeQuotationSearchModal() {
    this.quotationSearchError = null;
    // Note: visibility state is usually managed by the runtime/snapshot
  }

  setQuotationSearch(term) {
    this.quotationSearchTerm = String(term || '');
  }

  filteredQuotations() {
    const term = this.quotationSearchTerm.trim().toLowerCase();
    if (!term) return this.quotationSearchResults;
    return this.quotationSearchResults.filter((quotation) => {
      return [
        quotation.clientName,
        quotation.quotationId,
        quotation.quotationDate,
        quotation.pax,
      ].some((field) => String(field || '').toLowerCase().includes(term));
    });
  }

  async selectQuotationResult(quotationId) {
    this.closeQuotationSearchModal();
    await this.runtime.loadQuotation(quotationId);
  }

  // Client Modal
  setClientSearch(term) {
    this.clientSearchTerm = String(term || '');
  }

  filteredClients() {
    const snapshot = this.runtime.getSnapshot();
    const clients = snapshot.clients || [];
    const term = this.clientSearchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) => {
      return [client.nombre, client.rut, client.email].some((field) =>
        String(field || '').toLowerCase().includes(term)
      );
    });
  }

  selectClient(clientId) {
    this.runtime.selectClient(clientId);
  }

  toDisplayObject() {
    const snapshot = this.runtime.getSnapshot();
    return {
      clientSearchTerm: this.clientSearchTerm,
      quotationSearchTerm: this.quotationSearchTerm,
      quotationSearchResults: this.quotationSearchResults,
      quotationSearchLoading: this.quotationSearchLoading,
      quotationSearchError: this.quotationSearchError,
      clientModalOpen: snapshot.clientModalOpen,
      quotationSearchModalOpen: snapshot.quotationSearchModalOpen, // This might need to be synced if it's in runtime
      
      // Methods
      openQuotationSearchModal: () => this.openQuotationSearchModal(),
      closeQuotationSearchModal: () => this.closeQuotationSearchModal(),
      setQuotationSearch: (t) => this.setQuotationSearch(t),
      filteredQuotations: () => this.filteredQuotations(),
      selectQuotationResult: (id) => this.selectQuotationResult(id),
      setClientSearch: (t) => this.setClientSearch(t),
      filteredClients: () => this.filteredClients(),
      selectClient: (id) => this.selectClient(id),
    };
  }
}

export function createModals(runtime) {
  return new ModalsController(runtime);
}
