import { QuotationInitializer } from './QuotationInitializer.js';

export class GlobalVariablesForm extends QuotationInitializer {
  async submit() {
    const ok = await super.submit();
    if (ok) {
      this.emit('GLOBAL_VARIABLES_SUBMITTED', this.getFormState());
    }
    return ok;
  }

  toDisplayObject() {
    return {
      ...super.toDisplayObject(),
      mode: 'GLOBAL_VARIABLES'
    };
  }
}

export function createGlobalVariablesForm(initialContext = {}) {
  return new GlobalVariablesForm(initialContext);
}
