import json
import os

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def write_json(rel_path, data):
    path = os.path.join(_ROOT, rel_path)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

# MONTAJE
montaje_data = {
  "items": [
    {"item_id": "CAMBIO_MONTAJE_CHINOOK", "name": "Cambio de montaje Chinook", "raw_name": "Cambios de montaje  Chinook durante el arriendo de salon.", "category": "Montaje", "source_row": 1},
    {"item_id": "CAMBIO_MONTAJE_COHO", "name": "Cambio de montaje Coho", "raw_name": "Cambios de montaje Coho durante el arriendo de salon.", "category": "Montaje", "source_row": 2}
  ],
  "price_expressions": [
    {"item_id": "CAMBIO_MONTAJE_CHINOOK", "raw_expression": "150000", "expression_type": "flat", "components": [{"type": "base", "value": 150000, "unit": None}], "confidence": "high"},
    {"item_id": "CAMBIO_MONTAJE_COHO", "raw_expression": "100000", "expression_type": "flat", "components": [{"type": "base", "value": 100000, "unit": None}], "confidence": "high"}
  ],
  "business_rules": [],
  "unknowns": []
}
write_json('processed_data/2026/extracted/precios_block_1.csv.json', montaje_data)

# COMEDOR VIP
vip_data = {
  "items": [
    {"item_id": "COMEDOR_VIP_FOGATA_4H", "name": "Comedor VIP con fogata 4h", "raw_name": "Comedor VIP con fogata, 2 piso hasta 70 personas, 4 horas noche", "category": "Comedor", "source_row": 1}
  ],
  "price_expressions": [
    {"item_id": "COMEDOR_VIP_FOGATA_4H", "raw_expression": "360000", "expression_type": "flat", "components": [{"type": "base", "value": 360000, "unit": None}], "confidence": "high"}
  ],
  "business_rules": [],
  "unknowns": []
}
write_json('processed_data/2026/extracted/precios_comedor_vip_y_terraza_2do_piso.csv.json', vip_data)

