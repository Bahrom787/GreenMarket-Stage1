# Radius (DS-002)

Document ID: DS-002 / Radius
Status: Approved
Version: 2.1 (Refactored)
Related Documents: DS-001 Design Concept, DS-002 / Color, DS-002 / Typography, DS-002 / Spacing, DS-004 Components

-----

## 1. Назначение документа (Purpose)

Определяет шкалу скругления углов (Radius Tokens) и правила её использования в GreenMarket Customer UI.

## 2. Область действия (Scope)

Входит: шкала радиусов, рекомендуемое применение.
Не входит: форма конкретных компонентов (см. DS-004 Components).

## 3. Material Design Baseline

GreenMarket использует модель Radius Tokens Material Design 3 (шкала именованных размеров, компоненты не задают произвольных значений). Если не определено иное, применяются рекомендации MD3.

## 4. GreenMarket Extensions (Расширения)

### 4.1 Product Principles Mapping

| Принцип | Следствие для Radius |
| :--- | :--- |
| **Organic Market** | Лёгкие скругления создают ощущение естественности без декоративности. |
| **Consistency** | Все однотипные элементы имеют одинаковую форму. |

### 4.2 Шкала GreenMarket

- **Radius None**: 0 dp
- **Radius XS**: 4 dp
- **Radius S**: 8 dp
- **Radius M**: 12 dp
- **Radius L**: 16 dp
- **Radius XL**: 24 dp
- **Radius Full**: 9999 dp

### 4.3 Рекомендуемое применение

- Text Field: **Radius S**
- Button: **Radius M**
- Chip / Card: **Radius L**
- Bottom Sheet (верхние углы): **Radius XL**
- Badge / Avatar / FAB: **Radius Full**

### 4.4 Правила

- Большие контейнеры могут использовать больший радиус, чем вложенные элементы (Hierarchy).
- Соблюдается принцип минимального разнообразия радиусов на одном экране (Minimal Variety).

## 5. Ограничения (Constraints)

- Произвольные значения радиуса (не из сетки токенов) не допускаются.
- Смешение нескольких визуальных стилей скругления не допускается.
- Радиус одного и того же компонента не меняется в зависимости от экрана.
