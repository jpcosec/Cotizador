import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const gasDir = path.join(root, 'gas');
const frontendDir = path.join(root, 'packages', 'frontend');
const frontendManifest = path.join(frontendDir, 'appsscript.json');

if (!fs.existsSync(frontendDir)) {
  console.error(`Frontend directory not found: ${frontendDir}`);
  process.exit(1);
}

if (!fs.existsSync(frontendManifest)) {
  console.error(`Frontend appsscript manifest not found: ${frontendManifest}`);
  process.exit(1);
}

fs.rmSync(gasDir, { recursive: true, force: true });
fs.mkdirSync(gasDir, { recursive: true });

const entries = fs.readdirSync(frontendDir, { withFileTypes: true });
const htmlFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => entry.name)
  .sort();

if (htmlFiles.length === 0) {
  console.error(`No HTML templates found in: ${frontendDir}`);
  process.exit(1);
}

for (const htmlFile of htmlFiles) {
  const src = path.join(frontendDir, htmlFile);
  const dst = path.join(gasDir, htmlFile);
  fs.copyFileSync(src, dst);
}

fs.copyFileSync(frontendManifest, path.join(gasDir, 'appsscript.json'));

console.log(`Regenerated GAS workspace: ${gasDir}`);
console.log(`Copied HTML templates: ${htmlFiles.length}`);
console.log('Copied manifest: appsscript.json');
