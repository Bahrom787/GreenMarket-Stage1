# GreenMarket Repository Migration Manifest

**Status:** Draft for migration preparation
**Base repository:** `Bahrom787/GreenMarket-Stage1`
**Donor repository:** `rickorkeno-lang/GreenMarket`

## 1. Purpose

This document defines the migration boundary for consolidating the two GreenMarket repositories into a single repository.

The migration must not be performed as a blind Git merge.

`GreenMarket-Stage1` is the canonical base for the current Buyer MVP and Store Context.

`rickorkeno-lang/GreenMarket` is a donor for selected capabilities, primarily Map and Seller Card functionality.

The migration branch must reconcile these capabilities without regressing the accepted Stage1 architecture.

## 2. Repository Roles

### 2.1 Canonical Base

`Bahrom787/GreenMarket-Stage1` current `main` after PR #8/#9 is the base for migration.

The following functionality is already accepted and must remain canonical:

- Global Catalog
- Product Card
- Global Product Detail
- Store Home
- Store Catalog
- Store Product Detail
- Global Product Detail to Store Home
- Store Context
- Store routing
- current Buyer API semantics

### 2.2 Donor

`rickorkeno-lang/GreenMarket` contains capabilities that are more developed in the parallel implementation.

The donor repository must not replace the canonical Buyer MVP implementation wholesale.

## 3. Migration Statuses

| Status | Meaning |
|---|---|
| `KEEP_A` | Keep Stage1 implementation unchanged |
| `KEEP_B` | Use donor implementation as canonical |
| `MERGE_MANUALLY` | Both implementations contain required functionality and must be reconciled |
| `CANDIDATE_B` | Donor implementation may be migrated after dependency/reconciliation review |
| `SELECTIVE_PORT` | Only selected capabilities/files may be migrated |
| `SKIP` | Do not migrate |
| `BLOCKER` | Architectural decision required before migration |

No `CANDIDATE_B`, `SELECTIVE_PORT`, or `BLOCKER` item may be silently promoted to canonical implementation.

## 4. KEEP_A — Buyer MVP

Keep the Stage1 versions under:

```text
react-vite-bootstrap-project/src/buyer_mvp/
```

This includes `types.ts`, `api.ts`, `format.ts`, `screens/`, `components/`, `catalogContext/`, presentation models, Seller/Offer semantics, Store Home, Store Catalog and Store Product.

Do not replace these with the donor repository's older Buyer MVP implementation.

## 5. KEEP_A — Store Context

Keep Stage1 Store Context architecture.

Canonical routes:

```text
/store/:storeId
/store/:storeId/catalog
/store/:storeId/product/:productId
```

Canonical Runtime identity:

```text
StoreHome
```

`StoreHome` must not be represented as `SellerCard`.

Invariant:

```text
StoreHome != SellerCard
```

Store Context must remain isolated from Global Catalog. Donor migration must not introduce automatic `STORE -> GLOBAL` fallback behavior.

## 6. KEEP_A — Product Card

Keep Stage1 Product Card implementation.

Preserve `GLOBAL` / `STORE` context, seller-specific offer semantics, price semantics, offer count semantics, stock, photos attached to SellerProduct/offer, API normalization and current tests.

Do not replace with donor Product Card implementation.

## 7. KEEP_A — Product Detail

Keep Stage1 Product Detail implementation.

Preserve:

```text
GLOBAL Product Detail
STORE Product Detail
Product
SellerProduct / Offer
SellerProductPhoto
```

No Product-level gallery may be reintroduced.

Invariant:

```text
Offer A photos != Offer B photos
```

## 8. KEEP_A — Global to Store Navigation

Keep the implementation introduced by PR #8.

Canonical behavior:

```text
Global Product Detail
        -> selected Seller Offer
        -> SellerOffer.seller_id
        -> /store/{seller_id}
```

Different sellers must produce different Store paths. Multiple offers belonging to the same seller must produce the same Store Home path.

