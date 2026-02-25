import { createItemActor } from '../machine/itemMachine.js';

function createDefaultSeed() {
  return {
    mode: 'catalog',
    definition: {
      name: 'Test Item',
      category: 'Test',
      description: 'Item for testing rules coordinator',
      pricingProfile: { baseFijo: 400, porPersona: 0, porUnidad: 1, porMinuto: 0 },
      defaultQuantities: { unidadesPorUsuario: 3, unidadesPorHora: 0, minutosPorUsuario: 0 },
      rules: []
    },
    externalContext: { paxGlobal: 20, duracionMin: 120, dia: 1, hora: '09:00' },
    overrides: {}
  };
}

function mergeSeed(seedOverride = {}) {
  const base = createDefaultSeed();
  return {
    ...base,
    ...seedOverride,
    definition: {
      ...base.definition,
      ...(seedOverride.definition || {}),
      pricingProfile: {
        ...base.definition.pricingProfile,
        ...((seedOverride.definition || {}).pricingProfile || {})
      },
      defaultQuantities: {
        ...base.definition.defaultQuantities,
        ...((seedOverride.definition || {}).defaultQuantities || {})
      },
      rules: [...(((seedOverride.definition || {}).rules) || base.definition.rules)]
    },
    externalContext: {
      ...base.externalContext,
      ...(seedOverride.externalContext || {})
    },
    overrides: {
      ...base.overrides,
      ...(seedOverride.overrides || {})
    }
  };
}

/**
 * Mount the standalone item component into a DOM element.
 * Fetches the HTML template, creates an XState actor, and registers
 * an Alpine.js component (`itemStandaloneComponent`) on `window`.
 * Supports dynamic rule editing in the UI.
 * @param {HTMLElement|null} root - Container element to mount into. No-op if null.
 * @param {{ seed?: Object }} [options] - Optional seed override.
 * @returns {Function|undefined} Cleanup function that unsubscribes actor updates.
 */
