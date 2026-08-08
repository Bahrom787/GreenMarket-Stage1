# Elevation

**Document ID:** DS-002 / Elevation
**Status:** Approved
**Implementation Status:** Token Values Pending
**Version:** 2.0 (DRY refactor — extension over Material Design 3)
**Last Updated:** TBD
**Owner:** Design System Team

**Related Documents:** DS-001 Design Concept · DS-002 / Color · DS-002 / Spacing · DS-002 / Radius · DS-003 Foundations / Themes · DS-004 Components

## 1. Purpose

Определяет уровни визуальной высоты (Elevation Tokens) и правила их использования в GreenMarket Customer UI.

## 2. Scope

**Входит:** уровни Elevation, рекомендуемое применение по компонентам.
**Не входит:** конкретная реализация теней/поверхностей по платформам — см. DS-004 Components.

## 3. Material Design Baseline

GreenMarket использует модель Elevation Material Design 3 (уровни как семантические роли, а не декоративные тени). Если не определено иное, применяются рекомендации MD3.

## 4. GreenMarket Extensions

### 4.1 Product Principles Mapping

| Принцип | Следствие |
|---|---|
| Content First | Тени подчёркивают структуру, не доминируют над контентом. |
| Organic Market | Интерфейс остаётся визуально лёгким и спокойным. |
| Product Before Brand | Elevation не используется как декоративный элемент фирменного стиля. |

### 4.2 Уровни GreenMarket (ограниченный набор — максимум 6)

| Token | Назначение |
|---|---|
| Elevation 0 | Базовая поверхность, экран |
| Elevation 1 | Card, Product Card, Seller Card |
| Elevation 2 | Floating Button, Search Bar |
| Elevation 3 | Bottom Sheet, Floating Panels |
| Elevation 4 | Модальный диалог, Snackbar |
| Elevation 5 | Tooltip (максимальный уровень — выше не создаётся) |

### 4.3 Правила

- Компонент по умолчанию использует минимально возможный уровень; временное повышение допускается только при взаимодействии, с возвратом к базовому после его завершения.

## 5. Constraints

- Создание дополнительных уровней сверх Elevation 5 не допускается.
- Произвольные/декоративные тени не используются.
- Elevation не заменяет композицию (White Space First).
- Одинаковые компоненты — одинаковый Elevation.

## 6. References

- Material Design 3 — Elevation: https://m3.material.io/styles/elevation
- README — GreenMarket Design System
- DS-001 — Design Concept
