#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const gasDir = path.join(root, 'gas');
const gasManifest = path.join(gasDir, 'appsscript.json');
const quotationTemplatePath = path.join(gasDir, 'Quotation_App.html');
const sidebarTemplatePath = path.join(root, 'src', 'components', 'quotation', 'ui', 'Sidebar.html');
const timelineTemplatePath = path.join(root, 'src', 'components', 'quotation', 'ui', 'Timeline.html');
const itemListTemplatePath = path.join(root, 'src', 'components', 'quotation', 'ui', 'ItemList.html');
const modalsTemplatePath = path.join(root, 'src', 'components', 'quotation', 'ui', 'Modals.html');
const catalogRuntimePath = path.join(root, 'src', 'components', 'item', 'ui', 'CatalogRuntime.html');
const basketRuntimePath = path.join(root, 'src', 'components', 'item', 'ui', 'BasketRuntime.html');
const themePath = path.join(root, 'src', 'components', 'common', 'styles', 'theme-quotation.css');
const legacyThemePath = path.join(root, 'src', 'components', 'quotation', 'ui', 'theme.css');

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(fileName, contents) {
  fs.writeFileSync(path.join(gasDir, fileName), contents, 'utf8');
}

function replaceRuntimeMarkers(template, catalogRuntimeHtml, basketRuntimeHtml) {
  return template
    .replace('<!-- CATALOG_RUNTIME -->', catalogRuntimeHtml)
    .replace('<!-- BASKET_RUNTIME -->', basketRuntimeHtml);
}

function extractPrintStyles(source) {
  const match = source.match(/@media print\s*\{[\s\S]*\}\s*$/);
  if (!match) {
    throw new Error('print styles block not found in src/components/quotation/ui/theme.css');
  }
  return match[0].trim();
}

try {
  ensureFile(gasManifest, 'GAS manifest');
  ensureFile(quotationTemplatePath, 'Quotation template');
  ensureFile(sidebarTemplatePath, 'Sidebar template');
  ensureFile(timelineTemplatePath, 'Timeline template');
  ensureFile(itemListTemplatePath, 'Item list template');
  ensureFile(modalsTemplatePath, 'Modals template');
  ensureFile(catalogRuntimePath, 'Catalog runtime template');
  ensureFile(basketRuntimePath, 'Basket runtime template');
  ensureFile(themePath, 'Quotation theme css');
  ensureFile(legacyThemePath, 'Legacy quotation theme css');

  fs.mkdirSync(gasDir, { recursive: true });

  const catalogRuntimeHtml = read(catalogRuntimePath);
  const basketRuntimeHtml = read(basketRuntimePath);
  const generatedTemplates = {
    'Sidebar.html': replaceRuntimeMarkers(read(sidebarTemplatePath), catalogRuntimeHtml, basketRuntimeHtml),
    'Timeline.html': replaceRuntimeMarkers(read(timelineTemplatePath), catalogRuntimeHtml, basketRuntimeHtml),
    'ItemList.html': replaceRuntimeMarkers(read(itemListTemplatePath), catalogRuntimeHtml, basketRuntimeHtml),
    'Modals.html': read(modalsTemplatePath),
    'theme-quotation.html': `<style>\n${read(themePath)}\n</style>\n`,
    'QuotationPrintStyles.html': `<style>\n${extractPrintStyles(read(legacyThemePath))}\n</style>\n`,
  };

  Object.entries(generatedTemplates).forEach(([fileName, contents]) => write(fileName, contents));

  console.log(`Regenerated GAS workspace: ${gasDir}`);
  console.log(`Generated templates: ${Object.keys(generatedTemplates).join(', ')}`);
} catch (error) {
  console.error('Failed to reset GAS workspace:', error.message);
  process.exit(1);
}
