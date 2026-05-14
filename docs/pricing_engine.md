# Pricing Engine

How item prices are calculated in `dev/src/services/pricing/`.

## Component map

```mermaid
graph TD
    ItemLogic["ItemLogic (stateful item)"]
    ItemLogic --> PricingDetection
    ItemLogic --> Formulas
    ItemLogic --> QuantityResolution
    PricingDetection["PricingDetection"]
    Formulas["Formulas"]
    QuantityResolution["QuantityResolution"]
    RulesCoordinator["RulesCoordinator (JSON-Logic)"]
    JsonLogic["json-logic-js"]
    ResolveItemDefinition["resolveItemDefinition (5-way join)"]
    Database["InMemoryStore / GasSheetAdapter"]
    Database --> ITEM_CATALOGO
    Database --> PERFILES_PRECIO
    Database --> PERFILES_INICIALIZACION
    Database --> CATEGORIAS
    Database --> REGLAS_NEGOCIO
    ITEM_CATALOGO["ITEM_CATALOGO"]
    PERFILES_PRECIO["PERFILES_PRECIO"]
    PERFILES_INICIALIZACION["PERFILES_INICIALIZACION"]
    CATEGORIAS["CATEGORIAS"]
    REGLAS_NEGOCIO["REGLAS_NEGOCIO"]
    BasketMachine["Basket / Item Machine"]
    UI["Alpine UI Layer"]
    BasketMachine -->|resolve item definition| ResolveItemDefinition
    ResolveItemDefinition -->|5-way join| Database
    BasketMachine -->|initialize / recalculate| ItemLogic
    ItemLogic -->|detectPricingKind / normalizeProfile| PricingDetection
    ItemLogic -->|formatCatalogTerms / evaluateRules| Formulas
    ItemLogic -->|resolveBasketQuantity| QuantityResolution
    RulesCoordinator -->|evaluate condition| JsonLogic
    ItemLogic -->|toCatalogCard / toBasketLine / toMachineContext| UI
    ResolveItemDefinition -->|pre-filtered reglas| RulesCoordinator
```

## Calculation flow

```mermaid
flowchart TD
    __start([Start])
    resolve_definition["resolveItemDefinition(itemId, db)"]
    normalize_profile["normalizeProfile(pricingProfile)"]
    detect_kind{"detectPricingKind(profile)"}
    resolve_pax_quantity["resolveBasketQuantity — PAX"]
    check_init_mode_pax{"InitMode?"}
    use_pax_fixed["quantity = defaults.pax"]
    use_global_pax["quantity = externalContext.paxGlobal"]
    use_pax_override["quantity = overrides.pax"]
    resolve_units_quantity["resolveBasketQuantity — UNITS"]
    resolve_time_quantity["resolveBasketQuantity — TIME"]
    compute_flat["total = baseFijo"]
    compute_total["total = baseFijo + (quantity × rate)"]
    evaluate_rules["evaluateRules(rules, snapshot)"]
    check_rules{"Any blocking rule fired?"}
    mark_unavailable["available = false"]
    expose_projections["toCatalogCard / toBasketLine / toMachineContext"]
    __end([End])
    __start --> resolve_definition
    resolve_definition --> normalize_profile
    normalize_profile --> detect_kind
    detect_kind -->|PAX| resolve_pax_quantity
    detect_kind -->|UNITS| resolve_units_quantity
    detect_kind -->|TIME| resolve_time_quantity
    detect_kind -->|NONE| compute_flat
    resolve_pax_quantity --> check_init_mode_pax
    check_init_mode_pax -->|FIXED_AMOUNT| use_pax_fixed
    check_init_mode_pax -->|CONTEXT_PAX| use_global_pax
    check_init_mode_pax -->|override set| use_pax_override
    use_pax_fixed --> compute_total
    use_global_pax --> compute_total
    use_pax_override --> compute_total
    resolve_units_quantity --> compute_total
    resolve_time_quantity --> compute_total
    compute_flat --> evaluate_rules
    compute_total --> evaluate_rules
    evaluate_rules --> check_rules
    check_rules -->|yes| mark_unavailable
    check_rules -->|no| expose_projections
    mark_unavailable --> expose_projections
    expose_projections --> __end
```

## Key concepts

### PricingKind
How the variable dimension of an item's price is driven:

| Kind | Driver | Example |
|---|---|---|
| `NONE` | No variable component | Salon Chinook: $385.000 flat |
| `PAX` | Per person | Desayuno: $12.500 × pax |
| `UNITS` | Per unit | Vino Castillo Molina: $13.025/bottle |
| `TIME` | Per minute | (reserved for timed services) |

Detection priority: PAX > UNITS > TIME > NONE, based on which `Costo_Unitario_*` field in `PERFILES_PRECIO` is non-zero.

### InitializationMode
How the **default quantity** is resolved when the item is first dropped into the basket — before the user overrides anything:

| Mode | Source of quantity |
|---|---|
| `NONE` | No quantity applies (FLAT items) |
| `FIXED_AMOUNT` | Hardcoded in `PERFILES_INICIALIZACION` (e.g. `Pax_Fijo = 30`) |
| `CONTEXT_PAX` | Inherits `paxGlobal` from the quotation settings |
| `CONTEXT_TIME` | Inherits `duracionMin` from the quotation settings |

### Price formula

```
total = Costo_Base_Fijo + (quantity × rate)
```

where `rate` is `Costo_Unitario_Pax`, `Costo_Unitario_Item`, or `Costo_Unitario_Tiempo` depending on `PricingKind`.

### Profile normalization
`normalizeProfile()` accepts both camelCase (`baseFijo`, `porPersona`) and schema-style (`Costo_Base_Fijo`, `Costo_Unitario_Pax`) keys, so `ItemLogic` can be seeded directly from a `PERFILES_PRECIO` row.

### Two rule engines
There are currently two co-existing rule mechanisms:

| Engine | Format | Used by |
|---|---|---|
| `evaluateRules()` in `Formulas.js` | `{type: 'MAX_PAX'/'MIN_PAX'/'ONLY_HOUR_RANGE', value, active, blocking}` | `ItemLogic.recalculate()` directly |
| `RulesCoordinator` | JSON-Logic (`{Condicion_JSON, Payload_JSON, Scope, Etapa}`) | `resolveItemDefinition()` → future pipeline |

The `RulesCoordinator` is the intended long-term path (it supports arbitrary conditions via JSON-Logic), but it is **not yet wired into `ItemLogic`** — `ItemLogic` still calls `evaluateRules()` with the simpler format. The transition is pending.

## Data flow from extracted catalog

The extracted `pricing.csv` maps to `PERFILES_PRECIO` as:

| pricing.csv field | PERFILES_PRECIO column |
|---|---|
| `base_value` | `Costo_Base_Fijo` |
| `variable_value` (when `expression_type = per_person` or `base_plus_variable`) | `Costo_Unitario_Pax` |
| `variable_value` (when `expression_type = per_unit`) | `Costo_Unitario_Item` |

Key files: `dev/src/services/pricing/item/`
