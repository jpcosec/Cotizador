# LOCAL vs GAS: Complete Usage Guide

This guide explains how to develop and test the Cotizador Lodge system locally (without Google Sheets) and how to deploy it to Google Apps Script (GAS) for production use.

---

## 🎯 Quick Comparison

| Aspect | Local Development | Google Apps Script (GAS) |
|--------|-------------------|-------------------------|
| **Data Storage** | InMemoryStore (RAM) | Google Sheets (persistent) |
| **Speed** | ⚡ Instant (no API calls) | 🐢 Slower (network latency) |
| **Quota Costs** | ❌ None (zero quota) | ✅ Tracked (6 min execution limit) |
| **Setup Time** | 2-5 minutes | 15-30 minutes |
| **Browser** | Any (localhost:8082) | Google Sheets only |
| **Data Persistence** | 🔄 Lost on refresh | 💾 Saved to spreadsheet |
| **Best For** | Feature development, testing | Production use, real data |
| **Debugging** | 📝 Browser console (F12) | 📝 GAS logs + Browser console |

---

## 📍 LOCAL DEVELOPMENT

### What You Get

✅ **Fast iteration** - No network delays, instant feedback
✅ **No GAS quota usage** - Develop unlimited
✅ **Reproducible data** - Same test fixtures every time
✅ **Full debugging** - Browser DevTools (F12)
✅ **Offline capable** - No internet required
❌ **Data not persistent** - Lost on page refresh
❌ **No real Google Sheets integration** - Uses mock store instead

### Setup (5 minutes)

#### 1. Start the Local Dev Server

```bash
cd /home/jp/CotizadorLodge/claps_codelab_frontend

# Start HTTP server on localhost:8082
npm run dev
# or
python3 -m http.server 8082 --directory src

# Open browser: http://localhost:8082
```

#### 2. Pre-populate Test Data (Optional)

Create a `local-fixtures.json` with test data:

```javascript
// packages/frontend/src/local/fixtures.json
{
  "clientes": [
    {
      "ID_Cliente": "C001",
      "Nombre": "Test Client 1",
      "Email": "client1@test.com",
      "Telefono": "555-0001"
    }
  ],
  "catalogo": [
    {
      "ID_Item": "ITEM001",
      "Nombre": "Catering Basic",
      "Precio_Base": 50.00,
      "Categoria": "Catering",
      "Disponible": true
    }
  ]
}
```

### Running Locally: Step-by-Step

#### Step 1: Build the Bundle

```bash
cd /home/jp/CotizadorLodge/claps_codelab

# Create IIFE bundle (required for local testing)
npm run build
```

This creates:
- `dist/quotation-engine.iife.js` - Complete bundled engine

#### Step 2: Create Local Dev Page

Create `packages/frontend/src/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Cotizador Lodge - Local Dev</title>
  <link rel="stylesheet" href="./assets/styles.css">
  <script defer src="../../bundling/entry.js"></script>
  <script defer src="./local/createLocalEnvironment.js"></script>
</head>
<body>
  <div id="app">
    <!-- Alpine.js components mount here -->
    <div x-data="cotizadorApp()">
      <div x-show="!initialized" class="loading">
        <p>Initializing Cotizador...</p>
      </div>

      <div x-show="initialized" class="app-container">
        <!-- Sidebar with client/item selection -->
        <div class="sidebar" x-include="./Sidebar.html"></div>

        <!-- Main quotation form -->
        <div class="main" x-include="./QuotationForm.html"></div>

        <!-- Results panel -->
        <div class="results" x-include="./ResultsPanel.html"></div>
      </div>
    </div>
  </div>

  <script>
    // Initialize local environment on load
    document.addEventListener('alpine:init', async () => {
      const { actor, store } = await createLocalEnvironment();
      window.localActor = actor;
      window.localStore = store;
      console.log('✅ Local environment initialized');
    });
  </script>
</body>
</html>
```

#### Step 3: Start the Dev Server

```bash
# Option A: Python (built-in)
cd /home/jp/CotizadorLodge/claps_codelab/packages/frontend/src
python3 -m http.server 8082

# Option B: Node (if http-server installed)
npm install -g http-server
http-server src -p 8082 -c-1

# Open browser to: http://localhost:8082
```

