import { loadSeedFromCsvUrl } from '../../../src/database/src/csvSeed.browser.js';
import { resolveItemDefinition } from '../../../src/database/src/resolveItemDefinition.js';
import { seedToResolverDb } from '../../../src/database/src/playgroundAdapter.js';
import { createItemPlayground } from './ItemPlaygroundController.js';

const CSV_BASE_URL = '/data/init';

/**
 * Mount item playground with factory + global context + catalog + basket columns.
 * Shipping from factory creates 2 independent entities (catalog and basket).
 * @param {HTMLElement|null} root
 */
export async function mountItemPlayground(root) {
  if (!root) return;

  const [layoutHtml, catalogHtml, basketHtml, dbSeed] = await Promise.all([
    fetch('/playground/playground/item/ui/ItemPlayground.html').then((response) => response.text()),
    fetch('/src/components/item/ui/CatalogRuntime.html').then((response) => response.text()),
    fetch('/src/components/item/ui/BasketRuntime.html').then((response) => response.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);
  const html = layoutHtml
    .replace('<!-- CATALOG_RUNTIME -->', catalogHtml)
    .replace('<!-- BASKET_RUNTIME -->', basketHtml);
  const db = seedToResolverDb(dbSeed);
  window.itemPlayground = function itemPlayground() {
    return createItemPlayground({ db, resolveItemDefinition });
  };
  root.innerHTML = html;
  if (window.Alpine?.initTree) window.Alpine.initTree(root);
}
