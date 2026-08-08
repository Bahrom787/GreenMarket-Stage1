# GreenMarket — Stage 1 (Bootstrap → исполняемое приложение)

Фронтенд-приложение GreenMarket Stage 1 (React 18 + Vite 5 + TypeScript strict). Начато как
минимальный исполняемый каркас, к настоящему моменту содержит реализованные экраны Buyer MVP
и экран Map. Запуск из корня репозитория: `greenmarket-server.bat start` (или команды ниже).

## Требования

- Node.js 18+
- npm 9+

## Запуск

```bash
git clone <repo-url>
cd greenmarket
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`.

Другие команды:

```bash
npm run build     # production-сборка (tsc + vite build)
npm run preview   # предпросмотр production-сборки
npm run lint      # проверка ESLint
npm run format    # форматирование Prettier
```

## Маршруты

| Маршрут | Экран | Статус |
|---|---|---|
| `/` | Главная (дерево категорий + поиск) | реализован (buyer_mvp) |
| `/catalog` | Каталог (список, сортировка, пагинация) | реализован (buyer_mvp) |
| `/product/:productId` | Карточка товара (офферы, лента фото) | реализован (buyer_mvp) |
| `/map` | Карта продавцов (Leaflet) | реализован (screens/map + platform-core/map) |
| `/cart`, `/profile`, `/seller-list`, `/seller/:sellerId` | Заглушки | заглушки |

## Структура

```
src/
  app/             # App Shell: App.tsx, ErrorBoundary, NavigationContainer, RuntimeRouteSync
  buyer_mvp/       # Buyer MVP: экраны Главная/Каталог/Карточка товара, клиент Catalog API
  containers/      # BottomSheet, Modal, Overlay, Snackbar
  design-system/   # Реализация Design System: токены (colors/typography/scales), тема, компоненты
  layout/          # Layout-примитивы (Flex, Structure)
  platform-core/   # Рабочая копия greenmarket/GreenMarket/ (домены + contracts + runtime-слой)
                   # плюс домен Map (IMP-003.1) и дополнительные экраны
  screens/         # Экраны приложения: map/ (MapScreenView и др.), PlaceholderScreen
  repositories/    # Резерв под существующие репозитории данных
  mocks/           # Резерв под тестовую инфраструктуру
  shared/          # Общие стили
main.tsx           # Точка входа
```

> ⚠️ `src/platform-core/` — рабочая копия эталонной библиотеки доменов из
> `greenmarket/GreenMarket/` корня репозитория. Часть файлов идентична, часть разошлась,
> а домен Map существует только здесь (в `greenmarket/` его нет). Сверка двух копий —
> незакрытая задача (см. `_inventory/CODE_INDEX.md` и `_inventory/TRACEABILITY.md` в корне).

## Используемые технологии

- React 18
- TypeScript (strict mode)
- Vite 5
- React Router 6
- Leaflet / react-leaflet (экран Map)
- ESLint + Prettier
- EditorConfig

## Команды npm

| Команда           | Назначение                       |
|-------------------|-----------------------------------|
| `npm install`     | установка зависимостей            |
| `npm run dev`     | запуск dev-сервера с hot reload   |
| `npm run build`   | production-сборка (tsc + vite)    |
| `npm run preview` | предпросмотр production-сборки    |
| `npm run lint`    | статическая проверка кода         |
| `npm run format`  | автоформатирование кода           |

## Ограничения этапа

- Реализованы продуктовые сценарии Buyer MVP (Главная/Каталог/Карточка товара) и экран Map.
- Корзина, профиль, список продавцов и карточка продавца — заглушки (`PlaceholderScreen`
  или пустые ScreenDefinition в `src/platform-core/screens/`).
- Backend в репозитории отсутствует: Buyer MVP работает против внешнего REST Catalog API
  (`/catalog/groups`, `/catalog/products`, `/catalog/products/{id}`), см. `src/buyer_mvp/api.ts`.
- Автотесты: в `src/platform-core/navigation-runtime-layer/` есть 2 теста на `node:assert`
  (запуск вручную `npx tsx`); Playwright-сценарии Buyer MVP не написаны
  (см. `tests_folder/TZ_TESTING_BUYER_MVP.md` в корне репозитория).
