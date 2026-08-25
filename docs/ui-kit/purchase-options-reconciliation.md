# Purchase Options Reconciliation

## Executive Summary

Repo A already contains the canonical Purchase Options Platform Core files:

- `PurchaseOptionsViewModel`
- `PurchaseOptionsPresentation`
- `PurchaseOptionsAdapter`
- `PurchaseOptionsBuilder`
- `PurchaseOptionsScreen`

The matching donor files in Repo B are not a missing runtime feature for the current Stage 1 Buyer UI. Repo A also already renders product price, unit, seller offer, stock and seller-scoped Store Product details through the Buyer MVP Product/Card flow.

Decision: this PR is docs-only. No new Purchase Options component, API client, repository, cart, checkout, payment, order flow or Platform Core change is added.

## A/B Matrix

| Area | Repo A | Repo B | Status | Decision |
| --- | --- | --- | --- | --- |
| Product presentation | Buyer `ProductScreen`, `ProductCard`, `OfferCard` | Product/Purchase-oriented specs and prototypes | Existing | Keep Repo A |
| Seller product | `SellerCatalogItem`, `fetchSellerProduct`, Store Product route | Seller-centric purchase option models | Existing | Keep Repo A scoped API |
| Price | `formatPrice`, global min price, store offer price | Purchase summary total cost | Existing | Keep separate semantics |
| Unit | `SellerCatalogItem.unit`, offer unit text | Product/unit in purchase option records | Existing | Keep Repo A |
| Quantity | Not exposed in Buyer Stage 1 UI | Basket/Purchase quantity models | Deferred | Needs transaction/cart contract |
| Purchase option | Platform Core `PurchaseOptionsViewModel` exists | Same conceptual Platform Core files | Canonical | Keep Repo A Platform Core |
| CTA | Product detail is informational; store/catalog navigation exists | PICK_PURCHASE / SELECT_PURCHASE_OPTION / basket/order flow | Deferred | No transaction CTA in Stage 1 |
| Add to cart / order | `/cart` placeholder only | Basket and Purchase Options path | B-Specific | Do not port |

## Component Classification

| Component / behavior | Classification | Reason |
| --- | --- | --- |
| `react-vite-bootstrap-project/src/platform-core/purchase_options/*` | Canonical | Already present in Repo A and semantically aligned with donor files. |
| `PurchaseOptionsBuilder` / `PurchaseOptionsScreen` | Canonical | Existing Platform Core screen contract; no UI route wiring required now. |
| Buyer `ProductScreen` offer list | Existing | Shows global seller offers and store-scoped single offer using current API. |
| Buyer `ProductCard` | Existing | Shows price/unit/stock metadata from prepared presentation model. |
| `QuantitySelector` / quantity controls | Deferred | No confirmed Buyer Stage 1 cart/order runtime or API contract. |
| Unit conversion / min quantity / step rules | Deferred | Not present in Repo A API contract. |
| Add-to-cart / checkout / payment CTA | Deferred | Transaction architecture is outside Stage 1 scope. |
| Donor Basket flow | B-Specific | Requires cart/order state and business flow not present in Repo A runtime. |

## Store Mode Check

Store Mode already uses the scoped route:

- `/store/:storeId/product/:productId`

That screen loads data through:

- `fetchSeller(storeId)`
- `fetchSellerProduct(storeId, productId, sellerProductId?)`

It does not use global product data when a store offer is missing. Therefore Purchase Options must not introduce multi-seller choices inside Store Mode unless a separate Store Mode purchase contract is approved.

## Deferred Transaction Logic

The following donor capabilities are intentionally not migrated:

- cart mutation;
- checkout;
- payment;
- orders;
- transaction FSM;
- quantity/min/step business rules;
- route/order confirmation after purchase option selection.

They require a confirmed backend/Core contract before implementation.

## Target Architecture

Current Stage 1:

`Buyer Product/Card flow -> Buyer Catalog API -> GM UI Kit`

Platform Core Purchase Options remains:

`PurchaseOptionsViewModel -> PurchaseOptionsPresentation -> PurchaseOptionsAdapter -> PurchaseOptionsBuilder -> PurchaseOptionsScreen`

No second Platform Core, ProductCard, API client or repository is introduced.

## Definition of Done

- Repo A/B Purchase Options were compared.
- Existing Repo A functionality is reused.
- `docs/ui-kit/purchase-options-reconciliation.md` is added.
- Platform Core is not changed.
- Store Mode is not changed.
- ProductCard/ProductScreen are not duplicated.
- Cart/Checkout/Payment/Orders are not added.
- No Map/ProductSearch/SellerCard runtime changes are included.

## Next Step

After this PR is reviewed, run the final A/B audit to confirm Repo B is no longer a runtime source for the Customer UI.
