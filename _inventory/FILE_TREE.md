# FILE_TREE.md

Полное дерево репозитория GreenMarket_CustomerUI-main по состоянию на обновление документации (2026-08).

Метод получения: обход дерева без исключений, кроме `node_modules/` (папка `react-vite-bootstrap-project/node_modules`, 6222 файла, в подсчёт и дерево не входит).

Итоговый счётчик: **281 файл** (без `node_modules`). Внутри вложенного архива `archive/*.zip` (31 файл) — отдельный снимок, считается одним файлом; его содержимое описано в `DOCUMENT_INDEX.md` → «Архивный снимок».

Распределение по типам файлов (без `node_modules`): `.ts` — 138, `.md` — 63, `.tsx` — 49, `.css` — 8, `.json` — 5, `.log` — 3, `.html` — 2, `.jsx` — 2, по 1 файлу: `.gitignore`, `.prettierrc`, `.js`, `.map`, `.zip`, `.bat`, `.docx`, `.txt`, `.cjs`, `.example`, `.editorconfig`.

```
.
├── README.md
├── docs/
│   ├── README.md
│   ├── architecture/
│   │   ├── 21_prompt_fsm_engine_sovmestimost.md
│   │   └── 22_tz022_podgotovka_k_fsm_engine.md
│   ├── reviews/
│   │   ├── 20_meta_review_struktury_arhiva.md
│   │   ├── 25_review_arhiva_posle_dobavleniya_tz023_024.md
│   │   └── 26_rekomendacii_svyazannye_dokumenty_i_chitatel.md
│   └── specifications/
│       ├── 01_tz001_glavny_ekran_pokupatelya.md
│       ├── 02_tz002_varianty_pokupki.md
│       ├── 03_tz003_kartochka_prodavtsa.md
│       ├── 04_tz005_obschie_printsipy_customer_ui.md
│       ├── 05_tz006_user_flow_povsednevnaya_pokupka.md
│       ├── 06_tz007_model_sostoyaniy_fsm.md
│       ├── 07_tz008_viewmodel_customer_ui.md
│       ├── 08_tz009_kontrakt_ui_backend.md
│       ├── 09_tz010_glossariy_greenmarket.md
│       ├── 10_tz011_printsipy_proektirovaniya.md
│       ├── 11_tz013_pravila_razvitiya_ui.md
│       ├── 12_tz014_predmetnaya_model.md
│       ├── 13_tz015_purchase_optimizer.md
│       ├── 14_tz016_informatsionnaya_model.md
│       ├── 15_tz017_sobytiynaya_model.md
│       ├── 16_tz018_katalog_deystviy.md
│       ├── 17_tz019_raspredelenie_otvetstvennosti.md
│       ├── 18_tz020_biznes_pravila.md
│       ├── 19_tz021_nfr.md
│       ├── 23_tz023_glavny_ekran_detalnaya_specifikaciya.md
│       ├── 24_tz024_bottom_sheet_detalnaya_specifikaciya.md
│       ├── 27_tz025_kartochka_prodavtsa_detalnaya.md
│       ├── 28_tz026_protokol_verifikacii_tz.md
│       └── 29_tz025_kartochka_prodavtsa_candidate_v1.1.md
├── greenmarket/
│   └── GreenMarket/
│       ├── adapters/
│       │   └── SellerCardAdapter.ts
│       ├── basket/
│       │   ├── BasketScreen.tsx
│       │   ├── adapters/BasketAdapter.ts
│       │   ├── builders/BasketBuilder.ts
│       │   └── viewmodels/BasketViewModel.ts
│       ├── BottomSheetDeclarative.tsx
│       ├── builders/
│       │   ├── PurchaseOptionsBuilder.ts
│       │   ├── ScreenBuilder.ts
│       │   └── SellerCardBuilder.ts
│       ├── catalog/
│       │   ├── CatalogScreen.tsx
│       │   ├── adapters/CatalogAdapter.ts
│       │   ├── builders/CatalogBuilder.ts
│       │   └── viewmodels/CatalogViewModel.ts
│       ├── contracts/
│       │   ├── Action.ts
│       │   ├── ContentBlock.ts
│       │   ├── DomainTypes.ts
│       │   ├── LoadState.ts
│       │   └── ViewState.ts
│       ├── docs/
│       │   ├── architecture/GM-010_STAGE1_MODEL_MAPPING.md
│       │   ├── design-system/
│       │   │   ├── README.md
│       │   │   ├── DS-001-Design-Concept.md
│       │   │   ├── DS-v2-Refactor-Summary.md
│       │   │   └── DS-002-Design-Tokens/
│       │   │       ├── DS-002-Color.md
│       │   │       ├── DS-002-Elevation.md
│       │   │       ├── DS-002-Icon-Sizes.md
│       │   │       ├── DS-002-Motion-Tokens.md
│       │   │       ├── DS-002-Radius.md
│       │   │       ├── DS-002-Spacing.md
│       │   │       └── DS-002-Typography.md
│       │   └── ux/
│       │       ├── README.md
│       │       └── stage-1/
│       │           ├── GM-UX-001-Map.md
│       │           ├── GM-UX-002-Catalog.md
│       │           ├── GM-UX-003-Seller-List.md
│       │           ├── GM-UX-004-Seller-List-and-Card.md
│       │           ├── GM-UX-005-Seller-Card-and-Product-Card.md
│       │           ├── GM-UX-006-Product-Card.md
│       │           ├── GM-UX-007-Search.md
│       │           ├── GM-UX-008-CatalogScreen.md
│       │           ├── GM-UX-009_Product_Card.md
│       │           ├── GM-UX-010_Seller_Card.md
│       │           ├── GM-UX-011_Search_Technical_Specification.md
│       │           ├── GM-UX-012_Basket_Technical_Specification.md
│       │           └── GM-UX-013_Purchase_Options_Technical_Specification.md
│       ├── favorites/
│       │   ├── FavoritesScreen.tsx
│       │   ├── adapters/FavoritesAdapter.ts
│       │   ├── builders/FavoritesBuilder.ts
│       │   └── viewmodels/FavoritesViewModel.ts
│       ├── formatting/
│       │   ├── DistanceFormatter.ts
│       │   ├── PriceFormatter.ts
│       │   ├── RatingFormatter.ts
│       │   └── SubtitleFormatter.ts
│       ├── presentation/
│       │   ├── DistanceVm.ts
│       │   ├── PriceVm.ts
│       │   ├── RatingVm.ts
│       │   └── SubtitleParts.ts
│       ├── product_card/
│       │   ├── ProductCardScreen.tsx
│       │   ├── adapters/ProductCardAdapter.ts
│       │   ├── builders/ProductCardBuilder.ts
│       │   └── viewmodels/ProductCardViewModel.ts
│       ├── purchase_options/
│       │   ├── PurchaseOptionsScreen.tsx
│       │   ├── adapters/PurchaseOptionsAdapter.ts
│       │   ├── formatting/Formatters.ts
│       │   ├── presentation/PurchaseOptionsPresentation.ts
│       │   └── viewmodels/PurchaseOptionsViewModel.ts
│       ├── screens/
│       │   ├── BasketScreen.ts
│       │   ├── CatalogScreen.ts
│       │   ├── FavoritesScreen.ts
│       │   ├── ProductCardScreen.ts
│       │   ├── PurchaseOptionsScreen.ts
│       │   ├── ScreenDefinition.ts
│       │   ├── SearchScreen.ts
│       │   └── SellerCardScreen.ts
│       ├── search/
│       │   ├── SearchScreen.tsx
│       │   ├── adapters/SearchAdapter.ts
│       │   ├── builders/SearchBuilder.ts
│       │   └── viewmodels/SearchViewModel.ts
│       └── viewmodels/SellerCardViewModel.ts
├── navigation-runtime-layer/
│   ├── domain/catalog/
│   │   ├── __tests__/
│   │   │   ├── DomainModels.test.ts
│   │   │   └── MockSellerProductPhotoRepository.test.ts
│   │   ├── models/SellerProductPhoto.ts
│   │   ├── MockSellerProductPhotoRepository.ts
│   │   └── SellerProductPhotoRepository.ts
│   ├── hooks/useGreenMarketRuntime.ts
│   ├── navigation/
│   │   ├── __tests__/NavigationStack.test.ts
│   │   ├── NavigationStack.ts
│   │   └── ScreenRegistry.ts
│   └── runtime/
│       ├── __tests__/GreenMarketRuntime.test.ts
│       └── GreenMarketRuntime.ts
├── react-vite-bootstrap-project/          ← ИСПОЛНЯЕМОЕ приложение Stage 1
│   ├── README.md
│   ├── package.json / package-lock.json
│   ├── index.html
│   ├── vite.config.ts / tsconfig.json / tsconfig.node.json
│   ├── vercel.json
│   ├── .editorconfig / .env.example / .eslintrc.cjs / .gitignore / .prettierrc
│   ├── dist/                               (сборка: index.html + assets/)
│   ├── vite-dev.log                        (создаётся при запуске dev-сервера)
│   ├── node_modules/                       (6222 файла — не входят в подсчёт/дерево)
│   └── src/
│       ├── main.tsx / vite-env.d.ts
│       ├── app/                            App.tsx, ErrorBoundary.tsx, NavigationContainer.tsx, RuntimeRouteSync.tsx
│       ├── buyer_mvp/                      Buyer MVP: api.ts, format.ts, types.ts, buyer_mvp.css,
│       │                                   components/{CategoryTree,OfferCard,PhotoPlaceholder,PhotoStrip,ProductCard,SearchBar}.tsx,
│       │                                   screens/{CatalogScreen,HomeScreen,ProductScreen}.tsx
│       ├── containers/                     BottomSheet.tsx, Modal.tsx, Overlay.tsx, Snackbar.tsx, index.ts, containers.css
│       ├── design-system/                  ThemeContext.ts, ThemeProvider.tsx, useTheme.ts, tokens.css,
│       │                                   tokens/{colors,index,scales,typography}.ts,
│       │                                   components/{Avatar,Button,ListItem,Loader,Overlays,States,Surface,Text,index}.tsx + components.css
│       ├── layout/                         Flex.tsx, Structure.tsx, index.ts, layout.css
│       ├── mocks/index.ts
│       ├── platform-core/                  ← рабочая копия greenmarket/GreenMarket/ + домен Map + доп. файлы (75 .ts/.tsx)
│       │   ├── adapters/SellerCardAdapter.ts
│       │   ├── basket/                     (BasketScreen.tsx, adapters/, builders/, viewmodels/)
│       │   ├── BottomSheetDeclarative.tsx
│       │   ├── builders/                   (PurchaseOptionsBuilder, ScreenBuilder, SellerCardBuilder)
│       │   ├── catalog/                    (CatalogScreen.tsx, adapters/, builders/, viewmodels/)
│       │   ├── contracts/                  Action.ts, BusinessEvent.ts, ContentBlock.ts, DomainTypes.ts, LoadState.ts, ViewState.ts
│       │   ├── diagnostics/Diagnostics.ts
│       │   ├── favorites/                  (FavoritesScreen.tsx, adapters/, builders/, viewmodels/)
│       │   ├── formatting/                 (Distance, Price, Rating, Subtitle Formatter)
│       │   ├── map/                        ← домен Map (нет в greenmarket/):
│       │   │   ├── adapters/MapSheetAdapter.ts
│       │   │   ├── builders/MapBuilder.ts
│       │   │   ├── gis/                    GeoService.ts, LeafletAdapter.tsx, MapAdapter.tsx, MapAdapterTypes.ts, MapConfig.ts, TileProvider.ts
│       │   │   ├── repository/             MockSellerRepository.ts, SellerRepository.ts
│       │   │   ├── runtime/MapRuntime.ts
│       │   │   └── viewmodels/MapViewModel.ts
│       │   ├── navigation-runtime-layer/   (hooks/, navigation/, runtime/ + __tests__ — копия navigation-runtime-layer/)
│       │   ├── presentation/               (DistanceVm, PriceVm, RatingVm, SubtitleParts)
│       │   ├── product_card/               (ProductCardScreen.tsx, adapters/, builders/, viewmodels/)
│       │   ├── purchase_options/           (PurchaseOptionsScreen.tsx, adapters/, formatting/, presentation/, viewmodels/)
│       │   ├── screens/                    Basket, Catalog, Favorites, Map, ProductCard, PurchaseOptions, ScreenDefinition,
│       │   │                               Search, SellerCard, SellerCatalog, SellerList (.ts)
│       │   ├── search/                     (SearchScreen.tsx, adapters/, builders/, viewmodels/)
│       │   └── viewmodels/SellerCardViewModel.ts
│       ├── repositories/index.ts
│       ├── screens/                        PlaceholderScreen.tsx, map/{map.css, MapBottomSheetContent.tsx, MapLocationButton.tsx, MapScreenView.tsx}
│       └── shared/global.css
├── tests_folder/
│   └── tests/
│       ├── TEST_COVERAGE.md
│       └── TZ_TESTING_BUYER_MVP.md
├── _inventory/                             ← эта инвентаризация (исторически — папка `repo/`)
│   ├── CODE_INDEX.md
│   ├── DOCUMENT_INDEX.md
│   ├── FILE_TREE.md
│   └── TRACEABILITY.md
├── examples/
│   ├── BottomSheetDeclarative_3.jsx
│   ├── BottomSheetDeclarative_3.tsx.jsx
│   └── types.ts.txt
├── archive/
│   └── GreenMarket_CustomerUI_v3_2026-07-08_2.zip   (31 файл внутри)
├── greenmarket-server.bat
├── AI-first Engineering Process.docx
├── vite-dev.log
└── vite-dev-err.log
```

## Расхождения этого дерева с предыдущей редакцией FILE_TREE.md

1. **Папка `repo/` → `_inventory/`.** В предыдущей редакции инвентаризация лежала в `repo/` и включала `README.md`; фактически папка называется `_inventory/` и состоит из 4 файлов (без `README.md`).
2. **`react-vite-bootstrap-project/`** — полностью отсутствовал в предыдущем дереве. Это исполняемое приложение (148 файлов без `node_modules`), включающее вторую копию кода платформы (`src/platform-core/`).
3. **`tests_folder/`** — отсутствовал. Содержит 2 документа по тестированию Buyer MVP.
4. **Корневые вспомогательные файлы** — `greenmarket-server.bat`, `AI-first Engineering Process.docx`, `vite-dev.log`, `vite-dev-err.log` — отсутствовали.
5. **Счётчик 123 → 281** — предыдущая редакция не учитывала `react-vite-bootstrap-project/` (148), `tests_folder/` (2), `_inventory/` (переименована из `repo/`) и корневые служебные файлы.
