export function Modalable(Base) {
  return class extends Base {
    _isOpen = false;
    _isLoading = false;
    _errors = [];

    open() {
      this._isOpen = true;
      return this;
    }

    close() {
      this._isOpen = false;
      return this;
    }

    isOpen() {
      return this._isOpen;
    }

    setLoading(value) {
      this._isLoading = Boolean(value);
      return this;
    }

    isLoading() {
      return this._isLoading;
    }

    addError(message) {
      this._errors.push(message);
      return this;
    }

    getErrors() {
      return [...this._errors];
    }

    clearErrors() {
      this._errors = [];
      return this;
    }
  };
}
