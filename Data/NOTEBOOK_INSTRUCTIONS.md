# Notebook Interaction Guide

## Goal
Use Jupyter to explore `Data_Historica.csv` interactively and answer business questions quickly.

## 1) Start Jupyter
From `/home/jp/Downloads/Cotizador lodge` run:

```bash
jupyter lab
```

Then open `cotizaciones_analysis.ipynb`.

## 2) Load Data
In the notebook, keep:

```python
csv_path = "Data_Historica.csv"
df = pd.read_csv(csv_path)
```

## 3) Recommended Workflow
Run cells in this order:
1. Load dataframe and inspect `df.head()`
2. Check shape and columns
3. Clean money columns (`Valor`, `Total`) to numeric
4. Build pivots/charts by `Empresa`, `Día`, `Servicio`
5. Filter specific clients or date ranges

## 4) Money Cleaning Snippet
Use this before aggregations:

```python
import pandas as pd

def parse_clp(s):
    s = str(s).strip()
    if not s or s.lower() == "nan":
        return pd.NA
    if "incluido" in s.lower():
        return 0
    s = s.replace("$", "").replace(",", "")
    try:
        return float(s)
    except:
        return pd.NA

df["Valor_num"] = df["Valor"].apply(parse_clp)
df["Total_num"] = df["Total"].apply(parse_clp)
```

## 5) High-Value Queries
Examples:

```python
# Revenue by company
df.groupby("Empresa", dropna=False)["Total_num"].sum().sort_values(ascending=False).head(20)

# Most common services
df["Servicio"].value_counts().head(20)

# Revenue by day section
df.groupby("Día", dropna=False)["Total_num"].sum().sort_values(ascending=False)
```

## 6) Save Outputs
When needed:

```python
df.to_csv("Data_Historica_enriched.csv", index=False)
```

## 7) Notes
- `Data_Historica.csv` is row-level service data (one service line per row).
- Metadata columns (`Nombre`, `Empresa`, `Fecha`, etc.) repeat across service rows for the same quotation.
- Some legacy source files were not fully extractable; this dataset is best-effort.
