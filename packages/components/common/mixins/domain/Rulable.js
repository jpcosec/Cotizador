export function Rulable(Base) {
  return class extends Base {
    _rules = [];
    _appliedRules = [];
    _inheritedContext = {};
    _evaluator = null;

    setRules(rules = []) {
      this._rules = Array.isArray(rules) ? [...rules] : [];
      return this;
    }

    receiveContext(context = {}) {
      this._inheritedContext = {
        ...this._inheritedContext,
        ...context
      };
      return this;
    }

    evaluateRules(evaluator = this._evaluator) {
      this._appliedRules = [];
      if (typeof evaluator !== 'function') {
        return this;
      }

      const context = this._buildRuleContext();
      for (const rule of this._rules) {
        if (!rule?.Activo) {
          continue;
        }

        const result = evaluator(rule, context);
        if (!result) {
          continue;
        }

        this._appliedRules.push({ ruleId: rule.ID_Regla, ...result });
        if (rule.Acumulable === false) {
          break;
        }
      }

      return this;
    }

    propagateContext(ruleOutputs = {}) {
      const merged = {
        ...this._inheritedContext,
        ...ruleOutputs
      };

      const children = this._children?.values?.() ?? [];
      for (const child of children) {
        if (typeof child?.receiveContext === 'function') {
          child.receiveContext(merged);
        }
      }

      return this;
    }

    getAppliedRules() {
      return [...this._appliedRules];
    }

    _buildRuleContext() {
      return { ...this._inheritedContext };
    }
  };
}
