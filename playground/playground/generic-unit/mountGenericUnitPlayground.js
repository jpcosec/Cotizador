/* eslint-disable jsdoc/require-jsdoc, max-lines-per-function */
import { createGenericUnitPlaygroundController } from './GenericUnitPlaygroundController.js';

export async function mountGenericUnitPlayground(root) {
  if (!root) {
    return;
  }

  const template = await fetch('/playground/playground/generic-unit/GenericUnitPlayground.html').then((response) => response.text());
  window.genericUnitPlayground = function genericUnitPlayground() {
    return createGenericUnitPlaygroundController();
  };
  root.innerHTML = template;

  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
