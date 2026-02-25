export function Aggregable(Base) {
  return class extends Base {
    _children = new Map();
    _aggregateResult = { subtotal: 0, breakdown: [] };

    addChild(id, child) {
      this._children.set(id, child);
      return this;
    }

    removeChild(id) {
      this._children.delete(id);
      return this;
    }

    getChild(id) {
      return this._children.get(id);
    }

    getChildren() {
      return Array.from(this._children.values());
    }

    aggregate() {
      const breakdown = [];
      let subtotal = 0;

      for (const child of this._children.values()) {
        const childTotal = resolveChildTotal(child);

        breakdown.push({
          id: child?.ID_Linea ?? child?.ID_Item ?? child?.id ?? null,
          nombre: child?.Nombre ?? child?.nombre ?? child?.name ?? null,
          total: childTotal
        });

        subtotal += childTotal;
      }

      this._aggregateResult = { subtotal, breakdown };
      return this._aggregateResult;
    }

    get subtotal() {
      return this._aggregateResult.subtotal ?? 0;
    }
  };
}

function resolveChildTotal(child) {
  if (!child) {
    return 0;
  }

  if (typeof child.aggregate === 'function') {
    return child.aggregate().subtotal ?? 0;
  }

  if (typeof child.total === 'number') {
    return child.total;
  }

  if (typeof child._price === 'number') {
    return child._price;
  }

  return 0;
}
