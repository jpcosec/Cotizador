import json
import os
import glob
import math
import pandas as pd


def safe(v):
    """Return None for NaN/NA, string otherwise."""
    if v is None:
        return None
    try:
        if math.isnan(float(v)):
            return None
    except (TypeError, ValueError):
        pass
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    s = str(v).strip()
    return None if s == "" else s


def get_subcategory(category_name):
    mapping = [
        ("teambuilding", "Actividades"),
        ("spa", "Wellness"),
        ("arriendo_de_salones", "Infraestructura"),
        ("capacidades", "Infraestructura"),
        ("comedor_vip", "Infraestructura"),
        ("block", "Infraestructura"),
        ("alimentacion", "Gastronomia"),
        ("coffes", "Gastronomia"),
        ("picoteo", "Gastronomia"),
        ("bebidas", "Gastronomia"),
        ("otros_articulos", "Otros"),
        ("alojamiento", "Hospedaje"),
        ("valor_pax", "Hospedaje"),
        ("cambios", "Operacional"),
        ("tecnica", "Operacional"),
        ("cotizacion_tipo", "Politica"),
    ]
    for key, val in mapping:
        if key in category_name:
            return val
    return "General"


def read_raw(path):
    try:
        return pd.read_csv(path, header=0, dtype=str)
    except Exception as e:
        print(f"  Warning: could not read {path}: {e}")
        return None


_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def generate_year(year, pricing_counter, rule_counter):
    items_enriched = []
    pricing_rows = []
    rules_rows = []

    raw_dir = os.path.join(_ROOT, "processed_data", year, "raw")
    extracted_dir = os.path.join(_ROOT, "processed_data", year, "extracted")

    for json_path in sorted(glob.glob(f"{extracted_dir}/*.json")):
        # e.g. precios_alimentacion_y_banqueteria.csv.json → base = precios_alimentacion_y_banqueteria.csv
        base_name = os.path.basename(json_path).replace(".json", "")
        category_name = base_name.replace(".csv", "")
        subcategory = get_subcategory(category_name)
        raw_path = os.path.join(raw_dir, base_name)

        with open(json_path) as f:
            extracted = json.load(f)

        df_raw = read_raw(raw_path) if os.path.exists(raw_path) else None

        # Index price_expressions and business_rules by item_id
        pricing_by_item = {}
        for pe in extracted.get("price_expressions", []):
            pricing_by_item.setdefault(pe["item_id"], []).append(pe)

        rules_by_item = {}
        for rule in extracted.get("business_rules", []):
            rules_by_item.setdefault(rule["item_id"], []).append(rule)

        for item in extracted.get("items", []):
            item_id = item["item_id"]
            source_row = item.get("source_row")

            # Raw row: store exactly as-is, column names from the file
            raw_record = None
            if df_raw is not None and source_row is not None:
                idx = source_row - 1  # source_row is 1-indexed data rows
                if 0 <= idx < len(df_raw):
                    raw_record = {k: safe(v) for k, v in df_raw.iloc[idx].items()}

            # Pricing records
            item_pricing_ids = []
            for pe in pricing_by_item.get(item_id, []):
                pricing_counter[0] += 1
                pid = f"PRICE_{item_id}_{pricing_counter[0]:04d}"
                components = pe.get("components", [])
                base_c = next((c for c in components if c["type"] == "base"), None)
                var_c = next((c for c in components if c["type"] in ("per_person", "per_unit")), None)
                pricing_rows.append({
                    "pricing_id": pid,
                    "item_id": item_id,
                    "year": year,
                    "expression_type": pe.get("expression_type"),
                    "raw_expression": pe.get("raw_expression"),
                    "base_value": base_c["value"] if base_c else None,
                    "base_unit": base_c["unit"] if base_c else None,
                    "variable_value": var_c["value"] if var_c else None,
                    "variable_unit": var_c["unit"] if var_c else None,
                    "confidence": pe.get("confidence"),
                    "source_file": base_name,
                })
                item_pricing_ids.append(pid)

            # Rules records
            item_rule_ids = []
            for rule in rules_by_item.get(item_id, []):
                rule_counter[0] += 1
                rid = f"RULE_{item_id}_{rule_counter[0]:04d}"
                hint = rule.get("structured_hint", {})
                rules_rows.append({
                    "rule_id": rid,
                    "item_id": item_id,
                    "year": year,
                    "rule_type": rule.get("rule_type"),
                    "raw_text": rule.get("raw_text"),
                    "hint_min": hint.get("min"),
                    "hint_max": hint.get("max"),
                    "hint_unit": hint.get("unit"),
                    "hint_condition": hint.get("condition"),
                    "hint_effect": hint.get("effect"),
                    "confidence": rule.get("confidence"),
                    "source_file": base_name,
                })
                item_rule_ids.append(rid)

            items_enriched.append({
                "item_id": item_id,
                "year": year,
                "raw": raw_record,
                "extracted": {
                    "item_name": item.get("name"),
                    "category": category_name,
                    "subcategory": subcategory,
                    "source_row": source_row,
                    "source_file": base_name,
                },
                "pricing_ids": item_pricing_ids,
                "rule_ids": item_rule_ids,
            })

    return items_enriched, pricing_rows, rules_rows


def main():
    pricing_counter = [0]
    rule_counter = [0]

    all_items = []
    all_pricing = []
    all_rules = []

    for year in ["2025", "2026"]:
        print(f"\n=== {year} ===")
        items, pricing, rules = generate_year(year, pricing_counter, rule_counter)
        all_items.extend(items)
        all_pricing.extend(pricing)
        all_rules.extend(rules)
        print(f"  items={len(items)}  pricing={len(pricing)}  rules={len(rules)}")

    # Write combined outputs
    out = os.path.join(_ROOT, "processed_data")

    with open(f"{out}/items_enriched.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    pd.DataFrame(all_pricing).to_csv(f"{out}/pricing.csv", index=False)
    pd.DataFrame(all_rules).to_csv(f"{out}/rules.csv", index=False)

    # Categories: deduplicated from enriched items
    cats = pd.DataFrame([
        {"category": i["extracted"]["category"], "subcategory": i["extracted"]["subcategory"]}
        for i in all_items
    ]).drop_duplicates().sort_values(["subcategory", "category"])
    cats.to_csv(f"{out}/categories.csv", index=False)

    print(f"\nTotal: {len(all_items)} items, {len(all_pricing)} pricing, {len(all_rules)} rules, {len(cats)} categories")
    print(f"Written to {out}/")


if __name__ == "__main__":
    main()
