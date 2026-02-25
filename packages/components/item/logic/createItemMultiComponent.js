import { createItemActor } from '../machine/itemMachine.js';

/**
 * Mount multiple standalone items into a DOM element.
 * Each item is independent with its own state and rules.
 * @param {HTMLElement|null} root - Container element to mount into.
 */
export async function mountItemMulti(root) {
  if (!root) return;

  const templatePath = '/packages/components/item/ui/ItemStandalone.html';
  const templateHtml = await fetch(templatePath).then(res => res.text());

  // Manage multiple items
  let items = [];
  let nextId = 0;

  function createItem() {
    const id = nextId++;
    const initialSeed = {
      mode: 'catalog',
      definition: {
        name: `Item ${id + 1}`,
        category: 'Test',
        description: 'Item for testing rules coordinator',
        pricingProfile: { baseFijo: 400, porPersona: 0, porUnidad: 1, porMinuto: 0 },
        defaultQuantities: { unidadesPorUsuario: 3, unidadesPorHora: 0, minutosPorUsuario: 0 },
        rules: []
      },
      externalContext: { paxGlobal: 20, duracionMin: 120, dia: 1, hora: '09:00' },
      overrides: {}
    };

    const actor = createItemActor(initialSeed);

    const component = {
      id,
      actor,
      el: null,
      state: actor.getSnapshot().context,
      _subscription: null,
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
        this._subscription = actor.subscribe(snap => {
          this.state = snap.context;
        });
      },

      destroy() {
        if (this._subscription) this._subscription();
      },

      // Rule management
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

      removeRule(index) {
        this.rules.splice(index, 1);
        this.updateItemRules();
      },

      toggleRuleActive(index) {
        this.rules[index].Activo = !this.rules[index].Activo;
        this.updateItemRules();
      },

      updateItemRules() {
        const newSeed = { ...initialSeed, definition: { ...initialSeed.definition, rules: this.rules } };
        actor = createItemActor(newSeed);
        this._subscription = actor.subscribe(snap => {
          this.state = snap.context;
        });
      },

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

      editRuleJson(index, field, value) {
        try {
          const parsed = JSON.parse(value);
          this.rules[index][field] = parsed;
          this.updateItemRules();
        } catch (e) {
          console.error(`Invalid JSON for ${field}:`, e.message);
        }
      },

      // Item controls
      addToBasket() {
        actor.send({ type: 'ADD_TO_BASKET' });
      },

      removeFromBasket() {
        actor.send({ type: 'REMOVE_FROM_BASKET' });
      },

      setContext(key, value) {
        actor.send({ type: 'SET_CONTEXT', patch: { [key]: Number(value) || value } });
      },

      setProfileValue(key, value) {
        actor.send({ type: 'SET_PROFILE_VALUE', key, value: Number(value) });
      },

      setDefaultQuantity(key, value) {
        actor.send({ type: 'SET_DEFAULT_QUANTITY', key, value: Number(value) });
      },

      clearDefaultQuantity(key) {
        actor.send({ type: 'CLEAR_DEFAULT_QUANTITY', key });
      },

      setOverride(key, value) {
        actor.send({ type: 'SET_OVERRIDE', key, value });
      },

      clearOverride(key) {
        actor.send({ type: 'CLEAR_OVERRIDE', key });
      },

      resetOverrides() {
        actor.send({ type: 'RESET_OVERRIDES' });
      },

      prettyState() {
        return JSON.stringify(this.state, null, 2);
      }
    };

    return component;
  }

  // Setup global API
  window.itemMultiAPI = {
    addItem() {
      const item = createItem();
      items.push(item);
      render();
      return item.id;
    },
    removeItem(id) {
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) {
        items[idx].destroy();
        items.splice(idx, 1);
        render();
      }
    },
    getItem(id) {
      return items.find(i => i.id === id);
    },
    getItems() {
      return items;
    }
  };

  function render() {
    root.innerHTML = `
      <div style="max-width: 1400px; margin: 0 auto; padding: 20px;">
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0;">Item Component - Multi View</h2>
          <button onclick="window.itemMultiAPI.addItem()" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
            + Add Item
          </button>
          <span style="margin-left: 10px; color: #666;">${items.length} item(s)</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(600px, 1fr)); gap: 20px;">
          ${items.map((item, idx) => `
            <div style="position: relative; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
              <button onclick="window.itemMultiAPI.removeItem(${item.id})" style="position: absolute; top: 10px; right: 10px; background: #ff4444; color: white; border: none; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 14px;">×</button>
              <div id="item-${item.id}"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Initialize each item's Alpine component
    items.forEach((item, idx) => {
      const el = document.getElementById(`item-${item.id}`);
      if (el) {
        item.el = el;
        el.innerHTML = templateHtml;

        // Register component for this specific item
        const componentName = `itemStandaloneComponent_${item.id}`;
        window[componentName] = () => ({ ...item });

        // Manually initialize since we're setting x-data dynamically
        item.init();

        // Find the x-data root and initialize Alpine on it
        const root = el.querySelector('[x-data]');
        if (root && window.Alpine) {
          // Set the component data
          root.setAttribute('x-data', `itemStandaloneComponent_${item.id}()`);
          window.Alpine.initTree(root);
        }
      }
    });
  }

  // Start with one item
  window.itemMultiAPI.addItem();
}
