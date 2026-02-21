import { Rulable } from '../mixins/Rulable.js';
import { Aggregable } from '../mixins/Aggregable.js';
import { XStateable } from '../mixins/XStateable.js';
import { Alpineable } from '../mixins/Alpineable.js';

/**
 * ContainerBase — abstract base for Catalog, Basket, Category, DayCategory, Kit.
 *
 * Mixins composed (in order): Rulable + Aggregable + XStateable + Alpineable
 *
 * Containers:
 * - Hold children in _children (Map: id → child)
 * - Evaluate their own rules and push the resulting context down to children
 * - Aggregate children prices upward
 * - Do NOT price themselves (no Prizable mixin)
 *
 * Rule inheritance flow: Basket → DayCategory → Item
 * Price aggregation flow: Item → DayCategory → Basket
 *
 * Usage:
 *   const basket = new Basket();
 *   basket.receiveContext({ pax: 50, duracion: 8 });
 *   basket.pushContextToChildren();  // children now have the context
 *   const totals = basket.aggregate(); // { subtotal, breakdown[] }
 */
const ContainerMixin = (Base) =>
  Rulable(Aggregable(XStateable(Alpineable(Base))));

export class ContainerBase extends ContainerMixin(class {}) {
  constructor() {
    super();
    this._children = new Map();
    this._calculationParams = {}; // e.g. { pax, duracion, fechaEvento, duracionDias }
    this._evaluator = null; // injected: (rule, context) => result | null
  }

  // ── Context propagation ────────────────────────────────────────

  /**
   * Builds the context to be pushed down to children.
   *
   * Merges (in order of priority):
   * 1. _calculationParams (lowest priority)
   * 2. _inheritedContext (from parent)
   * 3. Rule outputs (highest priority)
   *
   * Subclasses can override to add extra fields or transform the context.
   */
  propagateContext() {
    const ruleOutputs = {};
    for (const result of this._appliedRules) {
      if (result.field && result.value !== undefined) {
        ruleOutputs[result.field] = result.value;
      }
    }
    return {
      ...this._calculationParams,
      ...this._inheritedContext,
      ...ruleOutputs,
    };
  }

  /**
   * Pushes context down to all children.
   *
   * Flow:
   * 1. If _evaluator is set, evaluate own rules (populates _appliedRules)
   * 2. Build context from params + inherited + rule outputs
   * 3. Call receiveContext() on each child
   *
   * Returns this for chaining.
   */
  pushContextToChildren() {
    if (this._evaluator) {
      this.evaluateRules(this._evaluator);
    }
    const ctx = this.propagateContext();
    for (const child of this._children.values()) {
      if (typeof child.receiveContext === 'function') {
        child.receiveContext(ctx);
      }
    }
    return this;
  }

  // ── Child management ───────────────────────────────────────────

  /**
   * Adds a child to the container.
   *
   * @param {string|number} id - Child identifier
   * @param {Object} child - Child object (usually another Container or Item)
   * @returns {this} for chaining
   */
  addChild(id, child) {
    this._children.set(id, child);
    return this;
  }

  /**
   * Removes a child by id.
   *
   * @param {string|number} id - Child identifier
   * @returns {this} for chaining
   */
  removeChild(id) {
    this._children.delete(id);
    return this;
  }

  /**
   * Retrieves a child by id.
   *
   * @param {string|number} id - Child identifier
   * @returns {Object|null} - The child, or null if not found
   */
  getChild(id) {
    return this._children.get(id) || null;
  }

  /**
   * Returns the number of children.
   *
   * @returns {number}
   */
  get childCount() {
    return this._children.size;
  }

  /**
   * Returns all children.
   *
   * @returns {IterableIterator<Object>}
   */
  *children() {
    yield* this._children.values();
  }

  // ── Display for Alpine.js ──────────────────────────────────────

  /**
   * Converts the container to a plain object suitable for Alpine store assignment.
   *
   * Uses aggregate() from the Aggregable mixin to sum child prices.
   * Calls toDisplayObject() on each child (Alpineable contract).
   *
   * @returns {Object} - { children: [], totals: { subtotal, breakdown } }
   */
  toDisplayObject() {
    const children = [];
    for (const child of this._children.values()) {
      if (typeof child.toDisplayObject === 'function') {
        children.push(child.toDisplayObject());
      }
    }
    return {
      children,
      totals: this.aggregate(),
    };
  }

  // ── Configuration ──────────────────────────────────────────────

  /**
   * Sets the calculation parameters (e.g., pax, duration, event date).
   *
   * @param {Object} params - Parameters to merge into _calculationParams
   * @returns {this} for chaining
   */
  setCalculationParams(params) {
    this._calculationParams = { ...this._calculationParams, ...params };
    return this;
  }

  /**
   * Sets the evaluator function for rule evaluation.
   *
   * Signature: (rule, context) => result | null
   *
   * @param {Function} evaluator - The rule evaluator
   * @returns {this} for chaining
   */
  setEvaluator(evaluator) {
    this._evaluator = evaluator;
    return this;
  }
}
