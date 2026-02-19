# Deploying to Google Apps Script (GAS)

**Status:** Ready after Phase 3 completion
**Prerequisites:** Phase 3 complete, bundle built, all tests passing
**Estimated Time:** 1-2 hours (including verification)

---

## Pre-Deployment Checklist

### Phase 3 Completion ✓
- [ ] All 3 critical bugs fixed (race condition, bootstrap, validation)
- [ ] TIER 1 components created (ValidationSummary, CompletionSuccess)
- [ ] State conditionals working (correct view per state)
- [ ] Full end-to-end workflow tested locally
- [ ] No console errors
- [ ] 209+ tests all passing

### Bundle Build ✓
- [ ] Run `npm run build` in root
- [ ] Check `dist/quotation-engine.iife.js` created (~50KB)
- [ ] Bundle contains all modules (pricing, xstate, frontend)

### Environment Setup ✓
- [ ] Google Apps Script project created in GAS editor
- [ ] `.clasp.json` configured with project ID
- [ ] Spreadsheet backend ready (schema initialized)
- [ ] Google Sheets with required tables (CLIENTES, COTIZACIONES, ITEM_CATALOGO, etc.)

---

## Deployment Steps

### Step 1: Verify Bundle (10 min)

```bash
cd /home/jp/CotizadorLodge/claps_codelab

# Check bundle exists
ls -lh dist/quotation-engine.iife.js

# Verify size (should be ~50KB)
wc -c dist/quotation-engine.iife.js

# Inspect bundle integrity
head -20 dist/quotation-engine.iife.js  # Should show IIFE function
tail -20 dist/quotation-engine.iife.js  # Should show exports
```

**Success:** Bundle is readable, correct size, contains exports

---

### Step 2: Prepare GAS Project (15 min)

```bash
# Initialize clasp if not already done
cd /home/jp/CotizadorLodge/claps_codelab
clasp login  # Authenticate with Google account

# Create new GAS project (if needed)
clasp create --type sheets --title "CotizadorLodge"

# This creates:
# - .clasp.json (project config)
# - appsscript.json (manifest)
# - GAS editor with blank Code.gs
```

---

### Step 3: Copy Bundle to GAS (10 min)

**Option A: Direct File Copy**

```bash
# Copy bundle to GAS folder
cp dist/quotation-engine.iife.js gas/Bundle_Runtime.html

# Add wrapper to make it executable in GAS
cat > gas/Code.gs << 'EOF'
// Load bundle
<?!= include('Bundle_Runtime'); ?>

// Initialize spreadsheet
function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const menu = ss.addMenu('CotizadorLodge');
  menu.addItem('Abrir Cotizador', 'openCotizador');
}

function openCotizador() {
  const html = HtmlService.createHtmlOutput('<h1>Cotizador</h1>')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Cotizador Lodge');
}

// Initialize database schema
function initializeSheetDb() {
  const store = window.QuotationEngine?.GasSheetStore;
  if (store) {
    store.initialize();
  }
}
EOF
```

**Option B: Use clasp push**

```bash
# Push files to GAS
clasp push

# This uploads all files in project directory
```

---

### Step 4: Setup Spreadsheet Backend (10 min)

**Create required sheets:**
```javascript
// Run in GAS editor console:
initializeSheetDb()  // One-time initialization
```

This creates:
- CLIENTES (clients list)
- COTIZACIONES (saved quotations)
- ITEM_CATALOGO (catalog items)
- PERFIL_PRECIOS (pricing profiles)
- REGLAS_NEGOCIO (business rules)
- CACHE_COTIZACION (temporary quotation cache)

**Populate with initial data:**
```javascript
// In GAS editor or via spreadsheet:
// 1. Open "CLIENTES" sheet
// 2. Add sample clients:
//    - Name, Email, Phone, etc.
// 3. Open "ITEM_CATALOGO" sheet
// 4. Add sample catalog items:
//    - Item ID, Name, Price, Category, etc.
// 5. Add pricing rules if needed
```

---

### Step 5: Test Deployment (20 min)

