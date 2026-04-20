export function Storable(Base) {
  return class extends Base {
    ID_Linea = null;
    ID_Item = null;
    ID_Categoria = null;
    ID_Cotizacion = null;

    _isDirty = false;

    toStorageObject() {
      throw new Error(`${this.constructor.name} must implement toStorageObject()`);
    }

    markDirty() {
      this._isDirty = true;
      return this;
    }

    markClean() {
      this._isDirty = false;
      return this;
    }

    hasStorageIdentity() {
      return [this.ID_Linea, this.ID_Item, this.ID_Categoria, this.ID_Cotizacion].some(
        (value) => value != null
      );
    }

    isSaved() {
      return !this._isDirty && this.hasStorageIdentity();
    }
  };
}
