# 0-cleanup — Agent Guideline

## Context

You are doing a structural cleanup only. No new logic is written. No component behavior changes. The goal is purely to reorganize files so `packages/` is clean.

Run `npm test` after each numbered step below. Do not proceed if tests fail.

---

## Step 1 — Delete the three wrapper JS files

```bash
rm apps/quotation/state/AppStateMachine.js
rm apps/quotation/components/HomePage.js
rm apps/quotation/components/ClientSelector.js
```

These files contained only delegation code and no original logic.

Run tests. Expected: some tests will now fail (the three test files importing from these wrappers). That is expected — proceed to Step 2.

---

## Step 2 — Redirect appStateMachine.test.js

File: `apps/quotation/state/appStateMachine.test.js`

Change the import line:
```js
// FROM:
import { createAppStateMachine } from './AppStateMachine.js';

// TO:
import { createAppState as createAppStateMachine } from '../../../packages/components/quotation/modals/AppState.js';
```

Run tests. This file's tests should now pass again.

---

## Step 3 — Redirect home.test.js

File: `apps/quotation/components/home.test.js`

Change the import line:
```js
// FROM:
import { createHomePageController } from './HomePage.js';

// TO:
import { createHomePage as createHomePageController } from '../../../packages/components/quotation/modals/HomePage.js';
```

The test calls `getActions()`, `clickAction()`, `on()`, `off()` — all exist on `HomePage`. The `isVisible()` wrapper always returned `true`, same as `HomePage.isVisible()`. No other changes needed.

Run tests. This file's tests should now pass.

---

## Step 4 — Redirect clientSelector.test.js

File: `apps/quotation/components/clientSelector.test.js`

Change the import line:
```js
// FROM:
import { createClientSelectorController } from './ClientSelector.js';

// TO:
import { createClientSelector as createClientSelectorController } from '../../../packages/components/quotation/modals/ClientSelector.js';
```

Then **delete the `getAllClients` test** — it tested wrapper-only logic that doesn't exist in the package:
```js
// DELETE the entire block:
it('should get all original clients', () => { ... });
```

Run tests. All remaining tests in this file should pass.

---

## Step 5 — Promote ClientSelector.html

The `apps/quotation/components/ClientSelector.html` is the rich production template. The `packages/components/quotation/modals/ClientSelector.html` is a 10-line stub. Replace the stub.

```bash
cp apps/quotation/components/ClientSelector.html \
   packages/components/quotation/modals/ClientSelector.html
rm apps/quotation/components/ClientSelector.html
```

Run tests. Expected: still passing (HTML files are not imported in tests).

---

## Step 6 — Move packages/components/quotation to apps/quotation/pkg

```bash
mkdir -p apps/quotation/pkg
cp -r packages/components/quotation/. apps/quotation/pkg/
rm -rf packages/components/quotation
```

Now find and fix all broken imports. Search for any file that still imports from the old path:
```bash
grep -r "packages/components/quotation" . --include="*.js" --include="*.html" | grep -v node_modules
```

For each result, update the import path to point to `apps/quotation/pkg/` (adjust `../` depth based on where the importing file lives).

Run tests. All tests must pass.

---

## Step 7 — Final verification and commit

```bash
# Confirm no references to old path remain
grep -r "packages/components/quotation" . --include="*.js" --include="*.html" | grep -v node_modules
# Expected: no output

npm test
# Expected: all tests pass
```

Commit:
```bash
git add -A
git commit -m "refactor: cleanup — remove wrappers, relocate quotation flow to apps/quotation/pkg"
```
