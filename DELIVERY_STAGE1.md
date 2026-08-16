# GreenMarket - Stage 1 Screen Delivery

Доработана стартовая React-страница Buyer MVP (`/`) в рамках Stage 1 и AI-first Engineering Process MVP v1.0.

Это не map-based "Главный экран" Customer UI из ТЗ-001/ТЗ-023. В тех документах главным рабочим пространством являются карта и Bottom Sheet; здесь изменена существующая точка входа Buyer MVP с каталогом и поиском.

## Результат

- hero-блок переписан без неподтвержденных продуктовых обещаний: нет утверждений про "100% свежее", фермерское происхождение, расстояние до продавца или "лучшее предложение";
- поиск товаров сохраняет переход в каталог с параметром `search`;
- адаптивная сетка категорий сохраняет переход в каталог с параметром `group_id`;
- блок быстрых переходов переименован из "Популярное" в "Больше товаров", потому что сортировка основана на `product_count`, а не на метрике популярности;
- визуал категории больше не зависит от индекса в API: иконка выбирается по содержанию категории через `categoryPresentation`;
- компонентный CSS `buyer_mvp.css` переведен на semantic/theme CSS tokens без прямых HEX/RGBA;
- типографический токен `fontFamily.display` приведен к DS-002: Inter/system stack без декоративного Fraunces;
- `/` больше не редиректится на `/catalog` через RuntimeRouteSync, поэтому HomeScreen реально доступен по заявленному маршруту;
- production API fallback больше не уходит молча на frontend origin: в production без `VITE_API_BASE` выбрасывается явная ошибка конфигурации;
- добавлены автоматические контрактные тесты HomeScreen presentation-логики.

## Скриншоты

### Desktop

![GreenMarket desktop](docs/screenshots/greenmarket-desktop.png)

### Mobile

![GreenMarket mobile](docs/screenshots/greenmarket-mobile.png)

## Процесс разработки

Полный Context Report, Task Decomposition Report, backlog, критерии приемки, Self Review, Knowledge Delta и Human Review Checklist находятся в [STAGE1_HOME_SCREEN_REPORT.md](docs/process/STAGE1_HOME_SCREEN_REPORT.md).

## Запуск

```bash
cd react-vite-bootstrap-project
npm install
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173/`.

## Проверки

- `npm test` - успешно, 5 контрактных проверок HomeScreen presentation-логики;
- `npm run lint` - успешно;
- `npm run build` - успешно;
- `buyer_mvp.css` - нет прямых HEX/RGBA в компонентном CSS;
- `fontFamily.display` - Inter/system stack, без декоративного шрифта;
- локальная browser QA: `/` открыт, 9 категорий, desktop 1440 и mobile 390 без горизонтального overflow;
- production build - успешно.

## Production API

`npm run build` подтверждает корректность production-сборки, но не равен проверке реального production runtime.

Для production deployment необходимо явно задать `VITE_API_BASE`. Если переменная не задана, приложение теперь показывает ошибку конфигурации Catalog API вместо неявного запроса на frontend origin. Отдельный production smoke-test должен подтвердить:

- deployment отдает HTML;
- `VITE_API_BASE` задан в окружении;
- `/groups` и ключевые запросы каталога доступны из production origin.

## Статус

Реализация обновлена по замечаниям и готова к Human Review заказчиком или назначенным ревьюером. Human Review Checklist намеренно не отмечается выполненным автором реализации.
## Review delta 2026-08-17

- `index.html`: Google Fonts now loads Inter only; Fraunces is not requested.
- Search has a token-based focus state via `.gm-buyer-search:focus-within`.
- `npm test` now runs the full Vitest suite; the narrow HomeScreen check is available as `npm run test:home`.
- Legacy Platform Core assert checks are registered as Vitest tests.
- `groupsWithMoreProducts()` is root-only, matching the main category grid semantics.
- Desktop/mobile screenshots were recaptured from the current code. Mobile 390 px and desktop 1440 px both had `scrollWidth === innerWidth`.
- Verification: `npm test` passed 6 files / 10 tests; `npm run lint` passed; `npm run build` passed.
