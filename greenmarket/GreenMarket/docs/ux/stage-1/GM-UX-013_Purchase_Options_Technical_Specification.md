# GM-UX-013. Purchase Options — Требования на реализацию UX Stage 1

**Идентификатор:** GM-UX-013  
**Статус:** Approved  
**Версия:** 1.0  

---

## 1. Назначение
Экран **Purchase Options** является завершающим экраном Customer UI Stage 1.  
Он предназначен для выбора пользователем способа получения товаров перед созданием заказа.  

Экран не выполняет оформление заказа и не содержит бизнес-логики оформления. Его задача — собрать параметры покупки и передать их следующему этапу системы.  

Purchase Options реализуется поверх Platform Core и использует общую архитектуру:
$$	ext{Runtime} \longrightarrow 	ext{Builder} \longrightarrow 	ext{Formatter} \longrightarrow 	ext{Adapter} \longrightarrow 	ext{ViewModel} \longrightarrow 	ext{Screen}$$

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
* GM-UX-012 Basket

## 3. Пользовательские сценарии
Пользователь может:
* просмотреть итог корзины;
* выбрать способ получения товаров;
* выбрать доставку;
* выбрать самовывоз;
* выбрать адрес доставки;
* выбрать ориентировочное время;
* перейти к следующему этапу;
* вернуться в корзину.

## 4. Границы Stage 1
### Входит
* отображение итоговой стоимости;
* выбор способа получения;
* выбор адреса;
* выбор временного интервала;
* отображение информации по продавцам;
* переход к подтверждению покупки.

### Не входит
* создание заказа;
* онлайн-оплата;
* резервирование товара;
* трекинг доставки;
* чат с продавцом;
* промокоды;
* программы лояльности.

## 5. Архитектура
```text
src/
└── purchase-options/
    ├── domain/
    │   ├── PurchaseOptions.ts
    │   ├── DeliveryOption.ts
    │   ├── PickupOption.ts
    │   ├── SellerDelivery.ts
    │   └── PurchaseSummary.ts
    ├── runtime/
    │   └── PurchaseOptionsRuntime.ts
    ├── builder/
    │   └── PurchaseOptionsRuntimeBuilder.ts
    ├── formatting/
    │   └── PurchaseOptionsFormatter.ts
    ├── adapter/
    │   └── PurchaseOptionsAdapter.ts
    ├── navigation/
    │   └── PurchaseOptionsNavigation.ts
    ├── repository/
    │   └── PurchaseOptionsRepository.ts
    ├── viewmodel/
    │   └── PurchaseOptionsViewModel.ts
    ├── actions/
    │   └── PurchaseOptionsActions.ts
    ├── screen/
    │   └── PurchaseOptionsScreen.tsx
    ├── components/
    │   ├── PurchaseOptionsHeader.tsx
    │   ├── DeliveryMethodCard.tsx
    │   ├── PickupMethodCard.tsx
    │   ├── SellerGroupCard.tsx
    │   ├── AddressSelector.tsx
    │   ├── TimeSelector.tsx
    │   ├── PurchaseSummaryCard.tsx
    │   └── ContinueButton.tsx
    ├── hooks/
    │   └── usePurchaseOptions.ts
    └── tests/
        ├── runtime.test.ts
        ├── builder.test.ts
        ├── repository.test.ts
        ├── adapter.test.ts
        ├── formatter.test.ts
        └── screen.test.ts
```

## 6. Domain Model
### PurchaseOptions
Корневая модель экрана. Содержит:
* параметры покупки;
* выбранный способ получения;
* адрес;
* интервал доставки;
* итоговые расчёты.

### DeliveryOption
Описывает доставку.

### PickupOption
Описывает самовывоз.

### SellerDelivery
Содержит параметры получения товаров конкретного продавца.

### PurchaseSummary
Содержит:
* стоимость товаров;
* стоимость доставки;
* итоговую стоимость.

