from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode

import pandas as pd
import streamlit as st


APP_TITLE = "CotizadorLodge - Data Viewer"
ROOT = Path(__file__).resolve().parent
PROCESSED_DIR = ROOT / "processed_data"


def make_link(view: str, **params: str) -> str:
    query = {"view": view}
    for key, value in params.items():
        if value is not None and value != "":
            query[key] = value
    return f"?{urlencode(query)}"


@st.cache_data
def load_items_df() -> pd.DataFrame:
    items_path = PROCESSED_DIR / "items_enriched.json"
    with items_path.open(encoding="utf-8") as handle:
        items = json.load(handle)

    rows = []
    for item in items:
        extracted = item.get("extracted", {})
        pricing_ids = item.get("pricing_ids", [])
        rule_ids = item.get("rule_ids", [])
        year = str(item.get("year", ""))
        item_id = item.get("item_id", "")
        item_key = f"{year}:{item_id}"
        rows.append(
            {
                "item_key": item_key,
                "item_id": item_id,
                "year": year,
                "item_name": extracted.get("item_name", ""),
                "category": extracted.get("category", ""),
                "subcategory": extracted.get("subcategory", ""),
                "source_row": extracted.get("source_row"),
                "source_file": extracted.get("source_file", ""),
                "pricing_count": len(pricing_ids),
                "rule_count": len(rule_ids),
                "pricing_ids": ", ".join(pricing_ids),
                "rule_ids": ", ".join(rule_ids),
                "raw_json": json.dumps(
                    item.get("raw", {}), ensure_ascii=False, indent=2
                ),
                "item_link": make_link("items", item_key=item_key),
                "category_link": make_link(
                    "categories", category=extracted.get("category", "")
                ),
                "pricing_link": make_link("pricing", item_key=item_key),
                "rules_link": make_link("rules", item_key=item_key),
            }
        )

    return pd.DataFrame(rows).sort_values(
        ["year", "subcategory", "item_name", "item_id"]
    )


@st.cache_data
def load_categories_df() -> pd.DataFrame:
    categories = pd.read_csv(PROCESSED_DIR / "categories.csv")
    items = load_items_df()
    pricing = load_pricing_df()
    rules = load_rules_df()

    item_counts = items.groupby("category").size().rename("item_count")
    pricing_counts = pricing.groupby("category").size().rename("pricing_count")
    rule_counts = rules.groupby("category").size().rename("rule_count")

    categories = categories.merge(item_counts, on="category", how="left")
    categories = categories.merge(pricing_counts, on="category", how="left")
    categories = categories.merge(rule_counts, on="category", how="left")
    categories = categories.fillna(0)

    categories["item_count"] = categories["item_count"].astype(int)
    categories["pricing_count"] = categories["pricing_count"].astype(int)
    categories["rule_count"] = categories["rule_count"].astype(int)
    categories["category_link"] = categories["category"].map(
        lambda value: make_link("categories", category=value)
    )
    categories["items_link"] = categories["category"].map(
        lambda value: make_link("items", category=value)
    )
    categories["pricing_link"] = categories["category"].map(
        lambda value: make_link("pricing", category=value)
    )
    categories["rules_link"] = categories["category"].map(
        lambda value: make_link("rules", category=value)
    )

    return categories.sort_values(["subcategory", "category"])


@st.cache_data
def load_pricing_df() -> pd.DataFrame:
    pricing = pd.read_csv(PROCESSED_DIR / "pricing.csv")
    items = load_items_df()[
        ["item_key", "item_id", "year", "item_name", "category", "subcategory"]
    ]
    pricing["year"] = pricing["year"].astype(str)
    pricing = pricing.merge(items, on=["item_id", "year"], how="left")
    pricing["item_key"] = pricing["item_key"].fillna(
        pricing["year"] + ":" + pricing["item_id"]
    )
    pricing["pricing_link"] = pricing["pricing_id"].map(
        lambda value: make_link("pricing", pricing_id=value)
    )
    pricing["item_link"] = pricing["item_key"].map(
        lambda value: make_link("items", item_key=value)
    )
    pricing["category_link"] = (
        pricing["category"]
        .fillna("")
        .map(lambda value: make_link("categories", category=value) if value else "")
    )
    pricing["rules_link"] = pricing["item_key"].map(
        lambda value: make_link("rules", item_key=value)
    )
    return pricing.sort_values(["year", "expression_type", "item_name", "pricing_id"])


