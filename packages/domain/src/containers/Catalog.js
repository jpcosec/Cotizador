import { ContainerBase } from '../base/ContainerBase.js';
import { Category } from './Category.js';
import { Kit } from './Kit.js';
import { Item } from '../items/Item.js';

/**
 * Catalog — top-level collection of categories, kits, and items.
 *
 * Extends ContainerBase (Rulable + Aggregable + XStateable + Alpineable).
 *
 * Children are Category containers. Kit parent items are wrapped in Kit
 * containers (catalog mode) and placed inside their category.
 *
 * Load sequence:
 *   1. ITEM_CATALOGO     → Item instances
 *   2. CATEGORIAS        → Category containers
 *   3. PERFILES_PRECIO   → profile lookup map
 *   4. COMPOSICION_KIT   → identify kit parents
 *   5. REGLAS_NEGOCIO    → assign ITEM rules to items; CATALOGO rules to this
 *   6. Inject profiles into items
 *   7. Place items into categories
 *   8. Wrap kit parents in Kit containers
 *   9. Add categories to this._children
 */
export class Catalog extends ContainerBase {
  constructor({ evaluator = null } = {}) {
    super();
    this._evaluator = evaluator;
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Loads all catalog data from the store.
   * @param {Object} store - Store implementing .all(tableName)
   * @returns {this} for chaining
   */
  load(store) {
    const itemRows = store.all('ITEM_CATALOGO');
    const catRows = store.all('CATEGORIAS');
    const profileRows = store.all('PERFILES_PRECIO');
    const kitCompRows = store.all('COMPOSICION_KIT');
    const ruleRows = store.all('REGLAS_NEGOCIO');

    const profilesMap = _buildProfilesMap(profileRows);
    const categoriesMap = _buildCategoriesMap(catRows);
    const kitParentIds = _buildKitParentIds(kitCompRows);

    const items = _buildItems(itemRows, profilesMap, categoriesMap);
    const categories = _buildCategories(catRows);

    // ✅ VALIDATION: Parent kits must have zero cost
    _validateKitParentCosts(items, kitParentIds);
    // TODO: THIS SHOULD NOT BE NECESSARY, KITS SHOULD HAVE ZERO COST ON INITIALIZATION
    _assignRules(ruleRows, items, this);
    _placeItemsInCategories(items, categories, kitParentIds, kitCompRows);

    // ✅ Calculate display prices for all items in catalog mode
    for (const item of items.values()) {
      if (typeof item.calculate === 'function') {
        item.calculate();
      }
    }

    for (const [id, category] of categories) {
      this.addChild(id, category);
    }

    return this;
  }

  /**
   * Clears state and reloads from store.
   * @param {Object} store
   * @returns {this} for chaining
   */
  reload(store) {
    this._children.clear();
    this._rules = [];
    return this.load(store);
  }

  /**
   * Returns basket-level rules (AJUSTE_GLOBAL, IMPUESTO) stored on this catalog.
   * Pass these to new Basket instances so they can apply totals-level rules.
   * @returns {Array}
   */
  getBasketRules() {
    return [...this._rules];
  }

  /**
   * Retrieves an item by ID_Item, searching through all categories and kits.
   * @param {string} itemId
   * @returns {Item|null}
   */
  getItem(itemId) {
    for (const category of this._children.values()) {
      const direct = category.getChild(itemId);
      if (direct) return direct;

      for (const kitOrItem of category._children.values()) {
        if (typeof kitOrItem.getChild === 'function') {
          const nested = kitOrItem.getChild(itemId);
          if (nested) return nested;
        }
      }
    }
    return null;
  }

  /**
   * Plain object for Alpine.js consumption.
   * @returns {{ categories: Object[], itemCount: number }}
   */
  toDisplayObject() {
    const categories = [];
    let itemCount = 0;

    for (const category of this._children.values()) {
      categories.push(category.toDisplayObject());
      itemCount += _countItemsInCategory(category);
    }

    return { categories, itemCount };
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

const ITEM_ETAPAS = new Set(['RESTRICCION_UI', 'AJUSTE_LINEA']);

function _buildProfilesMap(profileRows) {
  const map = new Map();
  for (const row of profileRows) {
    map.set(row.ID_Perfil_Precio, row);
  }
  return map;
}

function _buildCategoriesMap(catRows) {
  const map = new Map();
  for (const row of catRows) {
    map.set(row.ID_Categoria, row);
  }
  return map;
}

function _buildKitParentIds(kitCompRows) {
  return new Set(kitCompRows.map(c => c.ID_Item_Padre));
}

function _buildItems(itemRows, profilesMap, categoriesMap) {
  const items = new Map();
  for (const row of itemRows) {
    const overrideId = row.ID_Perfil_Precio_Override || null;
    const catDefault = categoriesMap.get(row.ID_Categoria)?.ID_Perfil_Precio_Default || null;
    const profile = profilesMap.get(overrideId || catDefault) || null;
    items.set(row.ID_Item, new Item(row, { profile }));
  }
  return items;
}

function _buildCategories(catRows) {
  const categories = new Map();
  for (const row of catRows) {
    categories.set(row.ID_Categoria, new Category(row));
  }
  return categories;
}

function _assignRules(ruleRows, items, catalog) {
  for (const rule of ruleRows) {
    if (ITEM_ETAPAS.has(rule.Etapa)) {
      // Assign item-level rules to all items; conditions filter at evaluation time
      for (const item of items.values()) {
        item._rules.push(rule);
      }
    } else {
      // AJUSTE_GLOBAL, IMPUESTO → basket-level, stored on catalog for transfer to Basket
      catalog._rules.push(rule);
    }
  }
}

function _placeItemsInCategories(items, categories, kitParentIds, kitCompRows) {
  for (const item of items.values()) {
    const category = categories.get(item.ID_Categoria);
    if (!category) continue;

    if (kitParentIds.has(item.ID_Item)) {
      const kit = _buildKit(item, items, kitCompRows);
      category.addChild(item.ID_Item, kit);
    } else if (!_isKitChild(item.ID_Item, kitCompRows)) {
      category.addChild(item.ID_Item, item);
    }
  }
}

function _buildKit(kitItem, items, kitCompRows) {
  const kit = new Kit(
    { ID_Item: kitItem.ID_Item, Nombre: kitItem.Nombre, Activo: kitItem.Activo },
    { mode: 'catalog' }
  );
  const compositions = kitCompRows.filter(c => c.ID_Item_Padre === kitItem.ID_Item);
  for (const comp of compositions) {
    const child = items.get(comp.ID_Item_Hijo);
    if (child) kit.addChild(comp.ID_Item_Hijo, child);
  }
  return kit;
}

function _isKitChild(itemId, kitCompRows) {
  return kitCompRows.some(c => c.ID_Item_Hijo === itemId);
}

function _countItemsInCategory(category) {
  let count = 0;
  for (const child of category._children.values()) {
    if (typeof child.getChild === 'function') {
      count += child._children ? child._children.size : 0;
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Validates that all parent kit items have zero cost.
 *
 * Business Rule: Parent kits MUST have:
 *   - Costo_Base = 0
 *   - Costo_Unitario_Pax = 0
 *   - Costo_Unitario_Tiempo = 0
 *   - Costo_Unitario_Item = 0
 *
 * All pricing must be on children only.
 *
 * @param {Map<string, Item>} items - Map of items by ID_Item
 * @param {Set<string>} kitParentIds - Set of parent item IDs
 * @throws {Error} If any parent kit has non-zero costs
 */
function _validateKitParentCosts(items, kitParentIds) {
  for (const parentId of kitParentIds) {
    const parent = items.get(parentId);
    if (!parent) continue;

    const hasNonZeroCost =
      (parent.Costo_Base || 0) !== 0 ||
      (parent.Costo_Unitario_Pax || 0) !== 0 ||
      (parent.Costo_Unitario_Tiempo || 0) !== 0 ||
      (parent.Costo_Unitario_Item || 0) !== 0;

    if (hasNonZeroCost) {
      throw new Error(
        `Kit parent item "${parentId}" (${parent.Nombre}) has non-zero costs. ` +
        `Business rule: Kit parents must have all costs = 0. ` +
        `All pricing must be on child items only. ` +
        `Please reset all Costo_* fields to 0 in the ITEM_CATALOGO sheet.`
      );
    }
  }
}
