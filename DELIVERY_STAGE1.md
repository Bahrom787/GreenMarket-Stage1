# GreenMarket — Stage 1 Screen Delivery

Доработан главный экран покупателя GreenMarket в рамках Stage 1 и AI-first Engineering Process MVP v1.0.

## Результат

- новый hero-блок с продуктовым позиционированием;
- поиск товаров с переходом в каталог;
- адаптивная сетка категорий;
- быстрые популярные запросы;
- обновлённая desktop/mobile навигация;
- исправленный контраст светлой и тёмной темы;
- сохранённые loading/error-состояния;
- отсутствие изменений Domain Model, Repository Contract и Platform Core.

## Скриншоты

### Desktop

![GreenMarket desktop](docs/screenshots/greenmarket-desktop.png)

### Mobile

![GreenMarket mobile](docs/screenshots/greenmarket-mobile.png)

## Процесс разработки

Полный Context Report, Task Decomposition Report, backlog, критерии приёмки, Self Review, Knowledge Delta и Human Review Checklist находятся в [STAGE1_HOME_SCREEN_REPORT.md](docs/process/STAGE1_HOME_SCREEN_REPORT.md).

## Запуск

```bash
cd react-vite-bootstrap-project
npm install
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173/`.

## Проверки

- `npm run build` — успешно;
- `npm run lint` — успешно;
- production smoke-test — HTTP 200;
- Catalog API — доступен;
- каталог — 9 товаров;
- поиск «молоко» — 1 результат;
- desktop/mobile screenshots — приложены.

## Статус

Реализация завершена и готова к Human Review заказчиком.
