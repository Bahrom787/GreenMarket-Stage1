# Map Core Reconciliation

## 1. Executive Summary

Repo A is `Bahrom787/GreenMarket-Stage1`. Repo B is `rickorkeno-lang/GreenMarket`.

This PR is documentation-only. It compares Map Core and records what should be carried into Repo A before any Map UI migration. It does not change `MapScreenView`, `MapBottomSheetContent`, `MapFabButton`, `MapFabPanel`, `MapLegend`, `MapSearchAutocomplete`, `map.css`, Platform Core, Design System, routes, runtime code, or tests.

Repo B is not a replacement for Repo A. Repo B extends the same Map Core family with additional capabilities:

- market pins and market seller lists
- route building and route rendering model
- map session restore
- seller history
- product search and search suggestions
- API-backed seller/market repositories with offline cache
- marker and tile fallback helpers
- richer runtime actions and tests

Recommended approach:

1. Keep Repo A as the Stage 1 baseline.
2. Keep Repo A `react-vite-bootstrap-project/src/platform-core/` as the only runtime Platform Core.
3. Reconcile Map Core selectively before moving Map UI.
4. Port only the minimal contracts needed by Repo B Map UI.
5. Do not copy Repo B Platform Core or Design System wholesale.

## 2. A/B Component Matrix

Diff terms used below:

- A-only: exists only in Repo A.
- B-only: exists only in Repo B.
- Same: same responsibility and compatible contract.
- Changed: same responsibility, different semantics or shape.
- New API: Repo B adds a contract Repo A does not have.
- New state: Repo B adds runtime/view-model state Repo A does not have.

