/**
 * Prizable mixin — adds quantity resolution and price calculation to Item classes.
 *
 * Usage: class Foo extends Prizable(Base) { ... }
 *
 * Three user-settable quantities: pax, cantidad, duracion.
 * Each has a paired isUserSet boolean. When isUserSet = true, the value
 * is never overwritten by container context or item defaults.
 *
 * Resolution order (lowest to highest priority):
 *   itemRuleDefault → containerRuleOutput → userValue
 *
 * pricingFn is injected: (profile, pax, cantidad, duracion) => number
 * This keeps the mixin decoupled from the pricing package import.
 */
export function Prizable(Base) {
  return class extends Base {
    pax = null;
    paxIsUserSet = false;
    cantidad = null;
    cantidadIsUserSet = false;
    duracion = null;
    duracionIsUserSet = false;
    _profile = null;
    _price = null;
    _defaultPax = null;
    _defaultCantidad = null;
    _defaultDuracion = null;
    _pricingFn = null;

    resolveQuantities(containerContext = {}) {
      if (!this.paxIsUserSet) {
        this.pax = containerContext.pax ?? this._defaultPax ?? null;
      }
      if (!this.cantidadIsUserSet) {
        this.cantidad = containerContext.cantidad ?? this._defaultCantidad ?? null;
      }
      if (!this.duracionIsUserSet) {
        this.duracion = containerContext.duracion ?? this._defaultDuracion ?? null;
      }
    }

    calculatePrice() {
      if (!this._profile || !this._pricingFn) {
        this._price = null;
        return;
      }
      this._price = this._pricingFn(this._profile, this.pax, this.cantidad, this.duracion);
    }

    get displayPrice() {
      if (this._price == null) return 0;
      const divisor = this.pax || 1;
      return Math.round(this._price / divisor);
    }

    get total() {
      return this._price ?? 0;
    }
  };
}
