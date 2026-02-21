/**
 * Aggregable mixin — adds price aggregation to container classes.
 *
 * Usage: class Foo extends Aggregable(Base) { ... }
 *
 * Containers hold children in this._children (a Map).
 * Children that have aggregate() are containers themselves (recursive).
 * Children without aggregate() are leaf items with a _price property.
 *
 * Returns { subtotal, breakdown[] } where breakdown is one entry per child.
 */
export function Aggregable(Base) {
  return class extends Base {
    aggregate() {
      const breakdown = [];
      let subtotal = 0;

      for (const child of this._children.values()) {
        let childTotal;
        if (typeof child.aggregate === 'function') {
          childTotal = child.aggregate().subtotal;
        } else {
          childTotal = child._price ?? 0;
        }
        breakdown.push({
          id: child.ID_Linea || child.ID_Item || child.id || null,
          nombre: child.Nombre || child.nombre || null,
          total: childTotal,
        });
        subtotal += childTotal;
      }

      return { subtotal, breakdown };
    }
  };
}