## 9. KEEP_A — Buyer MVP API Contract

Keep the current Stage1 Buyer API contract, including:

```text
SellerCardResponse
SellerCatalogItem
SellerCatalogResponse
SellerOffer
```

The donor's older Buyer MVP API/types must not replace these models.

## 10. MERGE_MANUALLY — Runtime

Runtime must be reconciled between both repositories.

Stage1 is the base because it contains the current Store-aware Runtime. Donor contains additional Map-related Runtime behavior.

Required result:

```text
Global Runtime + Store Runtime + Map Runtime
```

without changing canonical Store semantics.

The reconciled Runtime must distinguish `Global Catalog`, `Global Product`, `StoreHome`, `StoreCatalog`, `StoreProduct`, `Map`, `SellerList`, and `SellerCard` where applicable.

## 11. MERGE_MANUALLY — RuntimeRouteSync

Use Stage1 `RuntimeRouteSync` as the base. Donor Map-specific behavior may be selectively incorporated.

Do not replace Stage1 routing wholesale.

Required invariants:

```text
/                       -> Global Catalog
/product/:id            -> Global Product Detail
/map                    -> Map
/store/:id              -> StoreHome
/store/:id/catalog      -> Store Catalog
/store/:id/product/:id  -> Store Product
```

Direct open and refresh must preserve the canonical route. Store routes must not be rewritten to Global routes.

## 12. MERGE_MANUALLY — Route Mapping

Donor contains Map Surface semantics where some screens are treated as Map/Bottom Sheet content rather than independent URL routes.

This must be reconciled with Stage1 Store routing. Do not copy donor route mapping wholesale.

The final implementation must preserve:

```text
/store/:storeId <-> StoreHome
```

and must not convert StoreHome into SellerCard.

## 13. BLOCKER — Platform Core Copies

Both repositories contain multiple Platform Core copies:

```text
greenmarket/GreenMarket/
react-vite-bootstrap-project/src/platform-core/
```

Before final migration, determine which copy is the canonical library source, which copy is an application/runtime copy, how synchronization is intended to work, and whether copies are generated, manually synchronized, or independently maintained.

Do not merge four Platform Core copies into the final repository. The final repository must have an explicitly understood Platform Core ownership model.

## 14. MERGE_MANUALLY — Platform Contracts

Pay special attention to:

```text
contracts/Action.ts
contracts/ContentBlock.ts
contracts/DomainTypes.ts
contracts/LoadState.ts
contracts/ViewState.ts
```

Do not select a version merely because it has more code. Every conflicting contract requires semantic comparison and must preserve Store Context and current Buyer MVP behavior.

## 15. CANDIDATE_B — Seller Card

Donor contains a substantially more complete Seller Card implementation.

Candidate components:

```text
SellerCardScreenView
SellerCardHeader
SellerCardActions
SellerCardProducts
SellerCardReports
SellerCardRecommendations
SellerCardReportDialog
useSellerCardController
```

These may be migrated only after reconciliation of ScreenDefinition, Action Catalog, Runtime, Map Surface, API adapter, ViewModel, Platform Interface and tests.

Do not migrate only the visual component while leaving incompatible donor dependencies behind.

## 16. Seller Card Semantics

The final architecture must explicitly distinguish:

```text
SellerCard
```

from:

```text
StoreHome
```

SellerCard may be a Map Surface / Bottom Sheet representation.

StoreHome is `/store/:storeId` and represents the isolated buyer service of a specific store.

The migration must not regress to:

```text
SellerCard == StoreHome
```

## 17. CANDIDATE_B — Map

Donor contains a significantly more developed Map subsystem.

Candidate capabilities include MapRuntime, Map repositories, Map persistence, Map cache, Map history, Map recommendations, Map product search, Map routing, Map projection, Map fullscreen, Map autocomplete and Map UI overlays.

These are candidates only. Do not copy the donor Map directory wholesale.

Each capability must be evaluated against current Stage1 Platform Core, Runtime, API contract, Map work, existing Map repository and documentation.

