# Migration Preparation Report

**Branch:** `codex/map-repo-migration-prep`
**Base:** `origin/main` after PR #8 and PR #9
**Donor remote:** `donor-greenmarket` -> `https://github.com/rickorkeno-lang/GreenMarket.git`
**Donor branch inspected:** `donor-greenmarket/main`

## Scope

This branch prepares the migration, but does not merge donor code into `main`.

The donor diff was inspected against the accepted Stage1 base. Because the donor changes overlap with Store Context, Buyer MVP, Runtime routing and Platform Core ownership, this branch intentionally stops at Phase 1 inventory and conflict classification.

## Repository Inventory

| Area | Stage1 | Donor | Status | Decision |
|---|---:|---:|---|---|
| Total files | 305 | 345 | Inventory | Donor is larger, but size is not a merge criterion. |
| Map-related files | 24 | 67 | `CANDIDATE_B` / `SELECTIVE_PORT` | Donor has more Map capabilities; do not copy wholesale. |
| SellerCard-related files | 9 | 19 | `CANDIDATE_B` | Donor has richer Seller Card UI; requires architecture reconciliation. |
| Platform Core-related files | 152 | 200 | `BLOCKER` / `MERGE_MANUALLY` | Ownership model must be resolved before code migration. |
| Buyer MVP | Stage1 Store-aware | Donor older/parallel | `KEEP_A` | Keep Stage1 Buyer MVP and Store semantics. |

## Donor Diff Risk Summary

The donor diff includes changes that would violate the manifest if applied blindly:

- deletes Stage1 Store-aware tests under `react-vite-bootstrap-project/src/buyer_mvp/__tests__/`
- deletes Stage1 `catalogContext.ts`, `catalogPresentation.ts`, `homePresentation.ts`, `productDetailPresentation.ts`, `storeHomePresentation.ts`
- deletes Stage1 `StoreHomeScreen.tsx`
- deletes Stage1 `StoreHomeBuilder.ts`, `StoreHomeScreen.ts`, and `StoreHomeViewModel.ts`
- replaces or renames `RuntimeRouteMapping.ts` with donor `routeMapping.ts`
- modifies `NavigationContainer.tsx` and `RuntimeRouteSync.tsx`
- modifies Buyer MVP API/types and Product/Card/Detail components
- adds substantial Map runtime, persistence, routing, repository, history, recommendations and UI overlays
- adds richer Seller Card screen components, but with dependencies that are not yet reconciled with StoreHome semantics

## Prepared Decisions

| Subsystem | Status | Prepared Decision |
|---|---|---|
| `react-vite-bootstrap-project/src/buyer_mvp/` | `KEEP_A` | Do not replace. Stage1 remains canonical. |
| Store routes | `KEEP_A` | Preserve `/store/:storeId`, `/store/:storeId/catalog`, `/store/:storeId/product/:productId`. |
| StoreHome runtime identity | `KEEP_A` | Preserve `StoreHome`; do not map it to `SellerCard`. |
| Product Card | `KEEP_A` | Preserve `GLOBAL` / `STORE` context semantics. |
| Product Detail | `KEEP_A` | Preserve Global/Store split and offer photo semantics. |
| Global Product Detail to Store Home | `KEEP_A` | Preserve PR #8 behavior. |
| Runtime | `MERGE_MANUALLY` | Stage1 base plus selective donor Map behavior only after semantic reconciliation. |
| RuntimeRouteSync | `MERGE_MANUALLY` | Stage1 base; donor Map behavior may be selectively ported. |
| Route mapping | `MERGE_MANUALLY` | Preserve Stage1 Store routes; do not copy donor mapping wholesale. |
| Platform Core copies | `BLOCKER` | Decide ownership of `greenmarket/GreenMarket/` vs `react-vite-bootstrap-project/src/platform-core/`. |
| Platform contracts | `MERGE_MANUALLY` | Compare semantics before changing `Action`, `ContentBlock`, `DomainTypes`, `LoadState`, `ViewState`. |
| Map subsystem | `CANDIDATE_B` / `SELECTIVE_PORT` | Classify each capability before migration. |
| Seller Card | `CANDIDATE_B` | Candidate only until StoreHome/SellerCard semantics and dependencies are reconciled. |
| Seller List | `SELECTIVE_PORT` | Stage1 routing/API remain base; donor enhancements need review. |
| Donor tests | `SELECTIVE_PORT` | Port only after runtime and semantics are reconciled. |
| Donor docs | `CANDIDATE_B` / `SKIP` | Keep only still-valid Map/SellerCard docs. |

## Unresolved Semantic Conflicts

These conflicts block code migration:

1. **Platform Core ownership**
   The repository contains both `greenmarket/GreenMarket/` and `react-vite-bootstrap-project/src/platform-core/`. Donor has the same pattern. The canonical source and sync model are not defined.

2. **StoreHome vs SellerCard**
   Stage1 treats `/store/:storeId` as `StoreHome`. Donor has richer SellerCard/Map Surface behavior. The migration must define whether SellerCard is a map/bottom-sheet surface only, while StoreHome remains an isolated Store route.

3. **RuntimeRouteSync and route mapping**
   Donor routing changes overlap with Stage1 canonical routes. Stage1 `RuntimeRouteSync` must remain the base.

4. **Buyer MVP API/types**
   Donor changes overlap with Stage1 Store-aware `SellerCardResponse`, `SellerCatalogItem`, `SellerCatalogResponse`, and `SellerOffer`. Replacing them would regress accepted Store Context behavior.

5. **Map dependency boundaries**
   Donor Map capabilities depend on expanded runtime/repositories/persistence/routing. Each capability needs dependency review before selective port.

6. **SellerCard dependencies**
   Donor SellerCard UI depends on ScreenDefinition, Action Catalog, Runtime, Map Surface, API adapter, ViewModel and tests. Porting visuals alone is unsafe.

7. **Tests semantics**
   Donor tests may assert obsolete donor routing or non-Store-aware behavior. They must be adapted, not copied unchanged.

## Branch Diff

This prepared branch intentionally contains only migration documentation:

```text
docs/merge/MIGRATION-MANIFEST.md
docs/merge/MIGRATION-PREP-REPORT.md
```

No app code, Platform Core, Buyer MVP, Map or Seller Card implementation files are changed in this preparation branch.

## Next Step

Review the unresolved semantic conflicts. After ownership and route semantics are accepted, create the next migration PR for one narrow slice only, preferably Map capability inventory or a single Map module with adapted tests.