| Area | Repo A state | Repo B state | Classification | Decision |
|---|---|---|---|---|
| `MapRuntime.ts` | Basic singleton runtime: sellers, selected seller, seller search, filters, area label, categories. Uses `MockSellerRepository`. | Changed + New state: markets, route state, product search, suggestions, seller history, session snapshot, POI toggle, API repository facade. | Required / Optional / Conflict | Keep A as base. Required: suggestions/product-search contracts for B search UI. Required if route UI is migrated: route state/actions. Markets are Required only for B market pin UI. Session restore is Optional unless persistence is required. |
| `MapViewModel.ts` | Seller-only model with `SellerMapRecord`, `SellerSearchState`, `BottomSheetState`, `MapViewModel`. | Changed + New API: nullable seller facts, `MarketMapRecord`, `MarketSellerRecord`, `SearchSuggestionsState`, `ProductSearchState`, route model/state, seller history, market sheet state, POI visibility. | Required / Conflict | Keep A baseline, selectively widen models. Nullable seller facts are a Conflict with A tests and adapters and need a focused implementation PR. Product search state is Required for `MapSearchAutocomplete`. |
| `MapBuilder.ts` | Same responsibility: builds blocks through `MapSheetAdapter.toBlocks`. | Same responsibility with richer adapter output. | Changed implementation | Keep A builder shape. Update only after MapSheetAdapter contract is accepted. |
| `MapSheetAdapter.ts` | Seller summary and seller search blocks. | Changed: seller history, market seller list, route status/actions, nullable seller formatting. | Required / Optional | Required only for bottom-sheet states introduced by accepted runtime changes. Do not port before model changes. |
| `SellerRepository.ts` | Category, visible sellers, find seller, near seller search. | Changed + New API: seller card/products, recommendations, product search, markets, market sellers. | Required / Optional / B-Specific | Add only methods required by accepted Map UI. Product search and markets are candidates. SellerCard-specific methods must not replace Store Home or Buyer MVP contracts. |
| `MockSellerRepository.ts` | Mock sellers and categories only. | Expanded mock/catalog data for product search, markets, seller card, recommendations. | Optional / B-Specific | Port only test data needed by Map Core tests. Do not use mock data as product truth for Buyer MVP. |
| `repository.ts` | Missing. | B-only New API: repository facade with API repository + mock fallback + offline cache wrapper. | Required / Conflict | Required if Map switches from mock-only to API-backed data. Must reuse Repo A API-base rules instead of creating a second API config contract. |
| `ApiSellerRepository.ts` | Missing. | B-only New API: maps Catalog API sellers, markets, market sellers, seller products, product search. | Required / Conflict | Required for production Map data, but must be reconciled with Repo A `buyer_mvp/api.ts` normalization and no fake data. |
| `CachedSellerRepository.ts` / `OfflineCacheStore.ts` | Missing. | B-only: LocalStorage cache for markets/sellers/products, fallback on network/server failures. | Optional / Conflict | Optional. Add only after cache policy is reviewed. Not required for first Map UI migration. |
| `MapSessionStore.ts` | Missing. A runtime singleton preserves state only within one tab lifetime. | B-only New state: LocalStorage snapshot for viewport, filters, search text, open sheet, selected seller snapshot, POI toggle. | Optional / Conflict | Optional. Useful for refresh restore, but needs explicit persistence contract and stale-data handling. |
| `SellerHistory.ts` / `SellerHistoryStore.ts` | Missing. | B-only New state: LocalStorage seller view history. | Optional | Not required for initial Map migration unless B history panel is accepted. |
| `ProductSearch.ts` | Missing. | B-only New API: product-name normalization, direct matches, fuzzy fallback, seller matches with price. | Required | Required for `MapSearchAutocomplete` product mode. Can be ported as isolated pure domain logic with tests. |
| `GeoService.ts` | Geolocation, bounds, distance, geocode/reverse geocode. | Similar base plus used by route and repository flows. | Changed implementation | Keep A unless a concrete B method is needed. Do not duplicate geolocation logic. |
| `SellerFilters.ts` | Category/open/availability filters. | Same family, adapted for nullable seller fields. | Conflict | Required only if `SellerMapRecord` fields become optional. Otherwise keep A. |
| Map domain models | Seller/location/category focused models. | Adds market, route, product-search, seller history, cache snapshot models. | Required / Optional / Conflict | Introduce each model with the feature that needs it. Do not import B model barrels wholesale. |
| Map formatting | A uses existing formatting in adapters and shared formatters. | B uses `DistanceFormatter` plus richer price/distance/search-result formatting. | Required / Optional | Keep Repo A formatting ownership. Add only product-search display fields needed by UI; no fake price or distance values. |
| Map search / product-search | Seller search only. | Seller suggestions plus product query, fuzzy matching, seller/product matches, loading/error states. | Required | Required dependency for `MapSearchAutocomplete`; should be the first implementation slice. |
| Map events/actions | Seller selection, search, filter, retry, category actions. | Adds product search actions, route actions, market selection, session restore, POI toggle, `MapProjection` route event. | Required / Optional / B-Specific | Add explicit runtime actions only for accepted features. `MapProjection` remains blocked until event ownership is reviewed. |
| Map state | Sellers, selected seller, search, filters, loading/error, sheet. | Adds markets, market sellers, route, product search, suggestions, history, session snapshot, POI flag. | Required / Optional / Conflict | Preserve A state semantics and expand incrementally. Avoid one large state replacement. |
| `MapAdapterTypes.ts` | Sellers, selected seller, user location, camera callbacks. | Changed + New API: markets, route, POI visibility, market selection callbacks. | Required if UI migrated | Add only callbacks used by accepted UI components. |
| `LeafletAdapter.tsx` | Seller markers and clusters. | Adds marker style helpers, market markers, route polyline, tile fallback, POI hiding. | Required / Optional | Do not change in this PR. Required later for route/market UI; optional for tile fallback and POI toggle. |
| `MarkerStyle.ts` | Missing. | B-only pure marker HTML/metrics/state helpers with tests. | Required if B marker UI is migrated | Good isolated candidate. Port before `LeafletAdapter` changes. |
| `TileFallback.ts` | Missing. | B-only pure threshold tracker for tile error fallback. | Optional | Not required for first implementation unless tile fallback UI is accepted. |
| `routing/*` | Missing. | B-only New API: OSRM provider, route service, polyline codec, route factory, tests. | Required if route UI is migrated | Port as isolated Map Core feature only after route UX is accepted. |
| `MapProjection.ts` | Missing. | B-only: bridges business event `ROUTE_STARTED` into MapRuntime route request. | B-Specific / Conflict | Do not port until Repo A business event ownership is reviewed. |
| `compare.ts` | Missing. | B-only utility/tests for comparison behavior. | Optional | Port only if used by accepted runtime or test plan. |
| Map tests | Runtime, adapter, repository tests for A scope. | Changed + B-only tests for markets, routes, session restore, product search, marker style, tile fallback, cache. | Required | Port tests with each accepted core capability, not as one bulk copy. |

