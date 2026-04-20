/**
 * DatabasePreloader
 *
 * Background loader that pre-caches database reference data (catalog, rules, pricing profiles)
 * while the user fills out forms. This improves perceived performance by having data ready
 * before it's needed.
 *
 * Usage:
 *   const preloader = createDatabasePreloader();
 *   const loadPromise = preloader.load();  // Start loading in background
 *   // ... user interacts with forms ...
 *   await loadPromise;  // Wait when you need the data
 *   const catalog = preloader.getCatalog();
 */

/**
 * Creates a database preloader instance
 * @returns {Object} Preloader with methods: load, isLoading, isReady, getCatalog, getRules, getPricingProfiles, getCategoryDefaults, getCache
 */
export function createDatabasePreloader() {
  let isLoadingFlag = false;
  let isReadyFlag = false;
  let cache = {
    catalog: [],
    rules: [],
    pricingProfiles: [],
    categoryDefaults: []
  };

  /**
   * Load reference data in parallel
   * Returns a promise that resolves when all data is cached
   */
  async function load() {
    if (isLoadingFlag || isReadyFlag) {
      return Promise.resolve(); // Already loading or loaded
    }

    isLoadingFlag = true;

    try {
      // Load reference data in parallel
      const [catalog, rules, pricingProfiles, categoryDefaults] = await Promise.all([
        loadCatalog(),
        loadRules(),
        loadPricingProfiles(),
        loadCategoryDefaults()
      ]);

      // Store in cache
      cache.catalog = catalog;
      cache.rules = rules;
      cache.pricingProfiles = pricingProfiles;
      cache.categoryDefaults = categoryDefaults;

      isReadyFlag = true;
    } catch (error) {
      isLoadingFlag = false;
      throw new Error(`DatabasePreloader: Failed to load reference data: ${error.message}`);
    } finally {
      isLoadingFlag = false;
    }
  }

  /**
   * Load catalog items from database
   * TODO: Replace with real database call
   */
  async function loadCatalog() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'item1', name: 'Item 1', category: 'cat1', pricing: { base: 100, rate: 1 } },
          { id: 'item2', name: 'Item 2', category: 'cat1', pricing: { base: 200, rate: 2 } },
          { id: 'item3', name: 'Item 3', category: 'cat2', pricing: { base: 300, rate: 3 } }
        ]);
      }, 10);
    });
  }

  /**
   * Load rules from database
   * TODO: Replace with real database call
   */
  async function loadRules() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'rule1', type: 'RESTRICCION_UI', componentType: 'ITEM' },
          { id: 'rule2', type: 'AJUSTE_LINEA', componentType: 'ITEM' },
          { id: 'rule3', type: 'CANTIDAD_DEFAULT', componentType: 'ITEM' }
        ]);
      }, 15);
    });
  }

  /**
   * Load pricing profiles from database
   * TODO: Replace with real database call
   */
  async function loadPricingProfiles() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'profile1', name: 'Profile 1', base: 100, rate: 1 },
          { id: 'profile2', name: 'Profile 2', base: 200, rate: 2 },
          { id: 'profile3', name: 'Profile 3', base: 300, rate: 3 }
        ]);
      }, 12);
    });
  }

  /**
   * Load category defaults from database
   * TODO: Replace with real database call
   */
  async function loadCategoryDefaults() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'cat1', name: 'Category 1', defaultProfile: 'profile1', defaults: {} },
          { id: 'cat2', name: 'Category 2', defaultProfile: 'profile2', defaults: {} }
        ]);
      }, 8);
    });
  }

  /**
   * Check if currently loading
   */
  function isLoading() {
    return isLoadingFlag;
  }

  /**
   * Check if loading is complete
   */
  function isReady() {
    return isReadyFlag;
  }

  /**
   * Get cached catalog items
   */
  function getCatalog() {
    return cache.catalog;
  }

  /**
   * Get cached rules
   */
  function getRules() {
    return cache.rules;
  }

  /**
   * Get cached pricing profiles
   */
  function getPricingProfiles() {
    return cache.pricingProfiles;
  }

  /**
   * Get cached category defaults
   */
  function getCategoryDefaults() {
    return cache.categoryDefaults;
  }

  /**
   * Get entire cache object
   */
  function getCache() {
    return cache;
  }

  return {
    load,
    isLoading,
    isReady,
    getCatalog,
    getRules,
    getPricingProfiles,
    getCategoryDefaults,
    getCache
  };
}
