export function Prizable(Base) {
  return class extends Base {
    pax = null;
    paxIsUserSet = false;

    cantidad = null;
    cantidadIsUserSet = false;

    duracion = null;
    duracionIsUserSet = false;

    _defaultPax = null;
    _defaultCantidad = null;
    _defaultDuracion = null;

    _profile = null;
    _price = null;
    _pricingFn = null;

    resolveQuantities(containerContext = {}) {
      const inheritedContext = this._inheritedContext ?? {};

      if (!this.paxIsUserSet) {
        this.pax = containerContext.pax ?? inheritedContext.pax ?? this._defaultPax ?? null;
      }

      if (!this.cantidadIsUserSet) {
        this.cantidad =
          containerContext.cantidad ?? inheritedContext.cantidad ?? this._defaultCantidad ?? null;
      }

      if (!this.duracionIsUserSet) {
        this.duracion =
          containerContext.duracion ?? inheritedContext.duracion ?? this._defaultDuracion ?? null;
      }

      return this;
    }

    calculatePrice() {
      if (!this._profile || typeof this._pricingFn !== 'function') {
        this._price = null;
        return this;
      }

      this._price = this._pricingFn(this._profile, this.pax, this.cantidad, this.duracion);
      return this;
    }

    setUserQuantity(field, value) {
      this[field] = value;
      this[`${field}IsUserSet`] = true;
      this.calculatePrice();
      return this;
    }

    get displayPrice() {
      if (this._price == null) {
        return 0;
      }

      const divisor = this.pax || 1;
      return Math.round(this._price / divisor);
    }

    get total() {
      return this._price ?? 0;
    }
  };
}