## 3. Dependency Matrix

| Repo B UI / surface | Map Core dependencies | Repo A availability | Classification | Notes |
|---|---|---|---|---|
| `MapSearchAutocomplete` | `MapViewModel.searchSuggestions`, `MapViewModel.productSearch`, `ProductSearchState`, `ProductSellerMatch`, `DistanceFormatter`, search mode, loading/failed states, selection callbacks. | `DistanceFormatter` exists. Search/product search state and `ProductSearch.ts` are missing. | Required | Minimum contract: search mode, seller suggestions, product name suggestions, product seller matches, loading/error/clear/select actions. |
| `MapFabPanel` | `useDraggablePanel`, panel positioning CSS, action callbacks from screen. | Missing. | Optional | UI only. No Map Core required beyond callbacks. Do not port in this PR. |
| `MapLegend` | `useDraggablePanel`, marker meaning copy/CSS. | Missing. | Optional | UI documentation aid; no core dependency except marker states if B marker style is accepted. |
| `MapFabButton` | Existing Repo A DS `Icon`, `IconButton`, tooltip behavior in component-local state. | Repo A has DS `Icon`/`IconButton`. | Optional | Can reuse Repo A DS. No new primitive required. |
| `MapBottomSheetContent` | `ContentBlock`, `Action`, `MapSheetAdapter` block variants, route/market/history blocks. | A has `ContentBlock`, `Action`, existing renderer, but not all B block states. | Required after model changes | Adapter must emit blocks from prepared VM data; UI must stay render-only. |
| `MapScreenView` | `MapRuntime` expanded methods, `MapAdapterTypes` expanded callbacks, `MapSearchAutocomplete`, `MapFabPanel`, `MapLegend`, session snapshot lifecycle, `MapProjection`. | A has current screen and runtime, but not expanded contracts. | Required / Conflict | Do not port until runtime, viewmodel, adapter types, and repository facade are reconciled. |
| `LeafletAdapter` B behavior | `MarkerStyle`, `TileFallback`, route state, market records, selected market id, POI flag. | A has Leaflet adapter for sellers only. | Required if B map visuals are accepted | Should be a later implementation PR after pure helpers land. |
| Route button/actions in sheets | `RouteState`, `RouteTarget`, `RouteService`, `PolylineCodec`, `GeoService.resolveUserLocation`. | Missing except `GeoService`. | Optional / Required by route UX | Treat as separate route feature, not prerequisite for product search. |
| Market pin / market sellers sheet | `MarketMapRecord`, `MarketSellerRecord`, repository market methods, bottomSheet `marketSellers`. | Missing. | Required by B market UI | Needs backend capability confirmation before implementation. |
| Seller history panel | `SellerHistory`, `SellerHistoryStore`, bottomSheet `sellerHistory`. | Missing. | Optional | Local UX enhancement. Not required for initial Map migration. |
| Session restore | `MapSessionStore`, `toSessionSnapshot`, restored initial state. | Missing. | Optional / Conflict | Adds localStorage persistence. Needs accepted retention/stale data policy. |

## 4. Required Changes

Required for the next implementation PR if the goal is to make Repo B's current Map search surface work in Repo A:

1. Add pure `ProductSearch.ts` domain logic and tests.
2. Extend `MapViewModel` with `SearchSuggestionsState` and `ProductSearchState`.
3. Extend `SellerRepository` minimally with:
   - seller name suggestions/search source
   - product name suggestions
   - sellers by product query
4. Add an API-backed repository facade only through Repo A's existing API configuration rules. Do not introduce a second `VITE_API_BASE` contract.
5. Extend `MapRuntime` with debounced search/product-search actions and states.
6. Update `MapSheetAdapter` only for states that the accepted UI needs.
7. Add focused tests for product search, search suggestions, and runtime race handling.

Required only if the next accepted implementation is markets:

1. Add `MarketId` ownership decision in Repo A contracts, or reuse the existing branded id if present.
2. Add `MarketMapRecord`, `MarketSellerRecord`, and `marketSellers` bottom-sheet state.
3. Add repository methods for visible markets and sellers inside a market.
4. Add runtime actions for market loading, selection, retry, and clearing.
5. Add adapter tests for market seller blocks.

Required only if the next accepted implementation is routes:

1. Add route domain model: `RouteModel`, `RouteState`, `RouteTarget`, `RouteFailureKind`.
2. Add `PolylineCodec`, `RouteProvider`, `RouteService`, and route tests.
3. Add route actions to MapRuntime.
4. Add route render contract to `MapAdapterTypes`.
5. Keep route service isolated under Map Core; do not move it into global Platform Core.

## 5. Rejected Changes

| Change | Classification | Reason |
|---|---|---|
| Merge Repo B wholesale | Rejected | Would import unrelated Platform Core, screen infrastructure, and Design System drift. |
| Copy Repo B `platform-core` as a second runtime source | Rejected | Repo A already defines canonical runtime Platform Core. Two runtime cores would recreate the ownership problem fixed earlier. |
| Replace Repo A Design System primitives with Repo B copies | Rejected | Repo A UI Kit is canonical. B UI must consume existing `Text`, `Icon`, `Button`, `IconButton`, `Card`, `Loader`, states, layout, and tokens. |
| Port `MapScreenView`, `MapBottomSheetContent`, `MapFabButton`, `MapFabPanel`, `MapLegend`, `MapSearchAutocomplete`, or `map.css` in this PR | Rejected | This PR is research-only. UI migration comes after review. |
| Pull SellerCard-specific repository and VM behavior as part of Map Core | Rejected / B-Specific | SellerCard integration is a separate migration stream. Map may reference seller ids and minimal seller display records only. |
| Add offline cache before API ownership is reviewed | Optional / Conflict | Cache can mask backend/data bugs. Needs a small dedicated decision. |
| Add session restore before stale-data rules are reviewed | Optional / Conflict | LocalStorage snapshots can show stale seller/search data after backend changes. |
| Add `MapProjection.ts` now | B-Specific / Conflict | It depends on business events and route-start semantics outside the Map Core reconciliation boundary. |
| Make product search logic inside React UI | Rejected | Search ranking, fuzzy matching, and seller/product result shaping belong to Map Core / presentation, not JSX. |

## 6. Target Architecture

Target architecture for Repo A:

```text
Map Screen
  -> Map UI / Map interaction
    -> Map Core
      -> MapRuntime
      -> MapViewModel
      -> MapSheetAdapter
      -> MapAdapterTypes
      -> Repository facade
      -> Services: GeoService, ProductSearch, RouteService when accepted
        -> Repo A Platform Core contracts
        -> Repo A Design System tokens/components
```

Rules:

- Map UI renders prepared state and dispatches explicit actions.
- Map UI must not compute product-search ranking, seller filtering, route state, cache fallback, or market seller derivation.
- Repo A `react-vite-bootstrap-project/src/platform-core/` remains the only runtime Platform Core.
- Repo B Map Core files are candidates, not a second source tree.
- Repo A Design System remains canonical.
- New Map Core APIs must be minimal contracts needed by accepted UI behavior.

## 7. Migration Plan

Recommended next PR order:

1. Product/search foundation:
   - port `ProductSearch.ts`
   - extend Map search state
   - add repository product-search contract
   - add runtime search actions/tests
   - do not move UI yet
2. Repository facade:
   - introduce API-backed map repository using Repo A API-base normalization
   - keep mock fallback only where tests require it
   - avoid duplicating Buyer MVP API behavior
3. MapSearchAutocomplete UI migration:
   - connect to accepted search state/actions
   - reuse Repo A Design System
   - keep business logic out of JSX
4. Market core, if accepted:
   - market models
   - market repository methods
   - market runtime actions
   - MapSheetAdapter market blocks
5. Route core, if accepted:
   - route models/service/polyline
   - runtime route actions
   - adapter types for route geometry
6. Leaflet/visual helpers:
   - marker style helper
   - tile fallback only if accepted
   - POI toggle only if accepted
7. Optional persistence:
   - session restore
   - seller history
   - offline cache

Stop after this PR. The next implementation PR should be selected after review of this document.

## Definition of Done Check

- Map Core A/B compared: yes.
- New Map B dependencies identified: yes.
- Dependencies classified as Required / Optional / B-Specific / Obsolete / Conflict: yes.
- Required Repo A changes identified: yes.
- Second Platform Core not proposed: yes.
- Second Design System not proposed: yes.
- Map UI unchanged: yes.
- Existing screens unchanged: yes.
- Added `docs/ui-kit/map-core-reconciliation.md`: yes.
