# Comparative Interaction Architecture Spike

## Executive Summary

Spike выполнен как docs-only сравнение. Production-код не менялся.

Выбранный вертикальный срез: Global Catalog filters + Seller List seller filter + Map search state. Это существующий Stage 1 сценарий без искусственной новой бизнес-функции:

1. Пользователь выбирает категории в Global Catalog.
2. Пользователь выбирает нескольких продавцов в Seller List и переходит в Global Catalog с `seller_id`.
3. Map хранит собственное состояние поиска продавцов и товаров через MapRuntime.
4. URL/query state переживает refresh, browser Back/Forward и unmount/remount поверх React Router.

Основной вывод:

| Вопрос | Ответ |
| --- | --- |
| Interaction Runtime нужен? | YES, но только как узкий navigation/application action runtime. |
| Текущую PI в текущем виде оставлять? | REDUCE. Сохранить полезные функции, не развивать в отдельную платформу. |
| XState нужен сейчас? | NOT NEEDED для выбранного среза. |
| MCP нужен сейчас? | NOT NEEDED. |
| Temporal нужен сейчас? | NOT NEEDED. |
| A2A нужен сейчас? | NOT NEEDED. |
| Voice integration | NOT PRESENT сейчас; при появлении должна идти через тот же semantic action path. |

Рекомендуемый вариант: Hybrid. Сохраняем URL как durable state для каталогов, React local state для простых loading/error flows, GreenMarketRuntime для navigation/action bridge, MapRuntime только для Map-specific интеракций. Не добавляем второй Projection Runtime, XState, Temporal, MCP или A2A без реальной границы задачи.

## Baseline Checkpoint

| Пункт | Значение |
| --- | --- |
| Repository baseline | `GreenMarket-Stage1` |
| Baseline commit | `987dfe5 feat: compact global catalog categories (#35)` |
| Branch for spike | `codex/interaction-architecture-spike` |
| Production code changed | No |
| Selected scenario | Catalog/Seller List/Map interaction state |
| Main runtime path | `react-vite-bootstrap-project/src/platform-core/navigation-runtime-layer/` |
| App routing path | `react-vite-bootstrap-project/src/app/` |
| Catalog path | `react-vite-bootstrap-project/src/buyer_mvp/` |
| Seller List path | `react-vite-bootstrap-project/src/screens/seller-list/` |
| Map path | `react-vite-bootstrap-project/src/platform-core/map/` and `react-vite-bootstrap-project/src/screens/map/` |

Validation on this branch:

| Command | Result |
| --- | --- |
| `npm test` | Passed: 23 files, 92 tests. |
| `npm run lint` | Passed. |
| `npm run build` | Passed. |
| `npm run test:e2e` | Passed: 18 tests. |

## Current Architecture Path

### Catalog Filters

Current path:

`URL query -> catalogUrlState.ts -> CatalogScreen -> buyer_mvp/api.ts -> Catalog API -> ProductCard view models -> UI`

State ownership:

| State | Owner | Survives unmount/refresh? | Notes |
| --- | --- | --- | --- |
| `search` | URL query | Yes | Parsed in `CatalogScreen`. |
| `group_id` | URL query | Yes | Multi-select, comma format. |
| `seller_id` | URL query | Yes | Global Catalog seller filter. |
| `sort` | URL query | Yes | Defaults to `name`. |
| `page` | URL query | Yes | Reset to `1` on filter changes. |
| Product loading/error | React screen state | No | Acceptable projection/fetch state. |
| Groups loading/error | React screen state | No | Independent from product loading. |

### Seller List

Current path:

`URL query -> SellerListScreenView -> buyer_mvp/api.fetchSellers -> /markets + /markets/{id}/sellers -> selected seller_id query -> Global Catalog`

State ownership:

| State | Owner | Survives unmount/refresh? | Notes |
| --- | --- | --- | --- |
| Search query | URL query | Yes | Debounced from input. |
| Selected sellers | URL query `seller_id` | Yes | Selection is not lost by search. |
| Request race guard | `requestSeq` ref | No | Correct local async guard. |
| Loading/error/list | React screen state | No | Projection/fetch state only. |

### Map

Current path:

`MapScreenView -> useSyncExternalStore(MapRuntime) -> MapRuntime reducer/actions -> SellerRepository/GeoService/ProductSearch -> Map UI`

State ownership:

| State | Owner | Survives unmount? | Notes |
| --- | --- | --- | --- |
| Selected seller | MapRuntime singleton | Yes during session | Map-specific. |
| Map center/zoom | MapRuntime singleton | Yes during session | Map-specific. |
| Seller search | MapRuntime singleton | Yes during session | Uses request sequence/timers. |
| Product search | MapRuntime singleton | Yes during session | Does not require global PI. |
| FAB/Legend drag | Map UI hook/local storage | Yes if persisted by hook | UI-only, not domain state. |

