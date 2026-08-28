# Customer UI, Platform Interface and Platform Core Boundaries

## Назначение

Документ фиксирует текущую архитектурную границу GreenMarket Customer UI после появления Platform Core, Platform Interface, Runtime и экспериментальных integration-spike документов.

Это не переписывает утверждённые ТЗ задним числом и не делает экспериментальный reusable stack канонической архитектурой.

## Действующая Модель Ответственности

| Уровень | Отвечает за | Не должен делать |
| --- | --- | --- |
| Product / Domain | Product, Seller, Basket, Purchase Intent, Purchase Option, бизнес-правила | Знать детали React UI и layout |
| Backend | Данные, доступность, расчёты, persistence, API responses | Подменять UI navigation state |
| Customer UI | Экран, Bottom Sheet, navigation, presentation state, ViewModel rendering, отправка Actions | Самостоятельно принимать бизнес-решения |
| Platform Interface | Адаптация Customer UI к Platform Core contracts | Становиться вторым источником бизнес-состояния |
| Platform Core | Доменно-агностичные interaction primitives: Actions, Events, Runtime, dispatch, subscriptions | Знать GreenMarket сущности: Product, Seller, Basket, Purchase Intent |

Главное правило: Customer UI выражает намерение пользователя, но не решает бизнес-результат.

## Interaction Flow

Нормальный путь взаимодействия:

```text
User intent
  -> Customer UI Action
  -> Platform Interface
  -> Platform Core dispatch/runtime
  -> business/backend processing
  -> Business Event / state / ViewModel
  -> Customer UI render
```

Семантика Actions должна сохраняться независимо от внутренней реализации: текущий runtime, будущий FSM engine, adapter или иной обработчик не должны менять смысл уже существующего Action.

## Business State vs Presentation State

| Business state | Presentation state |
| --- | --- |
| Purchase Intent | Bottom Sheet height/open context |
| Basket | Navigation stack |
| Product | Selected UI surface |
| Seller | Loading/error/skeleton state |
| Purchase Option | Search input draft, temporary UI filters |
| Home Inventory | Local UI expansion/collapse |

Навигация и presentation state могут ссылаться на бизнес-сущности через id, но не должны становиться вторым источником истины для их бизнес-состояния.

## Main Screen and Navigation

Карта остаётся постоянной рабочей поверхностью Customer UI. Bottom Sheet представляет текущий UI-контекст взаимодействия.

Открытие продавца, товара, Purchase Option или результатов поиска не должно неявно сбрасывать независимое состояние карты или бизнес-контекст. Back закрывает текущий UI-контекст и возвращает пользователя по истории, а не произвольно меняет Product/Domain state.

Global Context и Store Context управляют route/presentation context. Они не заменяют доменную модель GreenMarket.

## Reusable Stack and Donor Code

Экспериментальный reusable interaction stack остаётся экспериментом до отдельного архитектурного решения.

При сравнении с текущим GreenMarket baseline нужно оценивать:

| Критерий | Вопрос |
| --- | --- |
| Functional compatibility | Закрывает ли тот же пользовательский сценарий без регрессий? |
| Action semantics | Сохраняется ли смысл существующих Actions? |
| Domain isolation | Не попадает ли бизнес-логика в React или Platform Core? |
| State complexity | Не появляется ли дублирование state/runtime? |
| Navigation | Не ломаются ли Back, refresh, deep links, Store/Global boundaries? |
| Adapter cost | Сколько glue-кода нужно для интеграции? |
| Platform Core impact | Требуется ли менять доменно-агностичное ядро? |
| Testability | Легче или сложнее покрывать сценарии? |
| Observability | Можно ли восстановить путь Action -> result -> UI? |
| Reuse | Есть ли реальная польза повторного использования вне GreenMarket? |

Готовый код из donor repository не становится canonical автоматически. Перенос допускается только capability-by-capability: источник, назначение, отличие от текущей реализации и причина принятия должны быть зафиксированы.

## Reconciliation Decisions

Для каждого расхождения между GreenMarket baseline и экспериментом нужно выбрать одно решение:

| Decision | Значение |
| --- | --- |
| KEEP | Существующая реализация остаётся источником истины |
| ADAPT | Идея принимается через локальный adapter/glue |
| REPLACE | Текущий механизм заменяется после доказанной пользы |
| RESEARCH | Недостаточно данных, остаётся предметом отдельного spike |
| REJECT | Не переносится из-за дублирования, нарушения границ или лишней сложности |

Нельзя превращать каждое отличие в новый API или новую архитектурную абстракцию.

## API Gap Analysis

Перед добавлением нового контракта нужно зафиксировать:

1. Какой пользовательский сценарий выполняется.
2. Какой Action отправляет Customer UI.
3. Какой Platform Interface contract используется.
4. Что ожидается от Platform Core.
5. Какой backend/domain result нужен.
6. Какой Business Event, state или ViewModel возвращается.
7. Это реальный missing API, semantic mismatch или достаточно adapter.

Новый контракт появляется только после такого анализа.

## Observability

Для ключевых взаимодействий должна быть возможность восстановить:

| Что фиксируем | Зачем |
| --- | --- |
| Action type and payload | Понять намерение пользователя |
| Interaction context | Отличить Global, Store, Map, Bottom Sheet и другой UI-context |
| Start/end timing | Найти slow/failing step |
| Handler/result | Понять, кто обработал действие |
| Business Event/state result | Связать обработку с результатом |
| ViewModel/UI state | Проверить, что увидел пользователь |

Логирование остаётся диагностикой. Оно не должно содержать бизнес-логику и не должно становиться отдельным state-management слоем.

## Documentation Status

| Тип документа | Статус |
| --- | --- |
| Existing specifications | Исторические и действующие требования; не переписываются ради эксперимента |
| Architecture notes | Объясняют текущие решения и границы |
| Reconciliation docs | Фиксируют сравнение и решения по миграции |
| Experimental spikes | Исследуют варианты, но не являются canonical implementation |

Этот документ является действующей архитектурной рамкой для дальнейшей оценки Platform Interface, Platform Core и reusable interaction stack.
