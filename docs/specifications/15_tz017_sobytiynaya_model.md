# ТЗ-017. Событийная модель GreenMarket

Источник: https://chatgpt.com/s/t_6a4e34ddf29881919add7b0ed0b6977a

**Версия:** 1.0
**Статус:** Draft
**Последнее обновление:** 2026-07-08

**Вводная реплика чата:** теперь мы подошли к документу, который свяжет GreenMarket с Platform Core естественным образом. Не API. Не БД. А бизнес-события. Именно их потом Platform Core сможет превращать в Events, независимо от того, пришли они от UI, голоса или другого канала.

**Связанные документы**
- ТЗ-018 — Action Catalog
- ТЗ-020 — Business Rules
- ТЗ-022 — Подготовка к FSM Engine

**Зависимости**
Зависит от: ТЗ-014, ТЗ-016
Используется в: ТЗ-018, ТЗ-020, ТЗ-022

## Назначение

Настоящий документ определяет полный перечень бизнес-событий GreenMarket.

Бизнес-события описывают изменения предметной области и являются независимыми от пользовательского интерфейса, базы данных и способа взаимодействия.

## Основной принцип

Событие описывает то, что произошло, а не что нужно сделать.

Правильно: `BasketUpdated`, `PurchaseStarted`, `StockChanged`.

Неправильно: `RefreshMap`, `ReloadCatalog`, `UpdateBottomSheet` — это относится к реализации интерфейса.

## Группа 1. Покупатель

- `CustomerOpenedApplication` — пользователь открыл приложение.
- `PurchaseIntentCreated` — сформировано намерение покупки.
- `PurchaseIntentChanged` — изменилось содержимое текущей покупки (причины: изменение корзины; изменение домашних запасов; добавление товара; удаление товара).
- `PurchaseStarted` — пользователь начал выполнение покупки.
- `PurchaseCompleted` — покупка завершена.

## Группа 2. Корзины

- `BasketSelected` — выбрана корзина.
- `BasketChanged` — изменено содержимое корзины.
- `BasketSaved` — корзина сохранена.
- `BasketCreated` — создана новая корзина.

## Группа 3. Домашние запасы

- `HomeInventoryChanged` — изменились домашние запасы.
- `ProductMarkedAsAvailableAtHome` — товар отмечен как имеющийся дома.
- `ProductRemovedFromHomeInventory` — товар удалён из домашних запасов.

## Группа 4. Поиск

- `SearchStarted` — начат поиск.
- `SearchCompleted` — поиск завершён.
- `ProductAddedToPurchase` — товар добавлен в покупку.
- `ProductRemovedFromPurchase` — товар удалён из покупки.

## Группа 5. Optimizer

- `PurchaseOptimizationStarted` — начат подбор вариантов.
- `PurchaseOptionsCalculated` — варианты рассчитаны.
- `PurchaseOptionSelected` — пользователь выбрал вариант покупки.

## Группа 6. Карта

- `MapMoved` — изменена область просмотра.
- `MapZoomChanged` — изменён масштаб.
- `SellerSelected` — выбран продавец.
- `ProductSelected` — выбран товар.

## Группа 7. Каталог

- `CatalogImported` — импортирован каталог.
- `CatalogUpdated` — каталог обновлён.
- `StockChanged` — изменились остатки.
- `PriceChanged` — изменилась цена.

## Группа 8. Обратная связь покупателей

- `ProductUnavailableReported` — покупатель сообщил об отсутствии товара.
- `PriceCorrectionReported` — сообщено об изменении цены.
- `ProductQualityReported` — сообщено об изменении качества.
- `ProductPhotoUploaded` — добавлена новая фотография.

## Группа 9. Доверие к данным

- `InformationConfirmed` — информация подтверждена.
- `InformationRejected` — информация признана недостоверной.
- `TrustLevelChanged` — изменился уровень доверия.

## Очень важное правило

События GreenMarket не являются событиями Platform Core. Например, `PurchaseIntentChanged` — это бизнес-событие, а `InteractionCompleted` — событие Platform Core. Platform Core не обязана знать, что такое Purchase Intent. Она только доставляет действие и событие.

## Требование совместимости с будущим FSM Engine

> Добавлено по правкам из [`21_prompt_fsm_engine_sovmestimost.md`](21_prompt_fsm_engine_sovmestimost.md) / ТЗ-022.

Business Events являются фактами предметной области.

После внедрения FSM Engine состав и смысл Business Events должны сохраниться.

FSM Engine становится ещё одним источником этих событий, но не изменяет их семантику.

---

**Комментарий из чата (переход к следующему документу):** следующий документ — **ТЗ-018. Каталог действий GreenMarket**. Это другая сторона медали: если события отвечают на вопрос «Что произошло?», то действия отвечают «Что пользователь хочет сделать?» Например: `OpenBasket`, `SelectBasket`, `AddProduct`, `RemoveProduct`, `StartPurchaseOptimization`, `SelectPurchaseOption`, `OpenSeller`, `OpenProduct`, `ConfirmAvailability`, `ReportMissingProduct`. Именно эти действия потом практически один к одному станут Action в Platform Core.

Начиная с каталога Actions и Business Events, документы становятся одновременно продуктовой спецификацией GreenMarket и спецификацией интеграции с Platform Core — мост между платформой и коммерческим приложением.

---

**Основной читатель**
- ★★☆☆☆ Product Owner
- ★☆☆☆☆ UX Designer
- ★★★☆☆ React Developer
- ★★★★★ Backend Developer
- ★★★☆☆ QA

**Статус готовности**
- ☑️ Концепция завершена
- ☐ UX полностью описан
- ☐ Все состояния описаны
- ☐ Все ошибки описаны
- ☐ Проверено разработчиком
- ☐ Проверено тестировщиком
