# CotizadorLodge — Data

Data extraction, analysis, and documentation for the Lodge quotation engine.

## Structure

```
source/             Raw price list Excel files and extracted text
scripts/            Extraction and table-generation scripts
processed_data/     Pipeline outputs (items, pricing, rules, categories)
repo_cotizaciones/  Historical quotation archive (2018, 2020, 2026)
docs/               Documentation index
cotizaciones_analysis.ipynb   Historical data analysis notebook
Data_Historica.csv            Row-level historical quotation data
```

## Quick Start

### Open the Streamlit data viewer

```bash
streamlit run Data/streamlit_app.py
```

This opens a 4-view explorer for `items`, `categories`, `pricing`, and `rules` with cross-links between related records.

### Run the extraction pipeline

Scripts must be run from `scripts/` or any directory — they resolve paths relative to the repo root:

```bash
python scripts/generate_tables.py   # regenerates items_enriched.json, pricing.csv, rules.csv, categories.csv
python scripts/generate_items.py    # regenerates 2025_items.csv and 2026_items.csv
```

### Explore historical data

```bash
jupyter lab
# open cotizaciones_analysis.ipynb
```

See [`docs/notebook.md`](docs/notebook.md) for usage guide.

## Docs

See [`docs/README.md`](docs/README.md) for the full documentation index, including migration guides and dev architecture pointers.