## PI Functional Audit

| PI Function | Current implementation | Decision | Reason |
| --- | --- | --- | --- |
| State retrieval | `getState()` in GreenMarketRuntime and MapRuntime | KEEP | Useful for runtime snapshots and subscriptions. |
| Subscriptions | `subscribe()` + `useSyncExternalStore` for Map, React context for navigation runtime | KEEP | Small, testable, no dependency needed. |
| Command dispatch | `dispatch(Action)` in GreenMarketRuntime, `MapRuntime.dispatch()` for Map actions | KEEP / REDUCE | Keep semantic action path; avoid adding more screen-specific global actions. |
| Lifecycle | React Router + RuntimeRouteSync + MapRuntime singleton | KEEP | Handles URL entry, Back and Map unmount/remount. |
| Capability discovery | `ScreenRegistry.isActionAllowed` | REDUCE | Keep for existing action gating; avoid expanding into a broad permission platform. |
| Projection/binding | React components and view models | KEEP | No separate Projection Runtime needed. |
| Channel adaptation | `RuntimeRouteSync` bridges React Router and runtime | KEEP | Needed boundary; should remain the only URL/runtime bridge. |
| Domain state | Catalog query in URL, Store mode in app route/session, Map state in MapRuntime | KEEP | Owners are explicit and scoped. |
| Voice path | Not implemented | NOT NEEDED | No Voice Service exists in current runtime. Future Voice must dispatch existing semantic actions/URL changes. |

## Variant Comparison

### A. Current Architecture

| Area | Result |
| --- | --- |
| Functional equivalence | Passes current Stage 1 requirements. |
| Semantic fit | Good for URL-driven catalog and route state; acceptable for Map-specific runtime. |
| Code volume | Low to medium. |
| Custom abstractions | GreenMarketRuntime + MapRuntime + URL helpers. |
| Dependencies | No extra interaction dependency. |
| Testability | Good: URL helpers, API URL, runtime reducers and E2E already testable. |
| Debuggability | Good: URL is inspectable; runtime state is explicit. |
| Multi-surface support | Partial: semantic navigation actions exist; catalog filters are URL-based; Map owns its own state. |
| Voice support | Not implemented; can be added through action/query adapters. |
| FSM support | Possible later; current flows do not require it. |
| Async/failure handling | Local request sequence guards and loading/error states. |
| Cognitive load | Moderate; two runtimes must stay scoped. |
| Maintenance | Good if PI is not expanded casually. |
| Replaceability | Good: helpers and runtimes are small enough to wrap later. |

### B. Maximum Ready-Made Components

Candidate tools: XState for interaction machines, React Router for route state, existing UI Kit/components, no custom PI beyond adapters.

| Area | Result |
| --- | --- |
| Functional equivalence | Achievable but requires adapter work. |
| Semantic fit | XState fits multi-step workflows, less useful for simple query/filter fetch flows. |
| Code volume | Likely higher now due migration/adapters/tests. |
| Custom abstractions | Lower long-term if a real FSM boundary exists; higher short-term. |
| Dependencies | Adds a state-machine dependency if XState is adopted. |
| Testability | Strong for state graphs, unnecessary for plain URL filters. |
| Debuggability | Strong with machine snapshots, but another model to learn. |
| Multi-surface support | Good if all surfaces dispatch the same events. |
| Voice support | Good only after semantic action catalog is formalized. |
| FSM support | Best fit. |
| Async/failure handling | Strong actor model, but overkill for selected slice. |
| Cognitive load | Higher for current team/scope. |
| Maintenance | Risk of carrying unused architecture. |
| Replaceability | Medium; machine contracts become sticky. |

### C. Hybrid

| Area | Result |
| --- | --- |
| Functional equivalence | Best match with minimum change. |
| Semantic fit | Keeps URL state for catalog, runtime actions for navigation, MapRuntime for Map state. |
| Code volume | Lowest implementation cost. |
| Custom abstractions | Controlled: existing PI reduced to necessary functions. |
| Dependencies | No new dependency now. |
| Testability | Keeps existing unit/E2E model. |
| Debuggability | URL and scoped runtime state stay visible. |
| Multi-surface support | Good enough for current surfaces; extensible via semantic actions. |
| Voice support | Future Voice can call existing action/query adapters. |
| FSM support | XState remains a later option only for real multi-step flows. |
| Async/failure handling | Use current request guards; add machines only when race/lifecycle complexity grows. |
| Cognitive load | Lowest. |
| Maintenance | Best for Stage 1. |
| Replaceability | Best because boundaries remain narrow. |

