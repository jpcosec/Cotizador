# DEPLOYMENT Documentation

Everything needed to develop locally and deploy to Google Apps Script.

---

## Guides

- **[local-development.md](./local-development.md)** ⭐ — local server setup, how it works, deploy to GAS
- **[LOCAL_vs_GAS.md](./LOCAL_vs_GAS.md)** — side-by-side comparison of local vs GAS runtime
- **[gas-deployment.md](./gas-deployment.md)** — detailed GAS deployment checklist and rollback

---

## Quick Commands

### Local (real GAS app, no Sheets)
```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run dev          # build + serve at http://localhost:8082
```

### Deploy to GAS
```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
clasp push
# Then in GAS editor: initializeSheetDb()
```

---

## Checklist

### Before local dev
- [ ] `npm run build` completed
- [ ] Port 8082 free

### Before GAS deploy
- [ ] `clasp` installed: `npm install -g @google/clasp`
- [ ] Authenticated: `clasp login`
- [ ] `.clasp.json` configured with script ID
- [ ] `npm run build` completed

### After GAS deploy
- [ ] `clasp push` successful
- [ ] `initializeSheetDb()` run (first deploy only)
- [ ] Extensions menu appears in Sheets
- [ ] Basic workflow tested
