# Color

**Document ID:** DS-002 / Color
**Title:** Design Tokens — Color
**Status:** Approved
**Implementation Status:** Token Values Pending
**Version:** 2.0 (DRY refactor — extension over Material Design 3)
**Last Updated:** TBD
**Owner:** Design System Team

**Related Documents:** DS-001 Design Concept · DS-003 Foundations / Themes · DS-003 Foundations / Accessibility · DS-004 Components · DS-005 Patterns

> **Note:** Итоговая цветовая палитра (HEX/RGB/HSL для Primitive Tokens) не утверждена — везде ниже стоит `TBD`. Структура ролей и правила использования стабильны и пригодны для проектирования, но документ непригоден для реализации, пока палитра не заполнена.

---

## 1. Purpose

Определяет цветовые роли, палитру и правила использования цвета в GreenMarket Customer UI.

## 2. Scope

**Входит:** цветовые роли, палитра (Light/Dark на уровне токенов), функциональные цвета, требования к контрасту, ограничения применения.

**Не входит:** момент переключения темы, использование цвета в конкретных компонентах/паттернах, брендовые материалы — см. DS-003, DS-004, DS-005, DS-007.

## 3. Material Design Baseline

GreenMarket использует цветовую модель Material Design 3 без изменений: трёхуровневую иерархию токенов (Primitive → Semantic → Theme), семантические роли (Primary/Secondary/Tertiary/Neutral/Error и их On-/Container-варианты), правила именования (роль, а не внешний вид) и требования к контрасту WCAG AA.

Если настоящим документом не определено иное, применяются рекомендации Material Design 3 — https://m3.material.io/styles/color.

Ниже описываются только решения и ограничения, специфичные для GreenMarket.

## 4. GreenMarket Extensions

### 4.1 Отклонение от MD3: роль Accent

MD3 не выделяет отдельную роль «Accent» (использует Tertiary). GreenMarket вводит **Accent** как более узкую, чем Tertiary, роль — только для локальных акцентов (отдельные иконки, небольшие выделения), не как второй брендовый цвет.

Ограничение: Accent никогда не используется одновременно с Secondary без участия Primary.

| Сочетание | Допустимо |
|---|---|
| Primary + Secondary | ✓ |
| Primary + Accent | ✓ |
| Secondary + Accent | ✗ |
| Primary + Secondary + Accent | ✗ |

На экране — не более двух акцентных ролей одновременно.

### 4.2 Product Principles Mapping

| Продуктовый принцип (DS-001) | Следствие для цвета |
|---|---|
| Living Marketplace | Цвет не различает продавцов — индивидуальность создаётся контентом (фото, название, рейтинг), не палитрой. |
| Freshness First | Цвет отражает актуальность данных (Warning/Neutral), не их ценность; никогда не единственный индикатор. |
| Local Trust | Доверие формируется данными, не цветом. |
| Compare Naturally | Одинаковые типы информации — одинаковые роли независимо от продавца. |
| Product Before Brand | Neutral — 80–90% площади экрана; Primary — до 10%. |

### 4.3 Токены (палитра — TBD)

Роли и состав набора идентичны MD3 (Primary/On-Primary/Primary Container/On-Primary Container и т.д. для Primary, Secondary, Neutral, Error). Расширение GreenMarket — набор Functional Colors сверх стандартного MD3 Error:

| Token | Назначение |
|---|---|
| Success / On Success / Success Container | успешное завершение, оплата, заказ |
| Warning / On Warning / Warning Container | частичная доступность, устаревающая информация |
| Info / On Info / Info Container | нейтральные информационные сообщения |

Все значения — `TBD`, см. Note выше.

### 4.4 Outdoor Readability (Sunlight First)

Специфичный для GreenMarket accessibility-приоритет сверх стандартного MD3 AA: все основные сочетания должны тестироваться при ярком солнечном освещении, на экранах средней яркости и при сниженной контрастности дисплея — это не входит в стандартную MD3-проверку.

## 5. Constraints

- Primitive Tokens и HEX-значения не используются внутри компонентов — только Semantic/Theme роли.
- Не более двух акцентных ролей на экране одновременно (см. 4.1).
- Functional Colors не используются как брендовые/декоративные.
- Neutral — не менее 80% площади экрана.
- Изменение семантики роли требует обновления настоящего документа.

## 6. References

- Material Design 3 — Color System: https://m3.material.io/styles/color
- README — GreenMarket Design System
- DS-001 — Design Concept
- DS-003 — Foundations / Accessibility, Themes