## 7. Runtime
Используется:
* `EntityRuntimeState<PurchaseOptions>`

Поддерживаются состояния:
* Empty
* Loading
* Ready
* Refreshing
* Error

*Runtime полностью независим от React.*

## 8. Repository Contract
Минимальный контракт:
* `getPurchaseOptions()`
* `selectDelivery()`
* `selectPickup()`
* `selectAddress()`
* `selectTime()`
* `refresh()`

Repository возвращает DTO.  
*Repository не содержит REST, SQL и бизнес-логики.*

## 9. Runtime Builder
Builder выполняет преобразование:
$$	ext{PurchaseOptionsDto} \longrightarrow 	ext{PurchaseOptions} \longrightarrow 	ext{Runtime}$$

Builder отвечает только за построение Runtime-модели.

## 10. Formatter
Formatter отвечает за отображение:
* стоимости;
* времени;
* адресов;
* способов доставки;
* итоговых расчётов.

Используются общие **Platform Formatters**.

## 11. Adapter
Adapter формирует ViewModel.  
*Например:*
* `today_18_20` $\longrightarrow$ `"Сегодня 18:00–20:00"`
* `pickup` $\longrightarrow$ `"Самовывоз"`

## 12. ViewModel
Содержит:
* `deliveryOptions`;
* `pickupOptions`;
* `selectedMethod`;
* `selectedAddress`;
* `selectedTime`;
* `sellerGroups`;
* `summary`;
* `loading`;
* `error`;
* `primaryActionEnabled`.

*ViewModel полностью готов к отображению.*

## 13. Screen
`PurchaseOptionsScreen` отображает исключительно ViewModel.  
**Не содержит:**
* Repository;
* Runtime;
* форматирования;
* бизнес-логики.

## 14. UI Components
* **PurchaseOptionsHeader** — Заголовок экрана.
* **DeliveryMethodCard** — Выбор доставки.
* **PickupMethodCard** — Выбор самовывоза.
* **SellerGroupCard** — Информация по продавцу.
* **AddressSelector** — Выбор адреса.
* **TimeSelector** — Выбор времени.
* **PurchaseSummaryCard** — Итог покупки.
* **ContinueButton** — Основная кнопка продолжения.

## 15. Action Catalog
Поддерживаются действия:
* `SELECT_DELIVERY`
* `SELECT_PICKUP`
* `SELECT_ADDRESS`
* `SELECT_TIME`
* `CONTINUE`
* `BACK`
* `REFRESH`
* `RETRY`

## 16. Navigation
Поддерживаются переходы:
* Basket $\longrightarrow$ Purchase Options
* Purchase Options $\longrightarrow$ Order Confirmation

Навигация осуществляется исключительно через **Platform Navigation Contract**.

## 17. Unit Tests
Обязательны тесты:
* Runtime;
* Builder;
* Repository;
* Formatter;
* Adapter;
* Navigation.

## 18. Integration Tests
Проверяются:
* загрузка параметров покупки;
* выбор доставки;
* выбор самовывоза;
* выбор адреса;
* выбор времени;
* отображение итоговой стоимости;
* переход к следующему этапу;
* восстановление после ошибки.

## 19. Definition of Done
Модуль считается завершённым, если:
* используется Platform Core;
* Runtime независим от React;
* Repository соответствует Platform Contracts;
* Formatter использует Platform Formatter;
* отсутствует бизнес-логика в UI;
* Navigation использует общий контракт;
* тесты проходят успешно;
* модуль не требует изменений Platform Core.

## 20. Архитектурное решение
Purchase Options является завершающим эталонным модулем Customer UI Stage 1. Он подтверждает, что Platform Core способен поддерживать сложные составные Runtime-модели, объединяющие данные корзины, продавцов, способов получения и итоговых расчётов без нарушения архитектурных принципов платформы. После реализации данного модуля архитектурный комплект Customer UI Stage 1 считается полностью сформированным.
