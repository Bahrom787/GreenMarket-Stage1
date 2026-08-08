# Icon Sizes

**Document ID:** DS-002 / Icon-Sizes
**Status:** Approved
**Implementation Status:** Token Values Pending
**Version:** 2.0 (DRY refactor — extension over Material Design 3)
**Last Updated:** TBD
**Owner:** Design System Team

**Related Documents:** DS-001 Design Concept · DS-002 / Spacing · DS-003 Foundations / Iconography · DS-004 Components

## 1. Purpose

Определяет шкалу размеров иконок (Icon Size Tokens) для GreenMarket Customer UI.

## 2. Scope

**Входит:** шкала размеров, рекомендуемое применение.
**Не входит:** стиль/набор иконок — см. DS-003 Foundations / Iconography.

## 3. Material Design Baseline

GreenMarket использует модель именованных размеров иконок Material Design 3. Если не определено иное, применяются рекомендации MD3: https://m3.material.io/styles/icons.

## 4. GreenMarket Extensions

### 4.1 Product Principles Mapping

| Принцип | Следствие |
|---|---|
| Fast Perception | Единые размеры ускоряют распознавание иконок. |
| Consistency | Один тип действия — всегда один размер. |

### 4.2 Шкала GreenMarket

| Token | Size |
|---|---:|
| Icon XS | 12 dp |
| Icon S | 16 dp |
| Icon M | 20 dp |
| Icon L | 24 dp |
| Icon XL | 32 dp |
| Icon XXL | 40 dp |
| Icon Display | 48 dp |

Дополнительные размеры — только после изменения настоящего документа.

### 4.3 Рекомендуемое применение

| Элемент | Token |
|---|---|
| Встроенная иконка в тексте | Icon XS |
| Badge | Icon S |
| Compact Button | Icon M |
| Standard Button / Navigation Bar / Toolbar / Search / List Item | Icon L |
| Empty State | Icon XL |
| Illustration Accent | Icon XXL |
| Hero / Onboarding | Icon Display |

## 5. Constraints

- Произвольные размеры иконок не допускаются.
- Масштабирование одной и той же иконки внутри разных экземпляров одного компонента не допускается.
- Чрезмерно крупные декоративные иконки не используются.
- Разные размеры для одинаковых действий — только с документированным обоснованием.

## 6. References

- Material Design 3 — Icons: https://m3.material.io/styles/icons
- README — GreenMarket Design System
- DS-001 — Design Concept
