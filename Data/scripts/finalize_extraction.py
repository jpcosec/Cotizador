import json
import os

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def write_json(rel_path, data):
    path = os.path.join(_ROOT, rel_path)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

# SPA
spa_data = {
  "items": [
    {"item_id": "MASAJISTA_EXCLUSIVA_RELAX_30M", "name": "Masajista exclusiva relax 30 min", "raw_name": "Masajista exclusiva, para masajes relax 30 minutos", "category": "Spa", "source_row": 1},
    {"item_id": "MASAJES_RELAX_30M", "name": "Masajes de relajacion 30 min", "raw_name": "Masajes de relajacion de media hora", "category": "Spa", "source_row": 2},
    {"item_id": "PISCINA_TEMPERADA_NOCTURNA", "name": "Piscina temperada nocturna exclusiva", "raw_name": "Piscina temperada nocturna exclusiva por 1 hora", "category": "Spa", "source_row": 5}
  ],
  "price_expressions": [
    {"item_id": "MASAJISTA_EXCLUSIVA_RELAX_30M", "raw_expression": "300000", "expression_type": "flat", "components": [{"type": "base", "value": 300000, "unit": None}], "confidence": "high"},
    {"item_id": "MASAJES_RELAX_30M", "raw_expression": "25210", "expression_type": "flat", "components": [{"type": "base", "value": 25210, "unit": None}], "confidence": "high"},
    {"item_id": "PISCINA_TEMPERADA_NOCTURNA", "raw_expression": "150000", "expression_type": "flat", "components": [{"type": "base", "value": 150000, "unit": None}], "confidence": "high"}
  ],
  "business_rules": [
    {"item_id": "MASAJISTA_EXCLUSIVA_RELAX_30M", "raw_text": "maximo 10 masajes de relajación por dia", "rule_type": "capacity", "structured_hint": {"min": None, "max": 10, "condition": None, "effect": None, "unit": "masajes"}, "confidence": "high"},
    {"item_id": "MASAJES_RELAX_30M", "raw_text": "Minimo 3 dias de anticipacion", "rule_type": "conditional", "structured_hint": {"min": 3, "max": None, "condition": "anticipacion", "effect": "booking", "unit": "dias"}, "confidence": "high"}
  ],
  "unknowns": []
}
write_json('processed_data/2026/extracted/precios_spa.csv.json', spa_data)

# TEAMBUILDING
tb_data = {
  "items": [
    {"item_id": "PAINTBALL", "name": "Paintball", "raw_name": "Paintball", "category": "Teambuilding", "source_row": 1},
    {"item_id": "BUSQUEDA_TESORO", "name": "Busqueda de tesoro", "raw_name": "Busqueda de tesoro", "category": "Teambuilding", "source_row": 2},
    {"item_id": "EL_NAUFRAGO_LA_BALSA", "name": "El Naufrago, La balsa", "raw_name": "El Naufrago, La balsa", "category": "Teambuilding", "source_row": 6}
  ],
  "price_expressions": [
    {"item_id": "PAINTBALL", "raw_expression": "1.000.000+ 35.000 por persona", "expression_type": "base_plus_variable", "components": [{"type": "base", "value": 1000000, "unit": None}, {"type": "per_person", "value": 35000, "unit": "persona"}], "confidence": "high"},
    {"item_id": "BUSQUEDA_TESORO", "raw_expression": "500.000+ 15.000 por persona", "expression_type": "base_plus_variable", "components": [{"type": "base", "value": 500000, "unit": None}, {"type": "per_person", "value": 15000, "unit": "persona"}], "confidence": "high"},
    {"item_id": "EL_NAUFRAGO_LA_BALSA", "raw_expression": "1.000.000 + 20.000 por persona", "expression_type": "base_plus_variable", "components": [{"type": "base", "value": 1000000, "unit": None}, {"type": "per_person", "value": 20000, "unit": "persona"}], "confidence": "high"}
  ],
  "business_rules": [
    {"item_id": "PAINTBALL", "raw_text": "Inlcuye primera carga de pelotas, con posibilidad de recarga por 15.000+ iva por persona", "rule_type": "inclusion", "structured_hint": {"min": None, "max": None, "condition": "recarga", "effect": "15000+iva", "unit": "persona"}, "confidence": "high"}
  ],
  "unknowns": []
}
write_json('processed_data/2026/extracted/teambuilding_y_actividades_teambuilding.csv.json', tb_data)

# COFFEES
coffee_data = {
  "items": [
    {"item_id": "COFFEE_BASICO", "name": "Coffee Básico", "raw_name": "Coffee Básico", "category": "Coffees", "source_row": 1},
    {"item_id": "COFFEE_INTERMEDIO", "name": "Coffee Intermedio", "raw_name": "Coffee Intermedio", "category": "Coffees", "source_row": 2},
    {"item_id": "COFFEE_FULL", "name": "Coffe Full", "raw_name": "Coffe Full", "category": "Coffees", "source_row": 3}
  ],
  "price_expressions": [
    {"item_id": "COFFEE_BASICO", "raw_expression": "7656", "expression_type": "flat", "components": [{"type": "base", "value": 7656, "unit": None}], "confidence": "high"},
    {"item_id": "COFFEE_INTERMEDIO", "raw_expression": "10395", "expression_type": "flat", "components": [{"type": "base", "value": 10395, "unit": None}], "confidence": "high"},
    {"item_id": "COFFEE_FULL", "raw_expression": "16500", "expression_type": "flat", "components": [{"type": "base", "value": 16500, "unit": None}], "confidence": "high"}
  ],
  "business_rules": [],
  "unknowns": []
}
write_json('processed_data/2026/extracted/precios_coffes_y_servicios_relacionado.csv.json', coffee_data)