@st.cache_data
def load_rules_df() -> pd.DataFrame:
    rules = pd.read_csv(PROCESSED_DIR / "rules.csv")
    items = load_items_df()[
        ["item_key", "item_id", "year", "item_name", "category", "subcategory"]
    ]
    rules["year"] = rules["year"].astype(str)
    rules = rules.merge(items, on=["item_id", "year"], how="left")
    rules["item_key"] = rules["item_key"].fillna(rules["year"] + ":" + rules["item_id"])
    rules["rule_link"] = rules["rule_id"].map(
        lambda value: make_link("rules", rule_id=value)
    )
    rules["item_link"] = rules["item_key"].map(
        lambda value: make_link("items", item_key=value)
    )
    rules["category_link"] = (
        rules["category"]
        .fillna("")
        .map(lambda value: make_link("categories", category=value) if value else "")
    )
    rules["pricing_link"] = rules["item_key"].map(
        lambda value: make_link("pricing", item_key=value)
    )
    return rules.sort_values(["year", "rule_type", "item_name", "rule_id"])


def get_param(name: str, default: str = "") -> str:
    value = st.query_params.get(name, default)
    if isinstance(value, list):
        return value[0] if value else default
    return value


def sync_view_param(view: str) -> None:
    if get_param("view", "items") != view:
        st.query_params["view"] = view


def render_overview(
    items: pd.DataFrame,
    categories: pd.DataFrame,
    pricing: pd.DataFrame,
    rules: pd.DataFrame,
) -> None:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Items", len(items))
    c2.metric("Categorias", len(categories))
    c3.metric("Precios", len(pricing))
    c4.metric("Reglas", len(rules))


def render_items_view(
    items: pd.DataFrame, pricing: pd.DataFrame, rules: pd.DataFrame
) -> None:
    st.subheader("Items")

    years = sorted(items["year"].dropna().unique().tolist())
    selected_years = st.sidebar.multiselect("Ano items", years, default=years)
    search = st.sidebar.text_input("Buscar item", value=get_param("item_search", ""))

    view_df = items.copy()
    if selected_years:
        view_df = view_df[view_df["year"].isin(selected_years)]
    category_filter = get_param("category", "")
    if category_filter:
        view_df = view_df[view_df["category"] == category_filter]
    if search:
        mask = view_df["item_name"].fillna("").str.contains(
            search, case=False
        ) | view_df["item_id"].fillna("").str.contains(search, case=False)
        view_df = view_df[mask]

    st.dataframe(
        view_df[
            [
                "year",
                "item_id",
                "item_name",
                "subcategory",
                "category",
                "pricing_count",
                "rule_count",
                "item_link",
                "category_link",
                "pricing_link",
                "rules_link",
            ]
        ],
        hide_index=True,
        use_container_width=True,
        column_config={
            "item_link": st.column_config.LinkColumn(
                "Detalle item", display_text="abrir"
            ),
            "category_link": st.column_config.LinkColumn(
                "Categoria", display_text="categoria"
            ),
            "pricing_link": st.column_config.LinkColumn(
                "Pricing", display_text="pricing"
            ),
            "rules_link": st.column_config.LinkColumn("Rules", display_text="rules"),
            "item_id": "Item ID",
            "item_name": "Nombre",
            "pricing_count": "Precios",
            "rule_count": "Reglas",
            "subcategory": "Subcategoria",
        },
    )

    item_key = get_param("item_key", "")
    if not item_key:
        return

    match = items[items["item_key"] == item_key]
    if match.empty:
        st.warning(f"No encontre item para item_key={item_key}")
        return

    row = match.iloc[0]
    st.markdown("### Detalle item")
    left, right = st.columns([1, 1])
    left.write(
        {
            "item_id": row["item_id"],
            "year": row["year"],
            "item_name": row["item_name"],
            "category": row["category"],
            "subcategory": row["subcategory"],
            "source_file": row["source_file"],
            "source_row": row["source_row"],
        }
    )
    right.code(row["raw_json"], language="json")

    item_pricing = pricing[pricing["item_key"] == item_key]
    st.markdown("#### Pricing asociado")
    st.dataframe(
        item_pricing[
            [
                "pricing_id",
                "expression_type",
                "base_value",
                "variable_value",
                "pricing_link",
            ]
        ],
        hide_index=True,
        use_container_width=True,
        column_config={
            "pricing_link": st.column_config.LinkColumn(
                "Detalle pricing", display_text="abrir"
            ),
            "expression_type": "Tipo",
            "base_value": "Base",
            "variable_value": "Variable",
        },
    )

    item_rules = rules[rules["item_key"] == item_key]
    st.markdown("#### Reglas asociadas")
    st.dataframe(
        item_rules[["rule_id", "rule_type", "raw_text", "rule_link"]],
        hide_index=True,
        use_container_width=True,
        column_config={
            "rule_link": st.column_config.LinkColumn(
                "Detalle regla", display_text="abrir"
            ),
            "rule_type": "Tipo",
            "raw_text": "Texto crudo",
        },
    )


