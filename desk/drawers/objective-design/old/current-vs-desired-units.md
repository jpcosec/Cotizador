# Current vs Desired Units

## Desired Architecture

| Unit | Responsibility | Signals In | Signals Out | Uses Pricing / Store? |
|------|----------------|------------|-------------|-----------------------|
| `QuotationFlow` | Compose units, manage global app flow, route cross-unit interactions | app start, client selected, item shipped, validate, save/load, export | stage changed, active context changed, save/load requested | store yes, pricing no |
| `ClientSelection` | Search/select active client | open modal, search term, choose client | client selected, client cleared | store yes, pricing no |
| `Catalog` | Search and expose available sellable units | search term, filters, requested category/item family | item selected, category selected, item shipped | store yes, pricing no |
| `Category` | Manage one product family view/state | expand/collapse, category context, search result subset | item intent forwarded, category state changed | store optional, pricing no |
| `Item` | Atomic commercial unit; derive quantity/price/rules from definition plus context | context changed, override changed, mode changed, rule re-eval requested | state snapshot changed, warnings/errors, total changed | pricing yes, store optional |
| `Basket` | Hold working quotation items across days | add item, remove item, move item, override item, selected day changed | basket summary changed, validation requested | store no, pricing via child items |
| `BasketDay` | Manage one day’s scheduled entries | add item at time, move entry, remove entry, day context changed | day entries changed, totals changed | store no, pricing via child items |
| `ValidationSummary` | Build review surface from quotation state | validate requested, basket changed, settings changed | validation issues, totals, confirm save | pricing no, store no |
| `Persistence` | Save/load quotation through bounded contract | save requested, load requested | save done/error, load done/error | store yes, pricing no |
| `Export` | Produce user-facing outputs | export csv/pdf requested | file produced, print triggered, export error | store no, pricing no |
| `PricingEngine` | Pure pricing and rule evaluation | item data, context, overrides | derived values, rule activations | pricing self |
| `Store` | Load selectively, query selectively, persist on request | init, query item/family/client/quotation, persist quotation | requested records, persist result | store self |

## Actual State

| Unit | Responsibility | Signals In | Signals Out | Uses Pricing / Store? |
|------|----------------|------------|-------------|-----------------------|
| `QuotationFlow` | Real top-level app shell in persisted/internal runtime plus flow component | UI events from GAS/Alpine, save/load/export, client/item actions | stage updates, snapshots for all views | store yes, pricing indirect |
| `ClientSelection` | Mostly modal behavior inside quotation flow/modals, not a standalone self-contained unit yet | open/close modal, search, choose client | selected client applied to runtime | store yes |
| `Catalog` | Real runtime unit via `catalogMachine` plus sidebar/catalog projections | search, toggle category, ship item | filtered categories, drag/ship intent | store yes |
| `Category` | Real actor/unit via `categoryMachine` | category selected, context patch | catalog item snapshots | store yes |
| `Item` | Strongest self-contained unit in repo; machine plus domain plus UI patterns exist | context patch, overrides, mode, drag/drop usage | totals, quantities, rule warnings/errors | pricing yes, store via resolved definitions |
| `Basket` | Real runtime unit via `basketMachine` | ship item, remove/move/update entry, day select | basket days, selected day, summary | pricing indirect |
| `BasketDay` | Real actor/unit via `basketDayMachine` | add/move/remove entry, context change | day entries and totals | pricing indirect |
| `ValidationSummary` | Exists mostly as a derived projection/read model, not a full autonomous unit | basket/settings/client changes, validate action | rows, totals, hover metadata | no direct pricing/store |
| `Persistence` | Real boundary through `createPersistedQuotationRuntime` and adapters | save/load requests | done/error states | store yes |
| `Export` | Partial boundary; CSV exists, PDF is still basically print | export csv, print | csv download, print dialog | no |
| `PricingEngine` | Real but distributed across `src/pricing` plus item domain/rules logic | item definitions/context/overrides | derived price/quantity/rules | yes |
| `Store` | Present but not yet cleanly expressed everywhere as one explicit store unit; database/resolver/persistence pieces are split | seed init, resolver queries, persistence ops | resolved defs, saved/loaded quotations | yes |

## Main Gaps

- `Item`, `Category`, `BasketDay`, `Basket`, and `Catalog` already fit the target model reasonably well.
- `QuotationFlow` is real, but still carries too much app glue.
- `ClientSelection`, `ValidationSummary`, and `Export` are still more screen features/boundaries than fully self-contained units.
- `Store` exists conceptually, but in code it is still split across resolver/database/persistence modules instead of reading like one explicit bounded store facade.