#### Step 4: Test the Workflow

```
1. Open http://localhost:8082
2. See "Initializing Cotizador..." message
3. Wait ~2 seconds
4. Sidebar loads with test clients
5. Click a client → form shows up
6. Add items from catalog
7. Prices calculate instantly
8. Open F12 (DevTools) to see console logs
```

### Local Development Workflow

#### Making Changes

```bash
# 1. Edit component
nano packages/frontend/src/components/Sidebar.html

# 2. Save file (auto-reload if using live-server)

# 3. Check browser console (F12 → Console)
# Look for errors or debug logs

# 4. If major changes, rebuild bundle:
npm run build
```

#### Debugging in Local Mode

```javascript
// In browser console (F12):

// Check actor state
console.log(window.localActor.getSnapshot());

// Trigger event
window.localActor.send({ type: 'INIT_QUOTATION' });

// Check store contents
console.log(window.localStore);

// Inspect active state
console.log(window.localActor.getSnapshot().value);
```

#### Running Local Tests

```bash
cd /home/jp/CotizadorLodge/claps_codelab_frontend

# Run bridge integration tests (no GAS needed)
npm run test

# Watch mode for development
npm run test:watch
```

### Local Architecture

```
┌─────────────────┐
│  Browser (Localhost:8082)
├─────────────────┤
│  Alpine.js UI   │
│  (components)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AlpineXStateBridge
│  (sync layer)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  XState Machine │
│  (orchestrator) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pricing Engine │
│  (pure calcs)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  InMemoryStore  │◄─── NO Google Sheets
│  (test data)    │
└─────────────────┘
```

**Key difference:** InMemoryStore holds all data in RAM (lost on refresh)

---

## 🚀 GOOGLE APPS SCRIPT (GAS) DEPLOYMENT

### What You Get

✅ **Persistent storage** - Data saved to Google Sheets
✅ **Real Google Sheets integration** - Works with actual spreadsheets
✅ **Production ready** - Suitable for actual use
✅ **Cloud-based** - Access from anywhere
❌ **Slower** - Network latency adds 200-500ms per operation
❌ **Quota limits** - 6 minute execution limit per run
❌ **More setup** - Requires Google authentication + configuration

### Prerequisites

- ✅ Google account with Sheets access
- ✅ `clasp` CLI installed: `npm install -g @google/clasp`
- ✅ GAS project created (or will be created)
- ✅ Build complete: `npm run build`

### Setup (15-30 minutes)

#### Step 1: Install clasp

```bash
# Install Google's clasp CLI (one-time)
npm install -g @google/clasp

# Authenticate with Google
clasp login
# Opens browser for Google auth
# Creates ~/.clasprc.json with credentials
```

#### Step 2: Verify GAS Configuration

```bash
cd /home/jp/CotizadorLodge/claps_codelab

# Check clasp config
cat .clasp.json
# Should show:
# {
#   "scriptId": "1fi6tggTrPLYoPa5SX4QBvmwxzM37jq9ZYrRellgA-bhwFIKiAqA_9Rdh",
#   "rootDir": "gas"
# }
```

If `.clasp.json` doesn't exist:

```bash
# Create new GAS project
clasp create --type sheets --title "CotizadorLodge"

# This creates:
# - .clasp.json (saves project ID)
# - Spreadsheet in Google Drive
# - GAS project in Google Apps Script
```

#### Step 3: Build Bundle

```bash
cd /home/jp/CotizadorLodge/claps_codelab

# Build IIFE bundle + generate GAS code
npm run build

# Check generated files
ls -lh gas/
# Should see:
#   - Code.gs (112 KB) - GAS runtime
#   - Bundle_Runtime.html (193 KB) - Bundled engine
#   - *.html files - UI components
#   - appsscript.json - GAS manifest
```

#### Step 4: Deploy to GAS

```bash
cd /home/jp/CotizadorLodge/claps_codelab

# Push all files to Google Apps Script
clasp push
# Output:
# ✓ Pushed 12 files.
# View at: https://script.google.com/macros/...
```

#### Step 5: Initialize Spreadsheet

