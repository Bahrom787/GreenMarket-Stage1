# CODE_INDEX.md

Индекс всех файлов .ts/.tsx репозитория (без `node_modules`): **187 файлов** (138 .ts + 49 .tsx), суммарно ~9 760 строк. Часть из них — копии (см. ниже), поэтому суммы по копиям не складываются в «уникальный» объём кода.

Репозиторий содержит **две копии** кода платформы:
- `greenmarket/GreenMarket/` — эталонная библиотека доменов (63 файла, 3174 строки) — разделы 1–11 ниже;
- `react-vite-bootstrap-project/src/platform-core/` — рабочая копия той же библиотеки внутри исполняемого приложения + домен Map и доп. файлы (75 файлов, 3910 строк) — раздел 12.

Счётчик строк в этом файле соответствует `(Get-Content ...).Count` (считает и пустые строки); это «сырой» подсчёт, из-за чего строки файлов могут не совпадать с тем, что показывает редактор без учёта пустых строк.

Источник — обход дерева + заголовочные комментарии каждого файла (не пересказ, а прямое чтение). Столбец «Слой» — по повторяющемуся паттерну Screen → Builder → Adapter → ViewModel, встречающемуся во всех 7 доменных модулях.

## Легенда паттерна модуля

Каждый из 7 доменов (basket, catalog, favorites, product_card, purchase_options, search, seller-card) состоит из одинакового набора ролей:
- ViewModel — доменный контракт экрана, «что реально отдаёт Backend/Platform Core», без знания о рендеринге.
- Adapter — единственное место, конвертирующее ViewModel → ContentBlock[], включает форматирование.
- Builder — тонкая обёртка, приводящая Adapter к общему интерфейсу ScreenBuilder.
- **Screen (.tsx)** — точка входа модуля, делегирует в ScreenDefinition из общей папки screens/.
- **ScreenDefinition (screens/*.ts)** — декларативное описание экрана (какой Builder, какие availableActions).

## 1. greenmarket/GreenMarket/ — корень модуля

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| BottomSheetDeclarative.tsx | 1193 | Screen (карточка продавца, самый крупный файл в репозитории) | Монолитный компонент Bottom Sheet для карточки продавца; ссылается на ТЗ-025, ТЗ-024, ТЗ-004 |
| adapters/SellerCardAdapter.ts | 88 | Adapter | SellerCardViewModel → ContentBlock[]; помечен как «SellerCardBuilder из ТЗ-027 §5» |
| viewmodels/SellerCardViewModel.ts | 43 | ViewModel | Доменный контракт карточки продавца; содержит запись «АРХИТЕКТУРНОЕ РЕШЕНИЕ (2026-07-10): Вариант А», ссылается на ТЗ-025 §12, ТЗ-027 |
| builders/SellerCardBuilder.ts | 12 | Builder | Обёртка Adapter → ScreenBuilder |
| builders/ScreenBuilder.ts | 8 | Builder (общий интерфейс) | Общий контракт ScreenBuilder, используемый всеми доменами |
| builders/PurchaseOptionsBuilder.ts | 12 | Builder | Обёртка для purchase_options |

## 2. basket/ (корзина)

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| BasketScreen.tsx | 12 | Screen | Делегирует в screens/BasketScreen.ts |
| adapters/BasketAdapter.ts | 58 | Adapter | Только преобразование модели/форматирование; явно не пересчитывает суммы, не сортирует |
| builders/BasketBuilder.ts | 12 | Builder | — |
| viewmodels/BasketViewModel.ts | 40 | ViewModel | Ссылается на «ТЗ-037 §3» — файла ТЗ-037 в репозитории нет |

## 3. catalog/ (каталог)

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| CatalogScreen.tsx | 12 | Screen | — |
| adapters/CatalogAdapter.ts | 69 | Adapter | Форматирование через общие Formatter'ы |
| builders/CatalogBuilder.ts | 12 | Builder | — |
| viewmodels/CatalogViewModel.ts | 46 | ViewModel | Ссылается на «ТЗ-036 §5» — файла ТЗ-036 в репозитории нет |

## 4. favorites/ (избранное)

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| FavoritesScreen.tsx | 9 | Screen | — |
| adapters/FavoritesAdapter.ts | 43 | Adapter | — |
| builders/FavoritesBuilder.ts | 12 | Builder | — |
| viewmodels/FavoritesViewModel.ts | 35 | ViewModel | Ссылается на «ТЗ-038 §5» — файла ТЗ-038 в репозитории нет |

## 5. product_card/ (карточка товара)

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| ProductCardScreen.tsx | 18 | Screen | Комментарий: «раньше здесь была функция buildProductCardViewModel()» — след рефакторинга |
| adapters/ProductCardAdapter.ts | 29 | Adapter | — |
| builders/ProductCardBuilder.ts | 12 | Builder | — |
| viewmodels/ProductCardViewModel.ts | 19 | ViewModel | Явных ссылок на номер ТЗ не найдено |

## 6. purchase_options/ (варианты покупки) — единственный домен с доп. подслоем Presentation

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| PurchaseOptionsScreen.tsx | 23 | Screen | Компонует header/toolbar/availableActions |
| adapters/PurchaseOptionsAdapter.ts | 98 | Adapter | Самый крупный Adapter в репозитории |
| presentation/PurchaseOptionsPresentation.ts | 34 | Presentation (уникальный подслой) | Domain-модели → структурированные VM (PriceVm/RatingVm/SubtitleParts), без строк/локали |
| formatting/Formatters.ts | 24 | Formatting | Локаль, символы, разделители (⭐, ·, ₽) |
| viewmodels/PurchaseOptionsViewModel.ts | 55 | ViewModel | Ссылается на ТЗ-015, ТЗ-002 (реальные, существующие документы) |

## 7. search/ (поиск)

| Файл | Строк | Слой | Назначение |
|---|---|---|---|
| SearchScreen.tsx | 14 | Screen | Комментарий фиксирует историю переноса: ScreenDefinition раньше лежал в search/screens/, перенесён в общий screens/ |
| adapters/SearchAdapter.ts | 57 | Adapter | Не выполняет сам поиск — только форматирование |
| builders/SearchBuilder.ts | 12 | Builder | — |
| viewmodels/SearchViewModel.ts | 30 | ViewModel | Ссылается на «ТЗ-035 §5» — файла ТЗ-035 в репозитории нет |

## 8. screens/ — общий слой ScreenDefinition (8 файлов, «плоская» папка параллельно модулям)

| Файл | Строк | Назначение |
|---|---|---|
| ScreenDefinition.ts | 16 | Базовый тип: builder + availableActions |
| BasketScreen.ts | 18 | Ссылается на «ТЗ-037 §3» — отклонённое предложение локальной папки basket/screens/ |
| CatalogScreen.ts | 21 | Ссылается на «ТЗ-036 §3/§13» — тоже отклонённая локальная папка; добавляет SELECT_CATEGORY/REFRESH_CATALOG, которых не было в Action Catalog дословно |
| FavoritesScreen.ts | 11 | Комментарий: «та же схема, что уже трижды отклонялась» |
| ProductCardScreen.ts | 8 | — |
| PurchaseOptionsScreen.ts | 38 | — |
| SearchScreen.ts | 13 | Перенесён из search/screens/SearchScreenDefinition.ts (локальная папка удалена архитектурным решением) |
| SellerCardScreen.ts | 31 | Список действий взят из фактически используемых в BottomSheetDeclarative.tsx |

Наблюдение: минимум 4 раза в комментариях зафиксирован один и тот же архитектурный спор — очередное ТЗ просит локальную папку <модуль>/screens/, решение раз за разом её отклоняет в пользу общей screens/. Это признак повторяющегося рассинхрона между тем, что требуют внешние ТЗ (в т.ч. отсутствующие в репозитории ТЗ-036/037), и тем, что реально принято в кодовой базе.

## 9. contracts/ (5 файлов) — общие типы, без слоя

| Файл | Строк | Назначение |
|---|---|---|
| Action.ts | 60 | Строковые id как branded types (защита от подмены productId/sellerId) |
| ContentBlock.ts | 74 | Discriminated union примитивов разметки Bottom Sheet |
| DomainTypes.ts | 34 | Общие доменные типы (напр. категория, используемая Search/Filters/Favorites/SellerCard/PurchaseOptions) |
| LoadState.ts | 5 | loading / error / ready |
| ViewState.ts | 5 | Расширение LoadState: добавляет Idle/Empty |

## 10. formatting/ и presentation/ (8 файлов) — общие для всех модулей

| Файл | Строк |
|---|---|
| formatting/DistanceFormatter.ts | 7 |
| formatting/PriceFormatter.ts | 7 |
| formatting/RatingFormatter.ts | 7 |
| formatting/SubtitleFormatter.ts | 7 |
| presentation/DistanceVm.ts | 3 |
| presentation/PriceVm.ts | 5 |
| presentation/RatingVm.ts | 4 |
| presentation/SubtitleParts.ts | 3 |

## 11. navigation-runtime-layer/ — отдельный runtime-слой (11 файлов, единственное место с тестами вне react-vite)

> Тесты есть также в рабочей копии этого слоя: `react-vite-bootstrap-project/src/platform-core/navigation-runtime-layer/` (2 файла). В остальном коде приложения автотестов нет.

| Файл | Строк | Назначение |
|---|---|---|
| runtime/GreenMarketRuntime.ts | 133 | Крупнейший файл слоя; ссылается на ТЗ-022 |
| runtime/__tests__/GreenMarketRuntime.test.ts | 65 | Тест на node:assert, запуск npx tsx |
| navigation/NavigationStack.ts | 95 | Типизированный стек экранов; заменяет локальный стек, ранее живший в BottomSheetDeclarative.tsx |
| navigation/__tests__/NavigationStack.test.ts | 38 | — |
| navigation/ScreenRegistry.ts | 44 | Ссылается на ТЗ-018 |
| hooks/useGreenMarketRuntime.ts | 82 | React-хук поверх Runtime; ссылается на ТЗ-022 |
| domain/catalog/SellerProductPhotoRepository.ts | 19 | Ссылается на GM-DOM-002 §8 — файла GM-DOM-002.md в репозитории нет |
| domain/catalog/MockSellerProductPhotoRepository.ts | 48 | Ссылается на GM-DOM-003 §4/§10 — файла нет |
| domain/catalog/models/SellerProductPhoto.ts | 31 | Дополнение к GM-DOM-001 §5 — файла нет |
| domain/catalog/__tests__/DomainModels.test.ts | 66 | Проверяет форму моделей по GM-DOM-001 §5.1–5.5 — файла нет |
| domain/catalog/__tests__/MockSellerProductPhotoRepository.test.ts | 35 | — |

Тесты (вне react-vite — единственная работоспособная проверка в репозитории) запускаются вручную через npx tsx, без jest/vitest-конфигурации и без CI.

## 12. react-vite-bootstrap-project/ — исполняемое приложение Stage 1 (123 файла .ts/.tsx в src/, 6554 строки)

Приложение-сборка (React 18 + Vite 5 + TypeScript strict, запуск `greenmarket-server.bat start`). Код разделён на инфраструктуру приложения и рабочую копию платформы.

### 12.1 src/app/ — App Shell (4 файла, 235 строк)

| Файл | Строк | Назначение |
|---|---|---|
| App.tsx | 29 | Композиция: ErrorBoundary → ThemeProvider → GreenMarketRuntimeProvider → Router → Screen |
| ErrorBoundary.tsx | 36 | Фолбэк при ошибке рендера |
| NavigationContainer.tsx | 76 | Маршруты роутера: `/` Главная, `/catalog`, `/product/:productId`, `/map`, `/cart`, `/profile` и заглушки |
| RuntimeRouteSync.tsx | 94 | Синхронизация React Router и runtime-стека навигации |

### 12.2 src/buyer_mvp/ — Buyer MVP Stage 1 (12 файлов .ts/.tsx, 648 строк; контракт — Catalog API)

Единственный функционально реализованный продуктовый сценарий. Экраны: Главная (дерево категорий + поиск), Каталог (список, сортировка, пагинация, фильтр), Карточка товара (офферы продавцов, лента фото). Именно эти экраны описывает `tests_folder/TZ_TESTING_BUYER_MVP.md`.

| Файл | Строк | Назначение |
|---|---|---|
| types.ts | 71 | Контракт Catalog API: ProductGroup, ProductListItem, ProductDetail, SellerOffer, CatalogQuery |
| api.ts | 64 | HTTP-клиент к `/catalog/groups`, `/catalog/products`, `/catalog/products/{id}` |
| format.ts | 25 | Форматирование цены/счётчиков (Decimal приходит строкой) |
| screens/HomeScreen.tsx | 77 | Главная: дерево категорий, поиск |
| screens/CatalogScreen.tsx | 123 | Каталог: список, сортировка, пагинация, состояния Loading/Empty/Error |
| screens/ProductScreen.tsx | 82 | Карточка товара: офферы, лента фото |
| components/CategoryTree.tsx | 40 | Дерево категорий |
| components/OfferCard.tsx | 37 | Оффер продавца |
| components/PhotoStrip.tsx | 42 | Лента фотографий оффера (0/1/N, см. регресс в TZ_TESTING_BUYER_MVP) |
| components/PhotoPlaceholder.tsx | 12 | Плейсхолдер фото |
| components/ProductCard.tsx | 42 | Карточка товара в списке |
| components/SearchBar.tsx | 33 | Поле поиска |

### 12.3 src/platform-core/ — рабочая копия greenmarket/GreenMarket/ + новые модули (75 файлов .ts/.tsx, 3910 строк)

Повторяет всю структуру разделов 1–10 (домены basket, catalog, favorites, product_card, purchase_options, search, seller_card; contracts; screens; formatting/presentation; BottomSheetDeclarative.tsx) и добавляет то, чего в `greenmarket/` нет:

| Файл | Строк | Назначение |
|---|---|---|
| map/ (12 файлов, 746 строк) | — | **Домен Map** (ссылается на IMP-003.1 / IMP-003.1.1 / IMP-003.1.2 / AR-003 — документов нет): MapRuntime (147), LeafletAdapter (145), MockSellerRepository (115), GeoService (93), MapSheetAdapter (62), MapViewModel (52), MapConfig (33), MapAdapterTypes (29), SellerRepository (25), TileProvider (22), MapBuilder (12), MapAdapter (11) |
| contracts/BusinessEvent.ts | 17 | Тип бизнес-событий (вынесен из BottomSheetDeclarative.tsx) |
| diagnostics/Diagnostics.ts | 43 | Логирование по IMP-003.1.2 §14 |
| screens/MapScreen.ts | 26 | ScreenDefinition экрана Map (12 действий из IMP-003.1 §9) |
| screens/SellerCatalogScreen.ts | 20 | ПАТЧ при интеграции Map (импорт каталога продавца в навигацию) |
| screens/SellerListScreen.ts | 24 | Заглушка Seller List (не входит в объём IMP-003.1) |
| navigation-runtime-layer/ (6 файлов) | 500 | Копия runtime-слоя из раздела 11: GreenMarketRuntime (155), NavigationStack (103), useGreenMarketRuntime (91), ScreenRegistry (48), + 2 теста (65 + 38) |

Сверка копий: `BottomSheetDeclarative.tsx`, `viewmodels/SellerCardViewModel.ts`, `purchase_options/*` идентичны оригиналам в `greenmarket/`; `contracts/Action.ts`, `screens/CatalogScreen.ts`, `runtime/GreenMarketRuntime.ts` и др. разошлись (проверено хэшированием).

### 12.4 src/design-system/, containers/, layout/, screens/, repositories/, mocks/ — реализация UI (32 файла .ts/.tsx)

| Подсистема | Файлов | Строк | Назначение |
|---|---|---|---|
| design-system/ | 16 | 942 | Реализация Design System: tokens/ (colors 140, typography 102, scales 79), ThemeProvider/ThemeContext/useTheme, компоненты (Button 84, Text 80, Overlays 82, Avatar 76, ListItem 69, Surface 67, States 37, Loader 15) |
| containers/ | 5 | 130 | BottomSheet (32), Modal (38), Overlay (41), Snackbar (10), index |
| layout/ | 3 | 196 | Flex (120), Structure (71), index |
| screens/ (вне platform-core) | 4 | 477 | MapScreenView (302 — реализация экрана Map), MapBottomSheetContent (92), MapLocationButton (64), PlaceholderScreen (19) |
| repositories/ | 1 | 3 | index.ts (заглушка резерва под репозитории) |
| mocks/ | 1 | 2 | index.ts (заглушка резерва под тестовую инфраструктуру) |
| прочее | 2 | 11 | main.tsx (10), vite-env.d.ts (1) |

## Сводка по расхождениям код ↔ документация (детали в TRACEABILITY.md)

Код ссылается на разделы (§N) следующих документов, отсутствующих как файлы в этом архиве: ТЗ-027, ТЗ-035, ТЗ-036, ТЗ-037, ТЗ-038, GM-DOM-001, GM-DOM-002, GM-DOM-003, а также (только в `react-vite-bootstrap-project/src/platform-core/`) IMP-003.1, IMP-003.1.1, IMP-003.1.2, AR-003. Все ссылки на ТЗ-022, ТЗ-025, ТЗ-018, ТЗ-015, ТЗ-002, ТЗ-004, ТЗ-024 и GM-UX-001…013 — подтверждены существующими файлами.
