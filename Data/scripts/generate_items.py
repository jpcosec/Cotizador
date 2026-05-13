import json
import os
import glob
import pandas as pd

def normalize_name(name):
    # Simple heuristic to infinitive/canonical form
    name = name.lower().strip()
    replacements = {
        "arriendo": "arrendar",
        "caminata": "caminar",
        "paseo": "pasear",
        "clase": "clasar",
        "uso": "usar",
        "masajes": "masajear",
        "cambio": "cambiar"
    }
    for k, v in replacements.items():
        if name.startswith(k):
            return name.replace(k, v, 1)
    return name

def process_year(year):
    items_list = []
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root, "processed_data", year, "extracted", "*.json")
    files = glob.glob(path)
    
    for file in files:
        with open(file, 'r') as f:
            data = json.load(f)
            category_name = os.path.basename(file).replace('.csv.json', '')
            
            # Simple Subcategory mapping based on file name
            subcategory = "General"
            if "teambuilding" in category_name: subcategory = "Actividades"
            elif "spa" in category_name: subcategory = "Wellness"
            elif "salon" in category_name: subcategory = "Infraestructura"
            elif "alimentacion" in category_name: subcategory = "Gastronomia"
            elif "alojamiento" in category_name: subcategory = "Hospedaje"

            for item in data.get('items', []):
                items_list.append({
                    "item_name": normalize_name(item['name']),
                    "item_extra": item.get('raw_name', '').replace(item['name'], '').strip(),
                    "category": category_name,
                    "subcategory": subcategory,
                    "source_row": item['source_row']
                })
    
    df = pd.DataFrame(items_list)
    out_path = os.path.join(root, "processed_data", f"{year}_items.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated processed_data/{year}_items.csv with {len(df)} items.")

process_year("2025")
process_year("2026")
