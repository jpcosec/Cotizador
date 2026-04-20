#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  basketRuntimeHtml,
  catalogRuntimeHtml,
} from '../packages/components/item/ui/playgroundItemSections.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gasDir = path.join(root, 'gas');
const gasSourceDir = path.join(root, 'apps', 'gas');
const gasManifest = path.join(gasSourceDir, 'appsscript.json');
const quotationTemplatePath = path.join(gasSourceDir, 'Quotation_App_Source.html');

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function copyStaticTemplates() {
  const entries = fs.readdirSync(gasSourceDir, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .filter((entry) => entry.name !== 'Quotation_App_Source.html')
    .map((entry) => entry.name)
    .sort();

  for (const htmlFile of htmlFiles) {
    const src = path.join(gasSourceDir, htmlFile);
    const dst = path.join(gasDir, htmlFile);
    fs.copyFileSync(src, dst);
  }

  return htmlFiles;
}

function generateQuotationTemplate() {
  const rawTemplate = fs.readFileSync(quotationTemplatePath, 'utf8');
  const processed = rawTemplate
    .replace('<!-- CATALOG_RUNTIME -->', () => catalogRuntimeHtml)
    .replace('<!-- BASKET_RUNTIME -->', () => basketRuntimeHtml);

  fs.writeFileSync(path.join(gasDir, 'Quotation_App.html'), processed, 'utf8');
}

try {
  ensureFile(gasManifest, 'GAS manifest');
  ensureFile(quotationTemplatePath, 'Quotation template');

  fs.rmSync(gasDir, { recursive: true, force: true });
  fs.mkdirSync(gasDir, { recursive: true });

  const copiedHtml = copyStaticTemplates();
  generateQuotationTemplate();
  fs.copyFileSync(gasManifest, path.join(gasDir, 'appsscript.json'));

  console.log(`Regenerated GAS workspace: ${gasDir}`);
  console.log(`Copied static GAS templates: ${copiedHtml.length}`);
  console.log('Generated template: Quotation_App.html');
  console.log('Copied manifest: appsscript.json');
} catch (error) {
  console.error('Failed to reset GAS workspace:', error.message);
  process.exit(1);
}
