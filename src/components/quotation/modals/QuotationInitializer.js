import { ModalControllerBase } from '../../common/base/ui/ModalControllerBase.js';

export class QuotationInitializer extends ModalControllerBase {
  constructor(initialContext = {}) {
    super();
    this.setField('pax', initialContext.pax ?? null);
    this.setField('fecha', initialContext.fecha ?? '');
    this.setField('duracion', initialContext.duracion ?? 1);
  }

  validate() {
    this.clearFormErrors();
    const errors = [];

    const pax = Number(this.getField('pax'));
    if (!Number.isFinite(pax) || pax < 1) {
      this.setFieldError('pax', 'Pax must be at least 1');
      errors.push('pax');
    }

    const fecha = String(this.getField('fecha') ?? '').trim();
    if (!fecha) {
      this.setFieldError('fecha', 'Date is required');
      errors.push('fecha');
    }

    const duracion = Number(this.getField('duracion'));
    if (!Number.isFinite(duracion) || duracion < 1) {
      this.setFieldError('duracion', 'Duration must be at least 1');
      errors.push('duracion');
    }

    return errors;
  }

  async submit() {
    const errors = this.validate();
    if (errors.length > 0) {
      this.emit('VALIDATION_ERROR', {
        errors,
        fieldErrors: this.getFormErrors()
      });
      return false;
    }

    const preloader = this.getService('databasePreloader');
    if (preloader && typeof preloader.load === 'function') {
      this.setLoading(true);
      try {
        if (typeof preloader.isReady !== 'function' || !preloader.isReady()) {
          await preloader.load();
        }
      } catch (error) {
        this.setLoading(false);
        this.addError(error.message);
        this.emit('DB_LOAD_ERROR', { error });
        return false;
      }
      this.setLoading(false);
    }

    this.emit('FORM_SUBMITTED', this.getFormState());
    return true;
  }

  cancel() {
    this.emit('FORM_CANCELLED');
    this.close();
    return this;
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      isLoading: this.isLoading(),
      formData: this.getFormState(),
      formErrors: this.getFormErrors(),
      errors: this.getErrors()
    };
  }
}

export function createQuotationInitializer(initialContext = {}) {
  return new QuotationInitializer(initialContext);
}