export async function mountItemStandalone(root, options = {}) {
  if (!root) return;

  const templatePath = '/packages/components/item/ui/ItemStandalone.html';
  const html = await fetch(templatePath).then(res => res.text());

  const initialSeed = mergeSeed(options.seed);

  let actor = createItemActor(initialSeed);
  let latestUnsubscribe = null;

  function resubscribe(onSnapshot) {
    if (typeof latestUnsubscribe === 'function') {
      latestUnsubscribe();
    }
    latestUnsubscribe = actor.subscribe(onSnapshot);
    return latestUnsubscribe;
  }

  window.itemStandaloneComponent = function itemStandaloneComponent() {
    return {
      // Reactive state from actor snapshot
      state: actor.getSnapshot().context,
      _subscription: null,

      // Rules editor state
      rules: [...initialSeed.definition.rules],
      newRuleForm: {
        ID_Regla: '',
        Nombre: '',
        Scope: 'ITEM',
        Tipo_Accion: 'ERROR',
        Condicion_JSON: '{}',
        Payload_JSON: '{"message":""}',
        Prioridad: 10,
        Acumulable: false,
        Activo: true
      },
      formExpanded: false,

      init() {
        this._subscription = resubscribe(snap => {
          this.state = snap.context;
        });
        this.expandedRules = {};
      },

      // ─── Rule Management ───

      /**
       * Add a new rule and update the actor.
       */
      addRule() {
        const rule = {
          ...this.newRuleForm,
          ID_Regla: this.newRuleForm.ID_Regla || `R_${Date.now()}`,
          Condicion_JSON: typeof this.newRuleForm.Condicion_JSON === 'string'
            ? JSON.parse(this.newRuleForm.Condicion_JSON)
            : this.newRuleForm.Condicion_JSON,
          Payload_JSON: typeof this.newRuleForm.Payload_JSON === 'string'
            ? JSON.parse(this.newRuleForm.Payload_JSON)
            : this.newRuleForm.Payload_JSON
        };

        this.rules.push(rule);
        this.updateItemRules();
        this.resetRuleForm();
      },

      /**
       * Remove rule at index and update actor.
       */
      removeRule(index) {
        this.rules.splice(index, 1);
        this.updateItemRules();
      },

      /**
       * Toggle rule active status.
       */
      toggleRuleActive(index) {
        this.rules[index].Activo = !this.rules[index].Activo;
        this.updateItemRules();
      },

      /**
       * Update the Item with new rules and recreate actor.
       */
      updateItemRules() {
        const newSeed = { ...initialSeed, definition: { ...initialSeed.definition, rules: this.rules } };
        actor = createItemActor(newSeed);
        this._subscription = resubscribe(snap => {
          this.state = snap.context;
        });
      },

      /**
       * Reset form to empty state.
       */
      resetRuleForm() {
        this.newRuleForm = {
          ID_Regla: '',
          Nombre: '',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: '{}',
          Payload_JSON: '{"message":""}',
          Prioridad: 10,
          Acumulable: false,
          Activo: true
        };
      },

      /**
       * Edit rule JSON inline (Condicion or Payload).
       */
      editRuleJson(index, field, value) {
        try {
          const parsed = JSON.parse(value);
          this.rules[index][field] = parsed;
          this.updateItemRules();
        } catch (e) {
          console.error(`Invalid JSON for ${field}:`, e.message);
        }
      },

      /**
       * Toggle add rule form visibility.
       */
      toggleAddRuleForm() {
        this.formExpanded = !this.formExpanded;
      },

      /**
       * Toggle rule card expanded state.
       */
      toggleRuleExpanded(index) {
        if (!this.expandedRules) this.expandedRules = {};
        this.expandedRules[index] = !this.expandedRules[index];
      },

      // ─── Item Controls (moved to left sidebar) ───

      // Mode transitions
      addToBasket() {
        actor.send({ type: 'ADD_TO_BASKET' });
      },
      removeFromBasket() {
        actor.send({ type: 'REMOVE_FROM_BASKET' });
      },

      // Context (global pax, duration, schedule)
      setContext(key, value) {
        actor.send({ type: 'SET_CONTEXT', patch: { [key]: Number(value) || value } });
      },

      // Profile editing
      setProfileValue(key, value) {
        actor.send({ type: 'SET_PROFILE_VALUE', key, value: Number(value) });
      },

      // Default quantity editing
      setDefaultQuantity(key, value) {
        actor.send({ type: 'SET_DEFAULT_QUANTITY', key, value: Number(value) });
      },
      clearDefaultQuantity(key) {
        actor.send({ type: 'CLEAR_DEFAULT_QUANTITY', key });
      },

      // Overrides (basket mode)
      setOverride(key, value) {
        actor.send({ type: 'SET_OVERRIDE', key, value });
      },
      clearOverride(key) {
        actor.send({ type: 'CLEAR_OVERRIDE', key });
      },
      resetOverrides() {
        actor.send({ type: 'RESET_OVERRIDES' });
      },

      // Debug
      prettyState() {
        return JSON.stringify(this.state, null, 2);
      },

      // ─── Humanization & Tree Rendering ───

      /**
       * Humanize a JSON-Logic condition into readable English.
       * @param {Object} condition - JSON-Logic expression
       * @returns {string} Human-readable description
       */
      humanizeCondition(condition) {
        if (!condition || typeof condition !== 'object') {
          return 'No condition';
        }

        const humanize = (cond, depth = 0) => {
          const indent = '  '.repeat(depth);
          const keys = Object.keys(cond);

          if (keys.length === 0) return 'No condition';
          if (keys.length === 1) {
            const op = keys[0];
            const value = cond[op];

            // Logical operators
            if (op === 'and') {
              const parts = (Array.isArray(value) ? value : [value])
                .map(v => humanize(v, depth + 1))
                .join(' AND ');
              return parts;
            }
            if (op === 'or') {
              const parts = (Array.isArray(value) ? value : [value])
                .map(v => humanize(v, depth + 1))
                .join(' OR ');
              return parts;
            }

            // Comparison operators
            const comparisons = {
              '===': (vals) => `${vals[0]} equals ${vals[1]}`,
              '!==': (vals) => `${vals[0]} not equals ${vals[1]}`,
              '>': (vals) => `${vals[0]} greater than ${vals[1]}`,
              '<': (vals) => `${vals[0]} less than ${vals[1]}`,
              '>=': (vals) => `${vals[0]} greater than or equal ${vals[1]}`,
              '<=': (vals) => `${vals[0]} less than or equal ${vals[1]}`
            };

            if (comparisons[op]) {
              const operands = (Array.isArray(value) ? value : [value])
                .map(v => (typeof v === 'object' && v.var ? `variable "${v.var}"` : v))
                .slice(0, 2);
              return comparisons[op](operands);
            }

            return `${op}: ${JSON.stringify(value)}`;
          }

          return JSON.stringify(cond, null, 2);
        };

        return humanize(condition);
      },

      /**
       * Render JSON-Logic condition as a formatted tree.
       * @param {Object} condition - JSON-Logic expression
       * @param {number} depth - Current nesting depth
       * @returns {string} HTML-formatted tree (escaped for pre tags)
       */
      renderConditionTree(condition, depth = 0) {
        if (!condition || typeof condition !== 'object') {
          return 'null';
        }

        const indent = '  '.repeat(depth);
        const nextIndent = '  '.repeat(depth + 1);
        const keys = Object.keys(condition);

        if (keys.length === 0) return '{}';

        let result = '{\n';
        keys.forEach((key, idx) => {
          const value = condition[key];
          const comma = idx < keys.length - 1 ? ',' : '';

          // Color key based on operator type
          const keyColor = this.getKeyColor(key);
          result += `${nextIndent}<span style="color: ${keyColor}">"${key}"</span>: `;

          if (Array.isArray(value)) {
            result += '[\n';
            value.forEach((item, itemIdx) => {
              if (typeof item === 'object') {
                result += this.renderConditionTree(item, depth + 2);
              } else {
                result += `${nextIndent}  ${JSON.stringify(item)}`;
              }
              if (itemIdx < value.length - 1) result += ',';
              result += '\n';
            });
            result += `${nextIndent}]${comma}\n`;
          } else if (typeof value === 'object') {
            result += this.renderConditionTree(value, depth + 1) + comma + '\n';
          } else {
            result += `${JSON.stringify(value)}${comma}\n`;
          }
        });

        result += `${indent}}`;
        return result;
      },

      /**
       * Get color for JSON-Logic operator keys.
       * @param {string} key - Operator key
       * @returns {string} CSS color
       */
      getKeyColor(key) {
        if (['and', 'or', 'not'].includes(key)) return '#f59e0b'; // Amber for logic
        if (['>', '<', '>=', '<=', '===', '!==', '==', '!='].includes(key)) return '#10b981'; // Green for comparison
        if (key === 'var') return '#60a5fa'; // Blue for variables
        return '#cbd5e1'; // Gray for other
      },

      /**
       * Format condition for preview (truncate long JSON).
       * @param {Object} condition - JSON-Logic expression
       * @returns {string} Truncated JSON string
       */
      formatConditionPreview(condition) {
        const json = JSON.stringify(condition);
        return json.length > 60 ? json.substring(0, 60) + '...' : json;
      }
    };
  };

  root.innerHTML = html;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(root);
  }

  return function unmountItemStandalone() {
    if (typeof latestUnsubscribe === 'function') {
      latestUnsubscribe();
      latestUnsubscribe = null;
    }
    root.innerHTML = '';
  };
}
