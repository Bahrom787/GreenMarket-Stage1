# GM-UX-011. Search — Technical Specification (Stage 1)

**Идентификатор:** GM-UX-011  
**Статус:** Approved  
**Версия:** 1.0  

---

## 1. Назначение
Экран **Search** предназначен для глобального поиска товаров и продавцов GreenMarket.  
Search является самостоятельным модулем Customer UI и использует общую архитектуру Platform Core.

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

## 3. Пользовательские сценарии
Пользователь может:
* искать товар по названию;
* искать продавца по названию;
* искать по категории;
* открывать Product Card;
* открывать Seller Card;
* возвращаться назад.

## 4. Границы Stage 1
### Входит
* строка поиска;
* результаты товаров;
* результаты продавцов;
* фильтрация по категории;
* сортировка;
* пагинация;
* состояние "ничего не найдено";
* повтор поиска.

### Не входит
* голосовой поиск;
* поиск по фотографии;
* история поиска;
* подсказки;
* рекомендации;
* машинное обучение.

## 5. Архитектура
```text
src/
└── search/
    ├── domain/
    │   ├── SearchQuery.ts
    │   ├── SearchResult.ts
    │   ├── ProductSearchItem.ts
    │   └── SellerSearchItem.ts
    ├── runtime/
    │   └── SearchRuntime.ts
    ├── builder/
    │   └── SearchRuntimeBuilder.ts
    ├── formatting/
    │   └── SearchFormatter.ts
    ├── adapter/
    │   └── SearchAdapter.ts
    ├── navigation/
    │   └── SearchNavigation.ts
    ├── repository/
    │   └── SearchRepository.ts
    ├── viewmodel/
    │   └── SearchViewModel.ts
    ├── actions/
    │   └── SearchActions.ts
    ├── screen/
    │   └── SearchScreen.tsx
    ├── components/
    │   ├── SearchBar.tsx
    │   ├── SearchFilters.tsx
    │   ├── SearchResults.tsx
    │   ├── ProductResultCard.tsx
    │   ├── SellerResultCard.tsx
    │   ├── EmptySearch.tsx
    │   └── SearchLoading.tsx
    ├── hooks/
    │   └── useSearch.ts
    └── tests/
        ├── runtime.test.ts
        ├── builder.test.ts
        ├── adapter.test.ts
        ├── repository.test.ts
        ├── formatter.test.ts
        └── screen.test.ts
```

## 6. Domain Model
Основные модели:
* `SearchQuery`
* `SearchResult`
* `ProductSearchItem`
* `SellerSearchItem`

`SearchResult` содержит две коллекции:
1. товары;
2. продавцы.

## 7. Runtime
Search использует:
* `CollectionRuntimeState<SearchResult>`

Поддерживаются состояния:
* Empty
* Loading
* Ready
* Refreshing
* Error

*Runtime полностью независим от React.*

## 8. Repository Contract
Минимальный контракт:
* `search(query)`
* `searchProducts(query)`
* `searchSellers(query)`
* `refresh(query)`

Repository возвращает DTO.

**Запрещается использование:**
* REST;
* SQL;
* `fetch()`;
* `axios`;
* прямых HTTP-вызовов.

## 9. Builder
Builder выполняет преобразование:
$$	ext{SearchDto} \longrightarrow 	ext{Domain Model} \longrightarrow 	ext{CollectionRuntimeState}$$

Builder не знает про:
* React;
* ViewModel;
* форматирование.

## 10. Formatter
Formatter отвечает за отображение:
* цены;
* расстояния;
* количества найденных элементов;
* единиц измерения;
* рейтинга.

Используются общие **Platform Formatters**.

## 11. Adapter
Adapter строит ViewModel.  
*Например:*
* `25 results` $\longrightarrow$ `"25 products found"`
* `0` $\longrightarrow$ `"No products found"`

## 12. ViewModel
Минимальный состав:
* `searchText`
* `products`
* `sellers`
* `filters`
* `sorting`
* `totalProducts`
* `totalSellers`
* `totalResults`
* `loading`
* `emptyState`
* `error`

*ViewModel полностью готов к отображению.*

## 13. Screen
Screen только отображает ViewModel.  
**Не содержит:**
* Repository;
* Runtime;
* SQL;
* форматирования;
* бизнес-логики.

## 14. UI Components
* **SearchBar** — Строка поиска.
* **SearchFilters** — Категории.
* **SearchResults** — Список результатов.
* **ProductResultCard** — Карточка найденного товара.
* **SellerResultCard** — Карточка найденного продавца.
* **EmptySearch** — Экран отсутствия результатов.
* **SearchLoading** — Скелетон загрузки.

## 15. Action Catalog
Используются действия:
* `SEARCH`
* `CLEAR_SEARCH`
* `SELECT_PRODUCT`
* `SELECT_SELLER`
* `CHANGE_FILTER`
* `CHANGE_SORT`
* `LOAD_NEXT_PAGE`
* `REFRESH`
* `BACK`
* `RETRY`

## 16. Navigation
Поддерживаются переходы:
* Search $\longrightarrow$ Product Card
* Search $\longrightarrow$ Seller Card
* Search $\longrightarrow$ Catalog

Навигация осуществляется только через общий **Navigation Contract Platform Core**.

## 17. Unit Tests
Обязательны тесты:
* Runtime;
* Builder;
* Formatter;
* Adapter;
* Repository;
* Navigation.

## 18. Integration Tests
Проверяются:
* поиск товара;
* поиск продавца;
* фильтрация;
* сортировка;
* пагинация;
* отсутствие результатов;
* открытие Product Card;
* открытие Seller Card;
* повтор поиска после ошибки.

## 19. Definition of Done
Модуль считается завершённым, если:
* используется `CollectionRuntimeState`;
* Runtime независим от React;
* Repository соответствует Platform Contracts;
* Formatter использует Platform Core;
* отсутствует бизнес-логика в UI;
* Navigation использует общий контракт;
* тесты успешно проходят;
* модуль не требует изменений Platform Core.

## 20. Архитектурное решение
Search является третьим эталонным модулем Customer UI Stage 1 и первой реализацией, использующей `CollectionRuntimeState`. Его задача — подтвердить, что Platform Core одинаково хорошо поддерживает работу как с отдельными сущностями (Product Card, Seller Card), так и с коллекциями данных, включая поиск, фильтрацию, сортировку и пагинацию, без изменения базовой архитектуры платформы.
