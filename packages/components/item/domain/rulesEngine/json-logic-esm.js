/**
 * ESM wrapper for json-logic-js
 * Browser: UMD module pre-loaded via <script> tag, sets window.jsonLogic
 * Tests: Will not reach here - coordinator imports from actual json-logic-js package
 *
 * This module is only used in browser via import-map.
 * The UMD script tag loads first and sets window.jsonLogic.
 */

if (typeof window === 'undefined' || !window.jsonLogic) {
  throw new Error(
    'json-logic-js UMD module must be loaded before importing this wrapper. ' +
    'Ensure <script src="/node_modules/json-logic-js/logic.js"></script> is in the HTML.'
  );
}

export default window.jsonLogic;