Decision: Variant C.

## Component Decisions

| Component / concept | Decision | Reason |
| --- | --- | --- |
| XState | NOT NEEDED now | Selected slice is URL/query + fetch + scoped Map reducer. No complex state graph justifies the dependency. |
| React state / Projection | KEEP | React is enough for loading/error/skeleton/input projection. Domain state must stay outside projection. |
| Projection Runtime | NOT NEEDED | Would duplicate URL, React and MapRuntime ownership. |
| MCP | NOT NEEDED | No LLM/tool boundary in selected scenario. |
| Voice Service | NOT PRESENT / FUTURE ADAPTER | No current Voice implementation found. If added, it must call the same semantic navigation/query actions as UI. |
| Temporal | NOT NEEDED | No durable long-running operation in Catalog/Seller List/Map search. |
| A2A | NOT NEEDED | No external agent-to-agent scenario. |
| GreenMarketRuntime | KEEP / REDUCE | Keep navigation/action bridge; do not add catalog/map domain state to it. |
| RuntimeRouteSync | KEEP | Single bridge between URL and runtime. |
| MapRuntime | KEEP SCOPED | Correct for Map-specific state; must not become global app runtime. |
| `catalogUrlState.ts` | KEEP | Correct durable state owner for catalog filters. |
| Seller List selected sellers | KEEP IN URL | Required for refresh/back/deep links and Global Catalog filtering. |

## Multi-Surface State Checks

| Check | Result |
| --- | --- |
| Surface unmount should not delete semantic state | Pass for Catalog/Seller List through URL; pass for Map during session through MapRuntime singleton. |
| Another Surface can continue with same state | Seller List writes `seller_id`, Global Catalog reads `seller_id`. |
| One Surface uses multiple independent contexts | Catalog combines `search`, `group_id`, `seller_id`, `sort`, `page`; Store Catalog suppresses global `seller_id`. |
| UI and Voice must not duplicate business operation | Future requirement: Voice should update URL/query or dispatch existing runtime actions, not implement separate filtering. |
| Projection must not own domain/application state | Current Catalog/Seller List projection owns only loading/error/input; semantic filters are URL-owned. |

## Required Changes

No production change is required in this spike.

For future implementation PRs:

1. Keep URL/query as canonical state for catalog filters.
2. Keep Store Mode and Store routes outside Global Catalog filter state.
3. Keep MapRuntime scoped to Map.
4. Avoid adding XState until a real multi-step interaction has enough states/events/guards to justify it.
5. If Voice appears, route it through the same semantic action/query update path as UI.

## Rejected Changes

| Change | Reason |
| --- | --- |
| Add XState now | No current flow needs an FSM dependency. |
| Add MCP | No LLM/tool boundary in selected vertical slice. |
| Add Temporal | No durable workflow. |
| Add A2A | No external agent scenario. |
| Create Projection Runtime | Duplicates current URL/runtime/projection boundaries. |
| Move Catalog filters into GreenMarketRuntime | Would make refresh/deep links harder and mix route state into Platform Core. |
| Move Map state into GreenMarketRuntime | Would leak Map-specific state into global runtime. |
| Let UI and Voice own separate implementations | Would violate single semantic action path. |

## Target Architecture

```text
Catalog UI
  -> catalogUrlState
  -> Buyer Catalog API
  -> Product presentation

Seller List UI
  -> seller_id URL query
  -> Buyer Seller API
  -> Global Catalog

Map UI
  -> MapRuntime
  -> Map Repository / GeoService / ProductSearch
  -> Map presentation

Global navigation
  -> React Router
  -> RuntimeRouteSync
  -> GreenMarketRuntime
```

Rule: interaction state lives at the smallest durable owner that satisfies the scenario.

## Migration Plan

1. Do not implement architecture changes in this PR.
2. Keep current Stage 1 as baseline.
3. For each future interaction feature, first decide its state owner: URL, screen-local React, MapRuntime, GreenMarketRuntime, backend, or external workflow.
4. Introduce XState only if the feature has explicit states, events, guards, actors and snapshot requirements that are hard to maintain with current code.
5. Introduce Voice only as an adapter to existing semantic actions and query state.
6. Keep MCP/Temporal/A2A out until a real boundary requires them.

## Final Decision

Interaction Runtime: YES, as a narrow runtime/action/navigation bridge.

PI current form: REDUCE. Preserve useful primitives (`dispatch`, `subscribe`, `getState`, `RuntimeRouteSync`, URL helpers), but avoid expanding PI into a broad custom platform while React Router, URL state and existing scoped runtimes are enough.