## 18. SELECTIVE_PORT — Seller List

Use Stage1 as the base for routing, Store Context and current API semantics.

Donor Seller List functionality may be selectively ported where it adds capability not already present. Do not replace Stage1 navigation wholesale.

## 19. SELECTIVE_PORT — Map Tests

Donor tests may be migrated for MapRuntime, Map persistence, Map routing, Map repositories, Map UI and Map state after adapting them to reconciled Runtime and Platform Core.

Tests that assert obsolete donor routing semantics must not be copied unchanged.

## 20. SELECTIVE_PORT — Seller Card Tests

Migrate donor Seller Card tests only after Seller Card architecture has been reconciled.

Tests must be updated to final `SellerCard` vs `StoreHome` semantics.

## 21. KEEP_A — Stage1 Buyer Tests

Keep all accepted Stage1 tests for Catalog, Product Card, Product Detail, Store Context, Store Home, Global to Store, Runtime and API normalization.

Migration must not reduce existing Stage1 test coverage.

## 22. Documentation

`KEEP_A`: current Stage1 documentation describing Store Context, Product Card, Product Detail, Store Home, Global to Store, Green Board branding and current API semantics.

`CANDIDATE_B`: donor documentation may be migrated where it describes still-valid Map architecture, Seller Card, Bottom Sheet, Map Runtime and Map infrastructure.

`SKIP`: obsolete or superseded Buyer MVP architecture.

Documentation must not silently become canonical merely because it exists in the donor repository.

## 23. AI Agent Contract

The migration must preserve the distinction between `Canonical`, `Existing`, `Candidate`, and `Planned/Missing`.

Map and Seller Card remain candidates until reconciliation is complete.

## 24. Explicitly Not Replaced Wholesale

The following Stage1 areas must not be replaced wholesale by donor versions:

```text
buyer_mvp/
StoreHome/
StoreCatalog/
StoreProduct/
ProductDetail/
ProductCard/
GlobalCatalog/
RuntimeRouteSync
NavigationContainer
current Buyer API contract
current Store routing
```

Individual files inside these areas may change only if the migration diff demonstrates a concrete compatibility requirement.

## 25. Migration Branch Procedure

Create a dedicated migration branch from Stage1 `main`. Add the donor repository as a Git remote.

Do not perform the migration directly on `main`.

## 26. Required Migration Phases

1. Inventory
2. Platform Core reconciliation
3. Runtime reconciliation
4. Candidate migration
5. Tests
6. Documentation
7. Validation

Validation includes `npm test`, `npm run lint`, `npm run build`, and relevant browser/Playwright QA.

## 27. Migration Branch Acceptance Criteria

The migration branch is not ready for merge until:

- no duplicate Platform Core ownership remains unexplained
- StoreHome remains distinct from SellerCard
- Store routes remain canonical
- Buyer MVP contract remains Stage1-compatible
- Global Product Detail to Store Home remains functional
- Product-level gallery is not reintroduced
- Map capabilities are explicitly classified
- Seller Card capabilities are explicitly classified
- donor routing does not override Store routing
- existing Stage1 tests continue to pass
- migrated donor tests pass after adaptation
- lint passes
- build passes
- browser QA passes
- no unresolved semantic conflicts remain
- all remaining Candidates are explicitly documented
- no Candidate has silently become Canonical

## 28. Final Merge Rule

The migration branch must not be merged into `main` merely because `git merge`, `npm test`, and `npm run build` succeed.

Merge is allowed only when Git conflicts, semantic conflicts and architectural blockers are all zero, and tests/QA pass.

## 29. Final Target Architecture

```text
Unified GreenMarket
├── Buyer MVP
├── Platform Core
├── Map
├── Seller Card
├── Seller List
├── Tests
└── Documentation
```

The canonical Buyer/Store implementation originates from Stage1.

Map and Seller Card are incorporated only after reconciliation with the canonical Platform/Runtime architecture.
