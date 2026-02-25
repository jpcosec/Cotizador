export function Formable(Base) {
  return class extends Base {
    _formState = {};
    _formErrors = {};

    setField(fieldName, value) {
      this._formState[fieldName] = value;
      if (fieldName in this._formErrors) {
        delete this._formErrors[fieldName];
      }
      return this;
    }

    getField(fieldName) {
      return this._formState[fieldName];
    }

    getFormState() {
      return { ...this._formState };
    }

    validate() {
      throw new Error(`${this.constructor.name} must implement validate()`);
    }

    setFieldError(fieldName, error) {
      this._formErrors[fieldName] = error;
      return this;
    }

    getFieldError(fieldName) {
      return this._formErrors[fieldName];
    }

    getFormErrors() {
      return { ...this._formErrors };
    }

    hasErrors() {
      return Object.keys(this._formErrors).length > 0;
    }

    clearFormErrors() {
      this._formErrors = {};
      return this;
    }
  };
}
