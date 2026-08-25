# Seller Card Reconciliation

## Executive Summary

Repo A remains the runtime and architecture baseline. Repo B contains a richer Seller Card presentation, but its full screen depends on Repo B Map runtime/repository, diagnostics, recommendations, report persistence and local controller logic. This PR ports only the safe Stage 1 presentation slice into Repo A: `/seller/:sellerId` is no longer a placeholder and renders seller data plus seller-scoped products through the existing Buyer Catalog API.

Reports and recommendations are deferred because Repo A has no confirmed backend/core contract for them in the current runtime.

Architecture note: `/seller/:sellerId` in Stage 1 is implemented as a Buyer `SellerCardScreen` on top of the existing Buyer Catalog API and GM UI Kit. The Platform Core Seller Card contract (`SellerCardViewModel`, `SellerCardBuilder`, `SellerCardAdapter`, `SellerCardScreen`) stays canonical and unchanged, but it is not a runtime dependency of this Buyer screen in this PR. Wiring the Buyer Seller Card runtime to Platform Core is deferred to a separate architecture stage.

## A/B Component Matrix

| Component | Repo A | Repo B | Decision |
| --- | --- | --- | --- |
| SellerCardScreen | Platform Core screen contract only; React route was placeholder | Full React screen | Required: add Repo A React screen over existing API |
| SellerCardHeader | StoreHome-style seller metadata exists | Rich header with avatar/rating/status | Selective port: name, description, market/place/hours only; no fake rating/status |
| SellerCardActions | Store catalog route helpers and seller contacts exist | favorite/share/route/report actions | Selective port: catalog and real contact links only |
| SellerCardProducts | Store Catalog product card/presentation exists | Seller product section | Required: reuse `toStoreProductCard` and `ProductCard` |
| SellerCardRecommendations | Missing confirmed Repo A contract | Depends on donor recommendations | Deferred |
| SellerCardReports/Dialog | Missing confirmed Repo A backend/core contract | Depends on donor local reports | Deferred |
| useSellerCardController | Not present | Mixes UI state, repository, runtime actions | Rejected for direct port |

## Dependency Matrix

| Donor dependency | Repo A status | Result |
| --- | --- | --- |
| Platform Core SellerCardViewModel/Builder/Adapter | Exists in Repo A | Keep Repo A |
| Donor `sellerRepository` facade | Missing in current main | Do not port |
| Buyer `fetchSeller` / `fetchSellerProducts` | Exists | Use |
| Product cards | Exists | Reuse |
| Reports/recommendations services | Missing confirmed runtime/API contract | Gap |
| GM UI Kit components | Exists | Reuse |

## Required Changes

- Replace `/seller/:sellerId` placeholder with a live Seller Card screen.
- Load seller data through `fetchSeller(sellerId)`.
- Load seller products through `fetchSellerProducts(sellerId)`.
- Render loading, error, not-found, empty and loaded states.
- Route product clicks through the existing global product flow.
- Route the main catalog action to `/store/:sellerId/catalog`, reusing the existing Store Catalog as the seller-scoped product list.
- Keep Store Mode unchanged; `/seller/:sellerId` remains blocked while Store Mode is active.

## Rejected Changes

- No second Platform Core.
- No donor SellerCardViewModel/Builder/Adapter copy.
- No donor repository/API client.
- No reports/recommendations until contracts exist.
- No Map/ProductSearch changes.

## Target Architecture

Repo A Router -> Buyer SellerCardScreen -> Buyer Catalog API -> Seller Card presentation -> GM UI Kit.

Platform Core ownership remains unchanged and is not bypassed for new Platform Core work; this PR only fills the Buyer route that was still a placeholder.

## Migration Plan

1. Review this Seller Card PR.
2. If reports/recommendations are required, add contracts in a separate PR.
3. Do not start Purchase Options until Seller Card is reviewed.
