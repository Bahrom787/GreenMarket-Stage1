# Stage 1 - доработка стартовой страницы Buyer MVP

> Терминологическое уточнение: в этом отчете описана React-страница `/`
> (`buyer_mvp/screens/HomeScreen.tsx`). Это не "Главный экран" Customer UI
> из ТЗ-001/ТЗ-023, где главным рабочим пространством являются карта и
> Bottom Sheet.

## Классификация

L1: изменяется существующая React-страница и ее визуальное поведение. Доменная модель, Repository Contract и Runtime Platform Core не расширяются. Дополнительно исправлена локальная реализация Design System tokens для соответствия DS-002 Typography.

## Context Report

1. Стартовая страница Buyer MVP должна оставаться входом в каталог и поиск, не подменяя map-based Main Screen из ТЗ-001/ТЗ-023.
2. Доступные данные: `ProductGroup`, Catalog API, React Router, существующие CSS tokens.
3. На странице нельзя заявлять факты, которых нет в данных API: геолокация, расстояние до продавца, фермерское происхождение, свежесть, лучший оффер.
4. Релевантные нормативные документы для проверки: DS-001, DS-002 Color, DS-002 Typography, ТЗ-026 protocol review и ограничения Platform Core.
5. Production build и production API connectivity являются разными проверками.

## Task Decomposition Report

### Реализовано

- HOME-001: hero и поисковый сценарий сохранены, тексты приведены к фактическим возможностям Stage 1.
- HOME-002: корневые категории отображаются адаптивной сеткой и ведут в `/catalog?group_id=...`.
- HOME-003: быстрые переходы переименованы в "Больше товаров", так как основаны на `product_count`.
- HOME-004: loading/error состояния сохранены.
- HOME-005: добавлены контрактные тесты и пройдены build/lint.
- HOME-006: цвет и типографика приведены к DS-002 на уровне компонентного CSS и tokens.
- HOME-007: production API contract сделан явным через обязательный `VITE_API_BASE` в production.
- HOME-008: исправлена синхронизация роутинга, из-за которой `/` фактически уходил на `/catalog` и HomeScreen не открывался.

### Ограничения Stage 1

- без корзины, оплаты, рекомендаций, акций, отзывов и расширенных фильтров;
- без новых Domain Models, Repository Contract и Platform Core;
- данные категорий поступают только через существующий Catalog API;
- реальные изображения категорий не вводились, так как API не содержит такого контракта.

## Исправленные замечания Human Review

1. **DS-002 Color / Typography.** `buyer_mvp.css` больше не содержит прямых HEX/RGBA; типографика использует CSS tokens. `fontFamily.display` в tokens заменен на Inter/system stack, Fraunces удален.
2. **Недостоверные продуктовые утверждения.** Из hero и promise-блока убраны "100% свежее", "фермерские", "рядом", "лучшее предложение".
3. **"Популярное".** Блок переименован в "Больше товаров"; сортировка по `product_count` теперь описана честно.
4. **Визуал категории по индексу.** Добавлена `categoryPresentation(group)`, которая выбирает визуал по содержанию имени категории; fallback стабилен и не зависит от позиции API.
5. **Автоматическая проверка.** Добавлены тесты `src/buyer_mvp/__tests__/homePresentation.test.ts` для сортировки, маршрутов, search, pluralization и category presentation.
6. **Production API.** Production без `VITE_API_BASE` теперь явно сообщает о конфигурационной ошибке; build больше не заявляется как доказательство runtime API connectivity.
7. **Процесс проверки.** В отчете явно перечислены DS-001, DS-002, ТЗ-026 и Platform Core как обязательный контекст ревью.
8. **Доступность `/`.** `RuntimeRouteSync` больше не мапит `/` на Platform Core `Catalog`, поэтому HomeScreen доступен по заявленному маршруту.

## Критерии приемки

- поиск ведет в `/catalog` с параметром `search`;
- карточка категории ведет в `/catalog?group_id=...`;
- данные категорий не дублируются локальной доменной моделью;
- loading/error остаются доступны пользователю;
- desktop и mobile не имеют горизонтального переполнения;
- компонентный CSS использует semantic/theme tokens;
- на экране нет неподтвержденных продуктовых обещаний;
- production build проходит;
- production deployment отдельно подтверждает `VITE_API_BASE` и доступность Catalog API.

## Knowledge Delta

Стартовая страница Buyer MVP может быть улучшена внутри React UI-слоя без расширения Stage 1. Для пользовательского доверия важнее не визуально обещать свежесть/локальность, а показывать только те факты, которые есть в API. Если будущие этапы добавят геолокацию, рейтинг продавца, freshness metadata или offer scoring, соответствующие тексты и UI можно будет вернуть уже как data-backed claims.

## Self Review

- Scope: реализованы только Stage 1 вход в каталог, поиск, категории и presentation-логика.
- Architecture: изменения ограничены `buyer_mvp`, tokens typography и npm test setup; Domain Model, Repository Contract и Platform Core не изменялись.
- Design System: проверены DS-002 Color и Typography; компонентный CSS не использует прямые HEX/RGBA, display font не декоративный.
- UX semantics: названия блоков соответствуют данным API; нет ложной семантики "популярности".
- Production: build проходит; runtime API должен проверяться отдельно с заданным `VITE_API_BASE`.
- Verification: `npm test`, `npm run lint`, `npm run build` проходят.
- Browser QA: локально проверены `/` на desktop 1440 и mobile 390; HomeScreen отображает 9 категорий, поиск доступен, горизонтального overflow нет.

## Human Review Checklist

- [ ] Desktop 1440 px: hero, поиск и шесть категорий помещаются без наложений.
- [ ] Mobile 390 px: две колонки категорий, нет горизонтального скролла.
- [ ] Поиск "молоко" открывает каталог с параметром `search`.
- [ ] Нажатие категории сохраняет `group_id` в URL.
- [ ] Проверены focus-ring и управление клавиатурой.
- [ ] Production окружение задает `VITE_API_BASE`.
- [ ] Production smoke-test подтверждает доступность `/groups`.
- [ ] Итоговые desktop/mobile скриншоты приложены к передаче.

Human Review не может быть отмечен выполненным самим автором реализации. Чек-лист должен подтвердить заказчик или назначенный ревьюер.
## Review delta 2026-08-17

- Removed remaining Fraunces load from `index.html`; Inter is the only requested Google Font.
- Added token-based search focus state with `.gm-buyer-search:focus-within`.
- Changed `npm test` to `vitest run`; kept the previous narrow command as `npm run test:home`.
- Wrapped existing Platform Core assert files in minimal Vitest `it(...)` blocks so the full suite is real, not a false script claim.
- Limited `groupsWithMoreProducts()` to root categories to avoid mixing parent and child semantics in quick links.
- Recaptured `docs/screenshots/greenmarket-desktop.png` and `docs/screenshots/greenmarket-mobile.png` from the current local app.
- Browser QA: desktop 1440 and mobile 390 both reported `scrollWidth === innerWidth`.
- Verification: `npm test` passed 6 files / 10 tests; `npm run lint` passed; `npm run build` passed.
