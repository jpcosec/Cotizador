# Step 03: Seed Data Fixtures (Real Data)

**What:** Test fixtures using real SF Lodge data from `Precios empresas actualizado año 2025.xlsx`.

**Source:** `~/Downloads/Cotizador lodge/Precios empresas actualizado año 2025.xlsx`

**Files created:**
- `tests/fixtures/master_data.js` — exports: PRICING_PROFILES, CATEGORIES, ITEMS, CLIENTS
- `tests/fixtures/compositions.js` — exports: COMPOSITIONS, PACK_ITEMS
- `tests/fixtures/rules.js` — exports: BUSINESS_RULES
- `tests/fixtures/scenarios.js` — exports: WEDDING_QUOTE, CORPORATE_QUOTE
- `tests/helpers/store_factory.js` — `createSeededStore()` loads all fixtures

**Real items included (from Excel):**

| Category | Items | Pricing Pattern |
|----------|-------|-----------------|
| Salones | Chinook (385k), Coho (330k), Fario (242k) | Fixed base |
| Coffee | Basic (6,380/pax), Intermedio (10,395/pax), Full (16,500/pax) | Per person |
| Catering | Almuerzo buffet, Cena buffet, Cocktail | Per person |
| Musica | DJ <50pax (850k), DJ >50pax (1,200k), hora extra (276k/390k) | Fixed + rules |
| Bebidas | Ticket trago, Ticket cerveza, Bar abierto | Per unit/person |
| Actividades | Caminata (300k + 10k/pax), Paintball (1M + 35k/pax) | Base + per person |

**Test file:** `tests/unit/fixtures_integrity.test.js`
- store has expected items in ITEM_CATALOGO
- every item's ID_Categoria exists in CATEGORIAS
- every item with ID_Perfil_Precio_Override has valid profile
- every composition's parent and child items exist

**Depends on:** Step 02.