```bash
# Open GAS editor (from clasp output URL or):
clasp open

# In GAS editor, run function from console:
initializeSheetDb()

# This creates required sheets:
# - CLIENTES
# - COTIZACIONES
# - ITEM_CATALOGO
# - PERFIL_PRECIOS
# - REGLAS_NEGOCIO
# - And others...
```

#### Step 6: Add Test Data

In the **Google Sheets** spreadsheet:

1. **Open ITEM_CATALOGO sheet**
2. **Add sample items:**
   ```
   ID_Item    | Nombre           | Precio_Base | Categoria
   -----------|------------------|-------------|----------
   CATERING1  | Catering Package | 50.00       | Catering
   DECOR1     | Basic Decoration | 100.00      | Decoration
   VENUE1     | Venue Rental     | 500.00      | Venue
   ```

3. **Open CLIENTES sheet**
4. **Add sample clients:**
   ```
   ID_Cliente | Nombre         | Email          | Telefono
   -----------|----------------|----------------|-----------
   C001       | Test Client 1  | test1@test.com | 555-0001
   C002       | Test Client 2  | test2@test.com | 555-0002
   ```

### Using in GAS: Step-by-Step

#### Step 1: Open the Add-on

In **Google Sheets**:

1. Go to **Extensions** → **CotizadorLodge** → **Abrir Cotizador**
2. A dialog window opens with the quotation system
3. First load may take 3-5 seconds (initial setup)

#### Step 2: Create a Quotation

```
1. Click "Nuevo" or the client selection dropdown
2. Select a client
3. From catalog, click items to add
4. Prices calculate automatically
5. Adjust quantities as needed
6. Review totals at bottom
```

#### Step 3: Save the Quotation

```
1. Click "Guardar Cotización"
2. Dialog shows success message
3. Data saved to CACHE_COTIZACION sheet
4. Can retrieve later from history
```

#### Step 4: Monitor Data

In **Google Sheets**:

1. Open **CACHE_COTIZACION** sheet
2. See saved quotations with:
   - Quotation ID
   - Client ID
   - Total price
   - Items (JSON)
   - Timestamp

### GAS Architecture

```
┌──────────────────────────────────┐
│  Google Sheets + GAS Editor
├──────────────────────────────────┤
│  Extensions → CotizadorLodge     │
│  (opens modeless dialog)         │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Code.gs + Bundle_Runtime.html   │
│  (GAS service layer)             │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  AlpineXStateBridge (in dialog)
│  + UI components                 │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  XState Machine + Pricing        │
│  (bundled IIFE)                  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  GasSheetStore (production)      │◄─── Google Sheets
│  (reads/writes to sheets)        │
└──────────────────────────────────┘
```

**Key difference:** GasSheetStore reads/writes actual Google Sheets

### GAS Workflow: Make Changes

#### Workflow: Fix a Bug in GAS

```bash
# 1. Edit source code locally
nano packages/frontend/src/components/QuotationForm.html

# 2. Rebuild bundle
npm run build

# 3. Deploy to GAS
clasp push

# 4. Reload spreadsheet (Ctrl+R or Cmd+R)
#    New code loads automatically

# 5. Test the fix
#    (navigate to Extensions → CotizadorLodge → Abrir Cotizador)
```

#### Workflow: Add New Pricing Rule

```bash
# 1. Update schema
nano src/Config/Config_Schema.js
# Add new rule type to REGLAS_NEGOCIO.Tipo_Accion

# 2. Implement rule handler
nano ../claps_codelab_pricing/src/RulesEngine/actions/newRule.js

# 3. Test locally
cd ../claps_codelab_pricing
npm test
# Verify tests pass

# 4. Bundle and deploy
cd ../claps_codelab
npm run build
clasp push

# 5. Test in GAS
# Add test rule in REGLAS_NEGOCIO sheet
# Create quotation and verify rule applies
```

---

## 📊 Comparison: Common Tasks

### Task: Test a New Component

**Local:**
```bash
1. npm run dev
2. Edit component in src/
3. Reload browser (live-reload if set up)
4. Test instantly (no latency)
5. Check console (F12)
```

**GAS:**
```bash
1. npm run build
2. clasp push
3. Open Google Sheets
4. Extensions → CotizadorLodge → Abrir Cotizador
5. Test (with 3-5 sec delay)
6. Check logs: Extensions → Apps Script → Executions
```

**Winner:** Local (5x faster)

