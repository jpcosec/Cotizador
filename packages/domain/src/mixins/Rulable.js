/**
 * Rulable mixin — adds rule evaluation to any class.
 *
 * Usage: class Foo extends Rulable(Base) { ... }
 *
 * The evaluator is injected (not imported) so this mixin stays testable
 * without a store. Concrete classes inject the real evaluator from RulesEngine.
 *
 * evaluator signature: (rule, context) => result | null
 * result must have at least { delta, description }. null = condition did not pass.
 *
 * Acumulable = false on a rule stops further rule processing after first match.
 */
export function Rulable(Base) {
  return class extends Base {
    _rules = [];
    _appliedRules = [];
    _inheritedContext = {};

    receiveContext(ctx) {
      this._inheritedContext = { ...this._inheritedContext, ...ctx };
      return this;
    }

    evaluateRules(evaluator) {
      this._appliedRules = [];
      for (const rule of this._rules) {
        if (!rule.Activo) continue;
        const result = evaluator(rule, this._buildRuleContext());
        if (result) {
          this._appliedRules.push({ ruleId: rule.ID_Regla, ...result });
          if (!rule.Acumulable) break;
        }
      }
      return this._appliedRules;
    }

    // Subclasses override this to provide context for rule conditions.
    _buildRuleContext() {
      return { ...this._inheritedContext };
    }
  };
}