def render_categories_view(categories: pd.DataFrame, items: pd.DataFrame) -> None:
    st.subheader("Categorias")

    subcategories = sorted(categories["subcategory"].dropna().unique().tolist())
    selected_subcategories = st.sidebar.multiselect(
        "Subcategorias", subcategories, default=subcategories
    )

    view_df = categories.copy()
    if selected_subcategories:
        view_df = view_df[view_df["subcategory"].isin(selected_subcategories)]

    st.dataframe(
        view_df[
            [
                "subcategory",
                "category",
                "item_count",
                "pricing_count",
                "rule_count",
                "category_link",
                "items_link",
                "pricing_link",
                "rules_link",
            ]
        ],
        hide_index=True,
        use_container_width=True,
        column_config={
            "category_link": st.column_config.LinkColumn(
                "Detalle categoria", display_text="abrir"
            ),
            "items_link": st.column_config.LinkColumn("Items", display_text="items"),
            "pricing_link": st.column_config.LinkColumn(
                "Pricing", display_text="pricing"
            ),
            "rules_link": st.column_config.LinkColumn("Rules", display_text="rules"),
            "subcategory": "Subcategoria",
            "item_count": "Items",
            "pricing_count": "Precios",
            "rule_count": "Reglas",
        },
    )

    category = get_param("category", "")
    if not category:
        return

    match = categories[categories["category"] == category]
    if match.empty:
        st.warning(f"No encontre categoria={category}")
        return

    row = match.iloc[0]
    st.markdown("### Detalle categoria")
    st.write(
        {
            "category": row["category"],
            "subcategory": row["subcategory"],
            "item_count": int(row["item_count"]),
            "pricing_count": int(row["pricing_count"]),
            "rule_count": int(row["rule_count"]),
        }
    )

    category_items = items[items["category"] == category]
    st.markdown("#### Items de la categoria")
    st.dataframe(
        category_items[["year", "item_id", "item_name", "item_link"]],
        hide_index=True,
        use_container_width=True,
        column_config={
            "item_link": st.column_config.LinkColumn(
                "Detalle item", display_text="abrir"
            )
        },
    )


def render_pricing_view(pricing: pd.DataFrame) -> None:
    st.subheader("Pricing")

    years = sorted(pricing["year"].dropna().unique().tolist())
    expr_types = sorted(pricing["expression_type"].dropna().unique().tolist())
    selected_years = st.sidebar.multiselect("Ano pricing", years, default=years)
    selected_expr_types = st.sidebar.multiselect(
        "Tipos pricing", expr_types, default=expr_types
    )

    view_df = pricing.copy()
    if selected_years:
        view_df = view_df[view_df["year"].isin(selected_years)]
    if selected_expr_types:
        view_df = view_df[view_df["expression_type"].isin(selected_expr_types)]

    item_key = get_param("item_key", "")
    category = get_param("category", "")
    if item_key:
        view_df = view_df[view_df["item_key"] == item_key]
    if category:
        view_df = view_df[view_df["category"] == category]

    st.dataframe(
        view_df[
            [
                "pricing_id",
                "year",
                "item_id",
                "item_name",
                "expression_type",
                "base_value",
                "variable_value",
                "pricing_link",
                "item_link",
                "category_link",
                "rules_link",
            ]
        ],
        hide_index=True,
        use_container_width=True,
        column_config={
            "pricing_link": st.column_config.LinkColumn(
                "Detalle pricing", display_text="abrir"
            ),
            "item_link": st.column_config.LinkColumn("Item", display_text="item"),
            "category_link": st.column_config.LinkColumn(
                "Categoria", display_text="categoria"
            ),
            "rules_link": st.column_config.LinkColumn("Rules", display_text="rules"),
            "expression_type": "Tipo",
            "base_value": "Base",
            "variable_value": "Variable",
        },
    )

    pricing_id = get_param("pricing_id", "")
    if not pricing_id:
        return

    match = pricing[pricing["pricing_id"] == pricing_id]
    if match.empty:
        st.warning(f"No encontre pricing_id={pricing_id}")
        return

    row = match.iloc[0]
    st.markdown("### Detalle pricing")
    st.write(
        {
            "pricing_id": row["pricing_id"],
            "item_id": row["item_id"],
            "item_name": row["item_name"],
            "year": row["year"],
            "expression_type": row["expression_type"],
            "raw_expression": row["raw_expression"],
            "base_value": row["base_value"],
            "base_unit": row["base_unit"],
            "variable_value": row["variable_value"],
            "variable_unit": row["variable_unit"],
            "confidence": row["confidence"],
            "source_file": row["source_file"],
        }
    )


