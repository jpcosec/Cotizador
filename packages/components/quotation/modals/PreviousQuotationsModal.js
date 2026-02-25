import { ModalControllerBase } from '../../common/base/ui/ModalControllerBase.js';

export class PreviousQuotationsModal extends ModalControllerBase {
  constructor(quotations = []) {
    super();
    this._quotations = [...quotations];
    this._searchTerm = '';
  }

  setQuotations(quotations = []) {
    this._quotations = [...quotations];
    return this;
  }

  search(term = '') {
    this._searchTerm = String(term).toLowerCase().trim();
    return this;
  }

  getFilteredQuotations() {
    if (!this._searchTerm) {
      return [...this._quotations];
    }

    return this._quotations.filter((quotation) => {
      const name = String(quotation?.cliente ?? '').toLowerCase();
      const id = String(quotation?.id ?? '').toLowerCase();
      return name.includes(this._searchTerm) || id.includes(this._searchTerm);
    });
  }

  selectQuotation(quotationId) {
    const selected = this._quotations.find((quotation) => quotation.id === quotationId);
    if (selected) {
      this.emit('QUOTATION_SELECTED', selected);
    }
    return this;
  }

  cancel() {
    this.emit('CANCEL');
    this.close();
    return this;
  }

  validate() {
    return [];
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      items: this.getFilteredQuotations(),
      isLoading: this.isLoading()
    };
  }
}

export function createPreviousQuotationsModal(quotations = []) {
  return new PreviousQuotationsModal(quotations);
}