---

### Task: Debug Pricing Logic

**Local:**
```bash
1. cd claps_codelab_pricing
2. npm run interactive
3. Test pricing in REPL
4. Instant feedback, modify and re-test
```

**GAS:**
```bash
1. Must create quotation in GAS
2. Check results in spreadsheet
3. If wrong, debug blindly or add Logger.log()
4. Rebuild, redeploy, test again
```

**Winner:** Local (much faster debugging)

---

### Task: Update Catalog Data

**Local:**
```bash
1. Edit local-fixtures.json (in memory)
2. Refresh browser
3. Test immediately
```

**GAS:**
```bash
1. Open ITEM_CATALOGO sheet in Google Sheets
2. Add/edit rows
3. Open CotizadorLodge
4. Data loads from sheet (1-2 sec latency)
```

**Winner:** GAS (persistent for real use)

---

## 🔧 Troubleshooting

### LOCAL: "Bundle not found"

```bash
# Solution: Build the bundle first
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
```

---

### LOCAL: "InMemoryStore is empty"

```bash
# Solution: Pre-populate test data
// In createLocalEnvironment.js:
const store = new InMemoryStore();
await store.initialize({
  clientes: testFixtures.clientes,
  catalogo: testFixtures.catalogo,
});
```

---

### GAS: "Extensions menu doesn't appear"

```bash
# Solution: Initialize GAS first
1. Open GAS editor (clasp open)
2. Run: initializeSheetDb()
3. Close and reopen spreadsheet
4. Extensions menu should appear
```

---

### GAS: "Catalog loads but prices are wrong"

```bash
# Solution: Check pricing profile
1. Open PERFIL_PRECIOS sheet
2. Verify prices match ITEM_CATALOGO
3. Check REGLAS_NEGOCIO for conflicting rules
4. Test pricing locally first:
   cd claps_codelab_pricing
   npm run interactive
```

---

### GAS: "Quota exceeded" error

```bash
# Solution: Wait 24 hours (quota resets daily)
# Or optimize code to reduce API calls
# Tips:
# - Cache data more aggressively
# - Batch operations (save multiple at once)
# - Reduce logging
```

---

## 📋 Decision Matrix: When to Use What

| Scenario | Use Local | Use GAS | Why |
|----------|-----------|---------|-----|
| **Feature development** | ✅ | ❌ | Fast iteration needed |
| **Bug fixes** | ✅ | ❌ | Instant feedback |
| **Testing new UI** | ✅ | ❌ | No network delays |
| **Pricing logic** | ✅ | ❌ | Run `npm run interactive` |
| **Data persistence** | ❌ | ✅ | Need real storage |
| **Production use** | ❌ | ✅ | Users need real data |
| **Team collaboration** | ❌ | ✅ | Shared spreadsheet |
| **Offline usage** | ✅ | ❌ | No internet needed |
| **Quota-critical** | ✅ | ❌ | Save quota usage |
| **Final testing** | ❌ | ✅ | Test with real flow |

---

## ✅ Quick Checklist

### Before Starting Local Development

- [ ] `npm run build` completed successfully
- [ ] `packages/frontend/src` exists
- [ ] Python 3 or Node.js available
- [ ] Port 8082 not in use

### Before Deploying to GAS

- [ ] All local tests pass
- [ ] `npm run build` completed
- [ ] `clasp` installed and authenticated
- [ ] Google Sheets created
- [ ] `.clasp.json` has valid script ID

### After Deploying to GAS

- [ ] `clasp push` successful (no errors)
- [ ] `initializeSheetDb()` ran in GAS editor
- [ ] Test data added to ITEM_CATALOGO
- [ ] Extensions menu appears in Sheets
- [ ] Can open CotizadorLodge dialog
- [ ] Basic workflow tested (select client → add items → see prices)

---

## 📚 Related Documentation

- [GAS Deployment Details](./gas-deployment.md) - Step-by-step GAS setup
- [Architecture Overview](../ARCHITECTURE/worktrees.md) - System design
- [Testing Guide](../TESTING/test-strategy.md) - Test methodology
- [Phase 3 Frontend](../PHASE3/frontend-integration.md) - UI implementation

---

**Last Updated:** 2026-02-19
**Status:** Ready for local and GAS testing
