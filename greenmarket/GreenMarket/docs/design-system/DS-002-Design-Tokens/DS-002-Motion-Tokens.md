# Motion Tokens

**Document ID:** DS-002 / Motion-Tokens
**Status:** Approved
**Implementation Status:** Token Values Pending
**Version:** 2.0 (DRY refactor — extension over Material Design 3)
**Last Updated:** TBD
**Owner:** Design System Team

**Related Documents:** DS-001 Design Concept · DS-003 Foundations / Motion · DS-004 Components · DS-005 Patterns

## 1. Purpose

Определяет токены анимации (Duration/Easing/Delay) для GreenMarket Customer UI.

## 2. Scope

**Входит:** Duration/Easing/Delay Tokens.
**Не входит:** анимации конкретных компонентов, переходы между экранами, жесты, анимация карты — см. DS-003, DS-005.

## 3. Material Design Baseline

GreenMarket использует модель Motion Material Design 3 (Duration/Easing/Delay как отдельные группы токенов, easing-кривые — Standard/Accelerate/Decelerate/Emphasized). Конкретные параметры easing определяются реализацией платформы. Если не определено иное, применяются рекомендации MD3: https://m3.material.io/styles/motion.

## 4. GreenMarket Extensions

### 4.1 Product Principles Mapping

| Принцип | Следствие |
|---|---|
| Motion With Purpose | Каждая анимация имеет функциональную цель, декоративная анимация не используется. |
| Fast Perception | Анимация объясняет изменение, не задерживает пользователя. |

### 4.2 Duration Tokens GreenMarket

| Token | Duration |
|---|---:|
| Instant | 0 ms |
| Extra Fast | 100 ms |
| Fast | 150 ms |
| Normal | 200 ms (по умолчанию) |
| Medium | 250 ms |
| Slow | 300 ms |
| Extra Slow | 400 ms |

Duration свыше 400 ms — только по отдельному архитектурному решению.

### 4.3 Delay Tokens GreenMarket

| Token | Delay |
|---|---:|
| None | 0 ms |
| Short | 50 ms |
| Medium | 100 ms |
| Long | 150 ms |

### 4.4 Правила GreenMarket

- Во время загрузки — только спокойные циклические анимации; мигающие/резкие эффекты запрещены.
- Одновременно — не более двух независимых анимируемых элементов.
- При включённом системном режиме уменьшения движения: длительности сокращаются, декоративные анимации отключаются, остаются только анимации, необходимые для понимания изменения состояния.

## 5. Constraints

- Собственные easing-функции внутри компонентов не создаются.
- Бесконечные декоративные анимации не допускаются.
- Анимации, ухудшающие производительность интерфейса, не допускаются.

## 6. References

- Material Design 3 — Motion: https://m3.material.io/styles/motion
- README — GreenMarket Design System
- DS-001 — Design Concept
