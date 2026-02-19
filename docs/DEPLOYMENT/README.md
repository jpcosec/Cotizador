# DEPLOYMENT Documentation

This folder contains everything you need to develop locally and deploy to Google Apps Script.

---

## 📚 Documentation Index

### 🚀 **Start Here**
- **[LOCAL_vs_GAS.md](./LOCAL_vs_GAS.md)** ⭐
  - Quick comparison of local vs GAS
  - Setup instructions for both
  - Workflows and best practices
  - Troubleshooting guide
  - Decision matrix: when to use what

### 🔧 Detailed Guides

- **[gas-deployment.md](./gas-deployment.md)**
  - Step-by-step GAS deployment checklist
  - Pre-deployment verification
  - Environment setup
  - Post-deployment verification
  - Rollback procedures
  - Performance tuning

---

## 🎯 Quick Decisions

**Want to develop fast without touching Google Sheets?**
→ Read [LOCAL_vs_GAS.md](./LOCAL_vs_GAS.md) → Local Development section

**Ready to deploy to production?**
→ Read [LOCAL_vs_GAS.md](./LOCAL_vs_GAS.md) → GAS Deployment section
→ Then follow [gas-deployment.md](./gas-deployment.md) for detailed steps

**Want to understand the differences?**
→ [LOCAL_vs_GAS.md](./LOCAL_vs_GAS.md) → Comparison section

---

## ⚡ Quick Commands

### Local Development (No GAS Needed)
```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build                              # Create bundle
npm run serve:dist                         # Start local server (port 8082)
# Open: http://localhost:8082
```

### Deploy to GAS
```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build                              # Create bundle
clasp push                                 # Deploy to Google Apps Script
# Then run in GAS editor: initializeSheetDb()
```

---

## 📋 Deployment Checklist

### Before Local Development
- [ ] Node.js or Python 3 installed
- [ ] Port 8082 available
- [ ] Code built: `npm run build`

### Before GAS Deployment
- [ ] Local tests passing
- [ ] `clasp` installed: `npm install -g @google/clasp`
- [ ] Google account authenticated: `clasp login`
- [ ] `.clasp.json` configured with script ID
- [ ] Bundle built: `npm run build`

### After GAS Deployment
- [ ] `clasp push` successful
- [ ] `initializeSheetDb()` run in GAS editor
- [ ] Test data added to spreadsheet
- [ ] Extensions menu appears
- [ ] Basic workflow tested

---

## 🔗 Related Documentation

- [Architecture Overview](../ARCHITECTURE/) - System design
- [Testing Guide](../TESTING/) - Test strategies
- [Phase 3 Frontend](../PHASE3/) - UI implementation
- [Phase 4 Bundling](../PHASE4/) - Bundling configuration

---

**Status:** ✅ Ready for both local and GAS development