**Open the application:**
```
1. In Google Sheets, go to Extensions → CotizadorLodge → Abrir Cotizador
2. Dialog opens with quotation system
3. Test basic workflow:
   - Select client
   - Add items
   - Verify prices calculate
   - Save quotation
4. Check spreadsheet for saved data in CACHE_COTIZACION
```

**Verify functionality:**
- [ ] Catalog loads with items
- [ ] Can select client
- [ ] Can add items from catalog
- [ ] Prices calculate correctly
- [ ] Can save quotation
- [ ] Quotation appears in list
- [ ] No console errors (F12 → Console)

---

### Step 6: Monitor & Verify (10 min)

**Check logs:**
```javascript
// Run in GAS editor to see recent logs:
Logger.log('Test message');
```

**Monitor quota usage:**
```javascript
// GAS has quota limits:
// - Script execution: 6 minutes per run
// - Spreadsheet writes: ~100 per second
// - Drive writes: ~100 per minute
// Monitor via: Extensions → Apps Script Dashboard
```

**Check saved data:**
```
1. In spreadsheet, open "CACHE_COTIZACION" sheet
2. Should see saved quotations with:
   - Quotation ID
   - Client ID
   - Total
   - Items
   - Timestamp
```

---

## Troubleshooting

### Issue: Bundle doesn't load
**Solution:**
- Check bundle file exists: `ls -l dist/quotation-engine.iife.js`
- Verify size (~50KB)
- Check for syntax errors: `node -c dist/quotation-engine.iife.js`

### Issue: Catalog is empty
**Solution:**
- Verify ITEM_CATALOGO sheet has data
- Check store initialization: run `initializeSheetDb()`
- Verify column names match CONFIG_SCHEMA

### Issue: Quotations don't save
**Solution:**
- Check spreadsheet permissions
- Verify CACHE_COTIZACION sheet exists
- Check logs for errors (F12 → Console)
- Ensure quota not exceeded

### Issue: Prices calculate incorrectly
**Solution:**
- Verify pricing profile exists in PERFIL_PRECIOS
- Check business rules in REGLAS_NEGOCIO
- Run pricing tests locally first

### Issue: "Google Apps Script quota exceeded"
**Solution:**
- Wait 24 hours for quota reset
- Optimize code to reduce API calls
- Use caching more aggressively

---

## Post-Deployment

### Daily Operations
- Monitor usage and errors
- Backup quotations regularly
- Update catalog as needed
- Review saved quotations

### Maintenance
- Update business rules quarterly
- Archive old quotations
- Monitor spreadsheet size (2-5MB limit warning)
- Update catalog prices seasonally

### Updates
- Test changes locally first
- Deploy during off-hours
- Keep backup of previous version
- Document changes

---

## Rollback Plan

If deployment fails:

```bash
# 1. Revert to previous GAS version
clasp versions  # List versions
clasp deploy -i <VERSION_ID>

# 2. Or revert bundle
git revert <COMMIT_HASH>
npm run build
clasp push

# 3. Verify rollback
# Test basic workflow again
```

---

## Performance Tuning

### Optimize Bundle
```bash
# Current: ~50KB gzipped
# Monitor bundle size after each change
npm run build && ls -lh dist/quotation-engine.iife.js
```

### Optimize Queries
- Cache catalog at startup (not on each add)
- Use batch operations for multiple saves
- Limit history queries to recent quotations

### Optimize UI
- Lazy-load heavy components
- Debounce search results
- Optimize Alpine.js bindings

---

## Success Criteria

✅ Deployment successful when:
- [ ] Application loads without errors
- [ ] Can create and save quotations
- [ ] All 209 tests pass locally
- [ ] Pricing calculations correct
- [ ] Data persists in spreadsheet
- [ ] No quota warnings
- [ ] User workflow completes in < 5 min
- [ ] Responsive UI (< 2 sec per action)

---

## Production Checklist

Before going live:
- [ ] Phase 3 complete and tested
- [ ] Bundle builds successfully
- [ ] GAS project configured
- [ ] Spreadsheet schema initialized
- [ ] Sample data added to catalog
- [ ] Full workflow tested end-to-end
- [ ] Errors logged and monitored
- [ ] Backup procedure documented
- [ ] Rollback plan ready
- [ ] User documentation prepared
- [ ] Team trained on system

