# GM-UX-012. Basket — Требования на реализацию UX Stage 1

**Идентификатор:** GM-UX-012  
**Статус:** Approved  
**Версия:** 1.0  

---

## 1. Назначение
Экран **Basket** предназначен для просмотра, редактирования и подготовки выбранных товаров к покупке.  
Корзина является самостоятельным Runtime-модулем Customer UI и реализуется поверх Platform Core без собственной бизнес-логики.

## 2. Связанные документы
* PRD Stage 1
* ADR-002 Customer UI
* GM-DOM-001 Domain Model
* GM-DOM-005 Runtime Models
* GM-DOM-006 Navigation Model
* GM-DOM-007 Action Model
* GM-DOM-008 Screen Contract
* GM-UX-008 Catalog
* GM-UX-009 Product Card
* GM-UX-010 Seller Card
* GM-UX-011 Search

## 3. Назначение корзины
Корзина представляет собой временную Runtime-модель пользователя.  
Она объединяет товары, выбранные у различных продавцов, и предоставляет единый интерфейс управления покупкой.  
Корзина не оформляет заказ. После подтверждения пользователь переходит на экран **Purchase Options**.

## 4. Пользовательские сценарии
Пользователь может:
* открыть корзину;
* просмотреть выбранные товары;
* изменить количество;
* удалить товар;
* удалить группу товаров продавца;
* очистить корзину;
* перейти к оформлению покупки;
* вернуться назад.

## 5. Границы Stage 1
### Входит
* список товаров;
* группировка по продавцам;
* изменение количества;
* удаление товара;
* очистка корзины;
* расчёт стоимости;
* переход к Purchase Options.

### Не входит
* оформление заказа;
* онлайн-оплата;
* резервирование товара;
* применение купонов;
* программа лояльности;
* рекомендации.

## 6. Архитектура
```text
src/
└── basket/
    ├── domain/
    │   ├── Basket.ts
    │   ├── BasketGroup.ts
    │   ├── BasketItem.ts
    │   └── BasketSummary.ts
    ├── runtime/
    │   └── BasketRuntime.ts
    ├── builder/
    │   └── BasketRuntimeBuilder.ts
    ├── formatting/
    │   └── BasketFormatter.ts
    ├── adapter/
    │   └── BasketAdapter.ts
    ├── navigation/
    │   └── BasketNavigation.ts
    ├── repository/
    │   └── BasketRepository.ts
    ├── viewmodel/
    │   └── BasketViewModel.ts
    ├── actions/
    │   └── BasketActions.ts
    ├── screen/
    │   └── BasketScreen.tsx
    ├── components/
    │   ├── BasketHeader.tsx
    │   ├── BasketSellerGroup.tsx
    │   ├── BasketItemCard.tsx
    │   ├── BasketSummaryCard.tsx
    │   ├── EmptyBasket.tsx
    │   └── BasketFooter.tsx
    ├── hooks/
    │   └── useBasket.ts
    └── tests/
        ├── runtime.test.ts
        ├── builder.test.ts
        ├── repository.test.ts
        ├── adapter.test.ts
        ├── formatter.test.ts
        └── screen.test.ts
```

## 7. Domain Model
### Basket
Корневая модель корзины. Содержит:
* список групп продавцов;
* общую стоимость;
* общее количество товаров;
* итоговые расчёты.

### BasketGroup
Описывает товары одного продавца. Содержит:
* Seller;
* список `BasketItem`;
* стоимость группы.

### BasketItem
Содержит:
* товар;
* количество;
* цену;
* сумму позиции.

### BasketSummary
Содержит итоговые значения:
* `subtotal`;
* `deliveryEstimate`;
* `totalItems`;
* `totalPrice`.

## 8. Runtime
Basket использует:
* `EntityRuntimeState<Basket>`

Поддерживаются состояния:
* Empty
* Loading
* Ready
* Refreshing
* Error

*Runtime не зависит от React.*

## 9. Repository Contract
Минимальный контракт:
* `getBasket()`
* `updateQuantity()`
* `removeItem()`
* `removeGroup()`
* `clearBasket()`
* `refreshBasket()`

Repository возвращает DTO.  
*Не содержит REST, SQL и бизнес-логики.*

## 10. Runtime Builder
Builder выполняет преобразование:
$$	ext{BasketDto} \longrightarrow 	ext{Basket} \longrightarrow 	ext{Runtime}$$

Builder отвечает исключительно за построение Runtime-модели.

## 11. Formatter
Formatter отвечает за отображение:
* цены;
* количества;
* валюты;
* единиц измерения;
* итоговых сумм.

Используются общие **Platform Formatters**.

## 12. Adapter
Adapter формирует ViewModel.  
*Например:*
* `125.50` $\longrightarrow$ `"125,50 MAD"`
* `3` $\longrightarrow$ `"3 товара"`

## 13. ViewModel
Содержит:
* `sellerGroups`;
* `summary`;
* `totalItems`;
* `totalPrice`;
* `loading`;
* `emptyState`;
* `error`;
* `primaryActionEnabled`.

*ViewModel полностью готов к отображению.*

## 14. Screen
`BasketScreen` отображает только ViewModel.  
**Не содержит:**
* Repository;
* Runtime;
* форматирования;
* бизнес-логики.

## 15. UI Components
* **BasketHeader** — Заголовок.
* **BasketSellerGroup** — Карточка продавца.
* **BasketItemCard** — Строка товара.
* **BasketSummaryCard** — Итоги корзины.
* **BasketFooter** — Основная кнопка перехода.
* **EmptyBasket** — Экран пустой корзины.

## 16. Action Catalog
Поддерживаются действия:
* `OPEN_PRODUCT`
* `CHANGE_QUANTITY`
* `REMOVE_ITEM`
* `REMOVE_GROUP`
* `CLEAR_BASKET`
* `PROCEED_TO_PURCHASE`
* `BACK`
* `REFRESH`
* `RETRY`

## 17. Navigation
Поддерживаются переходы:
* Basket $\longrightarrow$ Product Card
* Basket $\longrightarrow$ Purchase Options

Навигация осуществляется только через **Platform Navigation Contract**.

## 18. Unit Tests
Обязательны тесты:
* Runtime;
* Builder;
* Repository;
* Formatter;
* Adapter;
* Navigation.

## 19. Integration Tests
Проверяются:
* загрузка корзины;
* изменение количества;
* удаление товара;
* удаление группы;
* очистка корзины;
* переход к Purchase Options;
* открытие Product Card;
* восстановление после ошибки.

## 20. Definition of Done
Модуль считается завершённым, если:
* используется Platform Core;
* Runtime независим от React;
* Repository соответствует Platform Contracts;
* отсутствует бизнес-логика в UI;
* Formatter использует Platform Formatter;
* Navigation использует общий контракт;
* тесты проходят успешно;
* модуль не требует изменений Platform Core.

## 21. Архитектурное решение
Basket является четвёртым эталонным модулем Customer UI Stage 1. В отличие от Product Card, Seller Card и Search, он впервые объединяет несколько предметных сущностей (товары, продавцов и итоговые расчёты) в единую Runtime-модель. Реализация Basket должна подтвердить, что Platform Core поддерживает не только работу с отдельными сущностями и коллекциями, но и с составными агрегатами без изменения базовой архитектуры.