def render_rules_view(rules: pd.DataFrame) -> None:
    st.subheader("Rules")

    years = sorted(rules["year"].dropna().unique().tolist())
    rule_types = sorted(rules["rule_type"].dropna().unique().tolist())
    selected_years = st.sidebar.multiselect("Ano rules", years, default=years)
    selected_rule_types = st.sidebar.multiselect(
        "Tipos regla", rule_types, default=rule_types
    )

    view_df = rules.copy()
    if selected_years:
        view_df = view_df[view_df["year"].isin(selected_years)]
    if selected_rule_types:
        view_df = view_df[view_df["rule_type"].isin(selected_rule_types)]

    item_key = get_param("item_key", "")
    category = get_param("category", "")
    if item_key:
        view_df = view_df[view_df["item_key"] == item_key]
    if category:
        view_df = view_df[view_df["category"] == category]

    st.dataframe(
        view_df[
            [
                "rule_id",
                "year",
                "item_id",
                "item_name",
                "rule_type",
                "raw_text",
                "hint_min",
                "hint_max",
                "hint_unit",
                "rule_link",
                "item_link",
                "category_link",
                "pricing_link",
            ]
        ],
        hide_index=True,
        use_container_width=True,
        column_config={
            "rule_link": st.column_config.LinkColumn(
                "Detalle regla", display_text="abrir"
            ),
            "item_link": st.column_config.LinkColumn("Item", display_text="item"),
            "category_link": st.column_config.LinkColumn(
                "Categoria", display_text="categoria"
            ),
            "pricing_link": st.column_config.LinkColumn(
                "Pricing", display_text="pricing"
            ),
            "rule_type": "Tipo",
            "raw_text": "Texto crudo",
            "hint_min": "Min",
            "hint_max": "Max",
            "hint_unit": "Unidad",
        },
    )

    rule_id = get_param("rule_id", "")
    if not rule_id:
        return

    match = rules[rules["rule_id"] == rule_id]
    if match.empty:
        st.warning(f"No encontre rule_id={rule_id}")
        return

    row = match.iloc[0]
    st.markdown("### Detalle regla")
    st.write(
        {
            "rule_id": row["rule_id"],
            "item_id": row["item_id"],
            "item_name": row["item_name"],
            "year": row["year"],
            "rule_type": row["rule_type"],
            "raw_text": row["raw_text"],
            "hint_min": row["hint_min"],
            "hint_max": row["hint_max"],
            "hint_unit": row["hint_unit"],
            "hint_condition": row["hint_condition"],
            "hint_effect": row["hint_effect"],
            "confidence": row["confidence"],
            "source_file": row["source_file"],
        }
    )


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption(
        "Visor rapido para `items`, `categories`, `pricing` y `rules` en `Data/processed_data/`."
    )

    items = load_items_df()
    categories = load_categories_df()
    pricing = load_pricing_df()
    rules = load_rules_df()

    requested_view = get_param("view", "items")
    views = ["items", "categories", "pricing", "rules"]
    current_view = requested_view if requested_view in views else "items"

    with st.sidebar:
        st.header("Navegacion")
        selected_view = st.radio("Vista", views, index=views.index(current_view))
        sync_view_param(selected_view)
        st.divider()
        st.caption(
            "Los links de cada tabla preservan filtros por entidad objetivo usando query params."
        )

    render_overview(items, categories, pricing, rules)
    st.divider()

    if selected_view == "items":
        render_items_view(items, pricing, rules)
    elif selected_view == "categories":
        render_categories_view(categories, items)
    elif selected_view == "pricing":
        render_pricing_view(pricing)
    else:
        render_rules_view(rules)


if __name__ == "__main__":
    main()
