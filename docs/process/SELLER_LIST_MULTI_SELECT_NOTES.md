# Seller List multi-select notes

## Backend contract

PR #31 passes selected sellers to Global Catalog as:

`/api/v1/catalog/products?seller_id=6,7`

The intended semantics are OR: products should match at least one selected seller.

Live backend check on `https://testapi.vnespecplanpodaz.online/api/v1/catalog` showed that `seller_id` is currently accepted but ignored:

- `/products?seller_id=6&limit=5` returns the same shape as `/products?limit=5`.
- `/products?seller_id=6,7&limit=5` returns the same shape.
- `/products?seller_id=999999&limit=5` still returns products.
- `/products?seller_id=abc&limit=1` returns `200`, not validation error.

So frontend wiring is ready, but actual seller filtering requires backend support for `seller_id` OR filtering on `GET /catalog/products`.

## Seller List click behavior

Seller List row click is now selection toggle for the multi-select flow. Seller List is no longer the primary entry point to `/seller/:sellerId`.

Seller Card remains a runtime capability for Map and other seller-entry scenarios.
