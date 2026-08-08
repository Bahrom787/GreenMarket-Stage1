# GM-UX-010. Seller Card — Technical Specification (Stage 1)

**Идентификатор:** GM-UX-010  
**Статус:** Approved  
**Версия:** 1.0  
**Этап:** Stage 1  

---

## 1. Назначение
Экран Seller Card предназначен для отображения информации о продавце и является основной точкой взаимодействия покупателя с конкретным участником маркетплейса.  
Экран не содержит функций оформления заказа и не изменяет состояние корзины. Его задача — помочь покупателю принять решение о выборе продавца и перейти к просмотру его ассортимента.

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

## 3. Пользовательский сценарий
Основные точки входа:
* переход из Product Card;
* переход с карты;
* переход из списка продавцов;
* переход из результатов поиска.

После открытия пользователь получает полную информацию о продавце и может перейти в каталог данного продавца.

## 4. Границы реализации Stage 1
### Входит
* информация о продавце;
* фотографии;
* логотип;
* описание;
* адрес;
* расположение на карте;
* часы работы;
* рейтинг (если доступен);
* количество товаров;
* кнопка *Открыть каталог*;
* кнопка *Показать на карте*.

### Не входит
* оформление заказа;
* чат;
* отзывы покупателей;
* подписка;
* акции;
* рекомендации;
* история заказов.

## 5. Архитектура
Структура полностью повторяет Product Card:

```text
src/
└── seller-card/
    ├── domain/
    │   ├── Seller.ts
    │   ├── SellerLocation.ts
    │   └── SellerWorkingHours.ts
    ├── runtime/
    │   └── SellerCardRuntime.ts
    ├── builder/
    │   └── SellerCardBuilder.ts
    ├── formatting/
    │   └── SellerCardFormatter.ts
    ├── adapter/
    │   └── SellerCardAdapter.ts
    ├── navigation/
    │   └── SellerCardNavigation.ts
    ├── repository/
    │   └── SellerRepository.ts
    ├── viewmodel/
    │   └── SellerCardViewModel.ts
    ├── actions/
    │   └── SellerCardActions.ts
    ├── screen/
    │   └── SellerCardScreen.tsx
    ├── components/
    │   ├── SellerHeader.tsx
    │   ├── SellerGallery.tsx
    │   ├── SellerInfo.tsx
    │   ├── SellerContacts.tsx
    │   ├── SellerWorkingHours.tsx
    │   ├── SellerStatistics.tsx
    │   └── SellerActions.tsx
    ├── hooks/
    │   └── useSellerCard.ts
    └── tests/
        ├── runtime.test.ts
        ├── builder.test.ts
        ├── adapter.test.ts
        ├── repository.test.ts
        └── screen.test.ts
```

## 6. Domain Model
Основной объект:
* `Seller`

Дополнительные модели:
* `SellerLocation`
* `SellerWorkingHours`

*Все модели импортируются из Platform Core либо из общего Domain Layer.*

## 7. Runtime
Поддерживаются состояния:
* Loading
* Ready
* Refreshing
* Error

*Runtime содержит только состояние экрана и не зависит от React.*

## 8. Repository Contract
Экран получает данные только через Repository.  
Минимальный контракт:
* `getSeller(sellerId)`
* `refreshSeller(sellerId)`

**Запрещается использование:** REST, SQL, `fetch()`, `axios`, прямых HTTP-вызовов.

## 9. Builder
Builder преобразует Domain Model в Runtime.  
Builder:
* не знает о React;
* не форматирует данные;
* не выполняет навигацию.

## 10. Formatter
Formatter отвечает за отображение:
* адреса;
* часов работы;
* расстояния;
* рейтинга;
* количества товаров.

*Все правила форматирования должны быть совместимы с Platform Core.*

## 11. Adapter
Adapter преобразует Runtime в ViewModel.  
Примеры:
* `true` $\rightarrow$ `Open now`
* `2.3 km` $\rightarrow$ `2.3 km away`

## 12. ViewModel
ViewModel содержит только данные, необходимые UI.  
Минимальный состав:
* `sellerName`
* `logo`
* `gallery`
* `description`
* `addressText`
* `workingHoursText`
* `distanceText`
* `ratingText`
* `productsCountText`
* `openNow`
* `canOpenCatalog`
* `canShowOnMap`

## 13. Экран
Screen отвечает исключительно за отображение ViewModel.  
**Запрещается:** бизнес-логика, вычисления, форматирование, обращения к Repository.

## 14. UI Components
* **SellerHeader**: Логотип, название, краткое описание.
* **SellerGallery**: Фотографии магазина.
* **SellerInfo**: Описание, категория, дополнительная информация.
* **SellerContacts**: Адрес, телефон (если доступен).
* **SellerWorkingHours**: График работы, статус «Открыт / Закрыт».
* **SellerStatistics**: Количество товаров, рейтинг, расстояние.
* **SellerActions**: Кнопки *Open Catalog*, *Show on Map*, *Back*.

## 15. Action Catalog
Используются только публичные действия:
* `OPEN_CATALOG`
* `SHOW_MAP`
* `REFRESH`
* `BACK`
* `RETRY`

## 16. Navigation
Экран должен поддерживать переходы:
* Product Card $\rightarrow$ Seller Card $\rightarrow$ Seller Catalog
* Seller Card $\rightarrow$ Map

*Навигация выполняется только через Navigation Contract.*

## 17. Unit Tests
Обязательны тесты: Runtime, Repository, Builder, Adapter, Formatter, Navigation.

## 18. Integration Tests
Проверяются сценарии:
* открытие Seller Card из Product Card;
* открытие Seller Card с карты;
* переход в каталог продавца;
* возврат назад;
* обновление данных продавца;
* обработка ошибки загрузки.

## 19. Definition of Done
Модуль считается завершённым, если:
* реализованы все архитектурные слои;
* отсутствует бизнес-логика в UI;
* используется Repository Contract;
* Runtime не зависит от React;
* Formatter выделен в отдельный слой;
* Navigation использует общий контракт;
* все тесты проходят успешно;
* структура соответствует эталонной реализации Product Card.

## 20. Архитектурное решение
Seller Card является вторым эталонным модулем Customer UI Stage 1. Его реализация должна подтвердить, что архитектура **Domain $\rightarrow$ Runtime $\rightarrow$ Builder $\rightarrow$ Formatter $\rightarrow$ Adapter $\rightarrow$ ViewModel $\rightarrow$ Screen** универсальна и может использоваться для всех экранов платформы без изменения базовых принципов Platform Core.
