# Component x View-Stage Matrix Diff

Generated from:
- `component-view-stage-matrix.yaml`
- `component-view-stage-matrix-desired.yaml`

## Missing In Current

- `QuotationFlow/RulesEngine`

## Extra In Current

- None

## Changed

### `AdminPanel`

- current status: `real`
- desired status: `target`
- current stages: `admin:audit, admin:edit, admin:list`
- desired stages: `admin:audit, admin:edit, admin:list`

### `AdminPanel/AuditLog`

- current status: `real`
- desired status: `target`
- current stages: `admin:audit`
- desired stages: `admin:audit`

### `AdminPanel/PackEditor`

- current status: `real`
- desired status: `target`
- current stages: `admin:edit`
- desired stages: `admin:edit`

### `QuotationFlow`

- current status: `overloaded`
- desired status: `target`
- current stages: `quotation:basket, quotation:browse, quotation:client, quotation:completed, quotation:validation`
- desired stages: `quotation:basket, quotation:browse, quotation:client, quotation:completed, quotation:validation`

### `QuotationFlow/Basket`

- current status: `real`
- desired status: `target`
- current stages: `quotation:basket, quotation:validation`
- desired stages: `quotation:basket, quotation:validation`

### `QuotationFlow/Basket/BasketDay`

- current status: `real`
- desired status: `target`
- current stages: `quotation:basket, quotation:validation`
- desired stages: `quotation:basket, quotation:validation`

### `QuotationFlow/Basket/BasketDay/Item`

- current status: `strong`
- desired status: `target`
- current stages: `quotation:basket, quotation:validation`
- desired stages: `quotation:basket, quotation:validation`

### `QuotationFlow/Catalog`

- current status: `real`
- desired status: `target`
- current stages: `quotation:basket`
- desired stages: `quotation:basket`

### `QuotationFlow/Catalog/Category`

- current status: `real`
- desired status: `target`
- current stages: `quotation:basket`
- desired stages: `quotation:basket`

### `QuotationFlow/Catalog/Category/Item`

- current status: `strong`
- desired status: `target`
- current stages: `quotation:basket`
- desired stages: `quotation:basket`

### `QuotationFlow/ClientSelection`

- current status: `partial`
- desired status: `target`
- current stages: `quotation:client`
- desired stages: `quotation:client`

### `QuotationFlow/Export`

- current status: `partial`
- desired status: `target`
- current stages: `quotation:validation`
- desired stages: `quotation:validation`

### `QuotationFlow/Persistence`

- current status: `real`
- desired status: `target`
- current stages: `admin:audit, admin:edit, admin:list, quotation:browse, quotation:completed, quotation:validation`
- desired stages: `admin:audit, admin:edit, admin:list, quotation:browse, quotation:completed, quotation:validation`

### `QuotationFlow/PricingEngine`

- current status: `distributed`
- desired status: `target`
- current stages: `quotation:basket, quotation:validation`
- desired stages: `quotation:basket, quotation:validation`

### `QuotationFlow/Store`

- current status: `split`
- desired status: `target`
- current stages: `quotation:basket, quotation:browse, quotation:client`
- desired stages: `admin:audit, admin:edit, admin:list, quotation:basket, quotation:browse, quotation:client`

### `QuotationFlow/ValidationSummary`

- current status: `partial`
- desired status: `target`
- current stages: `quotation:validation`
- desired stages: `quotation:validation`
