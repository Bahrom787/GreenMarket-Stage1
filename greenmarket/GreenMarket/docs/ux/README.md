# GreenMarket — UX Artifacts

**Status:** Informational (не нормативный документ, индекс раздела)

Раздел содержит UX-артефакты GreenMarket: пользовательские сценарии, wireframe'ы, семантические и поведенческие модели экранов.

Это **не** архитектура Platform Interface (`docs/platform/`) и **не** Design System (`docs/design-system/`) — раздел описывает, что видит и делает пользователь, а не из чего собран интерфейс технически.

Место в цепочке: `PRD → Domain Models → UX Research → Screen Design (docs/ux/) → Layout Layer → Design System → реализация`.

## Stage 1

[`stage-1/`](./stage-1/) — 6 экранов, определённых [GM-010. Stage 1 Model Mapping](../architecture/GM-010_STAGE1_MODEL_MAPPING.md):

| Документ | Экран |
|---|---|
| [UX-001](./stage-1/UX-001-map.md) | Map |
| [UX-002](./stage-1/UX-002-catalog.md) | Catalog |
| [UX-003](./stage-1/UX-003-seller-list.md) | Seller List |
| [UX-004](./stage-1/UX-004-seller-card.md) | Seller Card |
| [UX-005](./stage-1/UX-005-product-card.md) | Product Card |
| [UX-006](./stage-1/UX-006-search.md) | Search |

Этот комплект — входной материал для Layout Layer (архитектурная композиция экранов), без изменения пользовательских сценариев и информационной композиции.
